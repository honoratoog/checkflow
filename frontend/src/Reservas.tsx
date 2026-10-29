import { useEffect, useState } from "react";
import { api, Quarto, Hospede, Reserva, ExtratoReserva } from "./api";
import { Erro } from "./Erro";
import { Sucesso } from "./Sucesso";
import { Lookup } from "./Lookup";

const estiloStatusReserva: Record<Reserva["status"], string> = {
    Reservado: "bg-ink/5 text-ink/70",
    "Em andamento": "bg-status-ocupado/10 text-status-ocupado",
    Finalizado: "bg-ink/5 text-ink/40",
};

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Compara só a data (sem horário) para a contagem de noites não variar conforme a hora do dia em que a tela é aberta.
function dataSomenteDia(valor: string): number {
    return new Date(valor.slice(0, 10)).getTime();
}

function calcularValorAPagar(reserva: Reserva, quartos: Quarto[]): number | null {
    if (reserva.valor_total !== undefined && reserva.valor_total !== null) {
        return reserva.valor_total;
    }
    if (reserva.status === "Reservado") return null;
    // Defensivo: reservas finalizadas antes da API passar a registrar data_checkout.
    if (reserva.status === "Finalizado" && !reserva.data_checkout) return null;

    const quarto = quartos.find((q) => q.id === reserva.quarto_id);
    const diaria = reserva.diaria_base ?? quarto?.diaria_base;
    if (!diaria) return null;

    const inicio = dataSomenteDia(reserva.data_checkin);
    const fim = dataSomenteDia(reserva.data_checkout ?? new Date().toISOString());
    const noites = Math.max(1, Math.round((fim - inicio) / (1000 * 60 * 60 * 24)));
    const consumos = reserva.total_consumos ?? 0;

    return noites * diaria + consumos;
}

export function Reservas() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [hospedes, setHospedes] = useState<Hospede[]>([]);

    const [quartoId, setQuartoId] = useState("");
    const [hospedeId, setHospedeId] = useState("");
    const [dataCheckin, setDataCheckin] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processando, setProcessando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [formularioKey, setFormularioKey] = useState(0);

    const [buscaHospede, setBuscaHospede] = useState("");
    const [buscaQuarto, setBuscaQuarto] = useState("");
    const [buscaCheckin, setBuscaCheckin] = useState("");
    const [buscaCheckout, setBuscaCheckout] = useState("");
    const [filtro, setFiltro] = useState({ hospede: "", quarto: "", checkin: "", checkout: "" });

    // Estado do modal de confirmação de check-out com extrato detalhado
    const [reservaParaCheckout, setReservaParaCheckout] = useState<Reserva | null>(null);
    const [extratoModal, setExtratoModal] = useState<ExtratoReserva | null>(null);
    const [carregandoExtrato, setCarregandoExtrato] = useState(false);
    const [erroModal, setErroModal] = useState("");

    function carregar() {
        setCarregando(true);
        Promise.all([api.listarReservas(), api.listarQuartos(), api.listarHospedes()])
            .then(([listaReservas, listaQuartos, listaHospedes]) => {
                setReservas(listaReservas);
                setQuartos(listaQuartos);
                setHospedes(listaHospedes);
            })
            .catch((err: Error) => setErro(err.message))
            .finally(() => setCarregando(false));
    }

    useEffect(() => {
        carregar();
    }, []);

    async function criarReserva(e: React.FormEvent) {
        e.preventDefault();
        if (!quartoId || !hospedeId || !dataCheckin) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.criarReserva(Number(quartoId), Number(hospedeId), dataCheckin);
            setQuartoId("");
            setHospedeId("");
            setDataCheckin("");
            setFormularioKey((k) => k + 1);
            setSucesso("Reserva criada com sucesso.");
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    async function fazerCheckin(id: number) {
        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.checkin(id);
            setSucesso("Check-in realizado com sucesso.");
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    async function iniciarCheckout(r: Reserva) {
        setReservaParaCheckout(r);
        setCarregandoExtrato(true);
        setErroModal("");
        try {
            const extrato = await api.obterExtrato(r.id);
            setExtratoModal(extrato);
        } catch (err: any) {
            setErroModal(err.message || "Erro ao carregar o extrato da estadia.");
        } finally {
            setCarregandoExtrato(false);
        }
    }

    function fecharModalCheckout() {
        setReservaParaCheckout(null);
        setExtratoModal(null);
        setErroModal("");
    }

    async function confirmarCheckout() {
        if (!reservaParaCheckout) return;
        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.checkout(reservaParaCheckout.id);
            setSucesso(`Check-out da reserva #${reservaParaCheckout.id} (Quarto ${reservaParaCheckout.quarto_numero}) realizado com sucesso.`);
            fecharModalCheckout();
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    async function excluirReserva(id: number) {
        if (!confirm("Excluir essa reserva? Essa ação não pode ser desfeita.")) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.excluirReserva(id);
            setSucesso("Reserva excluída com sucesso.");
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    function pesquisar(e: React.FormEvent) {
        e.preventDefault();
        setFiltro({ hospede: buscaHospede, quarto: buscaQuarto, checkin: buscaCheckin, checkout: buscaCheckout });
    }

    function formatarData(data: string) {
        const [ano, mes, dia] = data.slice(0, 10).split("-");
        return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
    }

    const reservasOrdenadas = [...reservas].sort((a, b) => b.data_checkin.localeCompare(a.data_checkin));
    const quartosOrdenados = [...quartos].sort((a, b) => a.numero.localeCompare(b.numero, "pt-BR", { numeric: true }));
    const hospedesOrdenados = [...hospedes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    const hospedeFiltro = filtro.hospede.trim().toLocaleLowerCase("pt-BR");
    const quartoFiltro = filtro.quarto.trim().toLocaleLowerCase("pt-BR");
    const filtroAtivo = Boolean(filtro.hospede || filtro.quarto || filtro.checkin || filtro.checkout);
    const reservasFiltradas = reservasOrdenadas.filter(
        (r) =>
            (!hospedeFiltro || r.hospede_nome.toLocaleLowerCase("pt-BR").includes(hospedeFiltro)) &&
            (!quartoFiltro || r.quarto_numero.toLocaleLowerCase("pt-BR").includes(quartoFiltro)) &&
            (!filtro.checkin || r.data_checkin.slice(0, 10) === filtro.checkin) &&
            (!filtro.checkout || r.data_checkout?.slice(0, 10) === filtro.checkout)
    );

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-3xl text-ink">Reservas</h2>
                <p className="text-ink/60 mt-1">Crie estadias e controle check-in e check-out.</p>
            </div>

            <form onSubmit={criarReserva} className="bg-white border border-ink/10 rounded-sm p-5 flex gap-3 flex-wrap items-end">
                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Quarto</span>
                    <Lookup
                        key={`quarto-${formularioKey}`}
                        items={quartosOrdenados}
                        value={quartoId}
                        onChange={setQuartoId}
                        getId={(q) => q.id}
                        getLabel={(q) => `Quarto ${q.numero} — ${q.tipo} — ${q.status}`}
                        placeholder="Buscar quarto"
                    />
                </label>

                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Hóspede</span>
                    <Lookup
                        key={`hospede-${formularioKey}`}
                        items={hospedesOrdenados}
                        value={hospedeId}
                        onChange={setHospedeId}
                        getId={(h) => h.id}
                        getLabel={(h) => h.nome}
                        placeholder="Buscar hóspede"
                    />
                </label>

                <label className="min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Check-in</span>
                    <input
                        type="date"
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        value={dataCheckin}
                        onChange={(e) => setDataCheckin(e.target.value)}
                    />
                </label>

                <button disabled={processando} className="bg-teal text-white px-5 py-2 rounded-sm hover:bg-teal-dark transition-colors disabled:opacity-50" type="submit">
                    {processando ? "Processando..." : "Reservar"}
                </button>
            </form>

            <Erro mensagem={erro} />
            <Sucesso mensagem={sucesso} />

            <form onSubmit={pesquisar} className="bg-white border border-ink/10 rounded-sm p-5 flex gap-3 flex-wrap items-end">
                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Hóspede</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Nome do hóspede"
                        value={buscaHospede}
                        onChange={(e) => setBuscaHospede(e.target.value)}
                    />
                </label>

                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Quarto</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Número do quarto"
                        value={buscaQuarto}
                        onChange={(e) => setBuscaQuarto(e.target.value)}
                    />
                </label>

                <label className="min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Check-in</span>
                    <input
                        type="date"
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        value={buscaCheckin}
                        onChange={(e) => setBuscaCheckin(e.target.value)}
                    />
                </label>

                <label className="min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Check-out</span>
                    <input
                        type="date"
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        value={buscaCheckout}
                        onChange={(e) => setBuscaCheckout(e.target.value)}
                    />
                </label>

                <button className="bg-ink text-white px-5 py-2 rounded-sm hover:bg-ink/80 transition-colors" type="submit">
                    Pesquisar
                </button>
            </form>

            <div className="bg-white border border-ink/10 rounded-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left border-b border-ink/10 text-ink/50">
                            <th className="py-3 px-4 font-normal">Quarto</th>
                            <th className="py-3 px-4 font-normal">Hóspede</th>
                            <th className="py-3 px-4 font-normal">Check-in</th>
                            <th className="py-3 px-4 font-normal">Status</th>
                            <th className="py-3 px-4 font-normal">Valor a pagar</th>
                            <th className="py-3 px-4 font-normal">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservasFiltradas.map((r) => {
                            const valorAPagar = calcularValorAPagar(r, quartos);
                            return (
                            <tr key={r.id} className="border-b border-ink/5 last:border-0">
                                <td className="py-3 px-4">Quarto {r.quarto_numero}</td>
                                <td className="py-3 px-4">{r.hospede_nome}</td>
                                <td className="py-3 px-4 text-ink/70 whitespace-nowrap">{formatarData(r.data_checkin)}</td>
                                <td className="py-3 px-4">
                                    <span className={`text-xs px-2 py-1 rounded-sm ${estiloStatusReserva[r.status]}`}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-ink/70 whitespace-nowrap">
                                    {valorAPagar !== null ? (
                                        <span title={r.status === "Em andamento" ? "Valor parcial até hoje: diárias + consumos lançados" : "Total da estadia (diárias + consumos)"}>
                                            {formatoMoeda.format(valorAPagar)}
                                        </span>
                                    ) : (
                                        <span className="text-ink/40" title="Aguardando a diária do quarto ser cadastrada no backend">
                                            —
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 space-x-3">
                                    {r.status === "Reservado" && (
                                        <button disabled={processando} onClick={() => fazerCheckin(r.id)} className="text-teal-dark hover:underline disabled:opacity-50">
                                            Check-in
                                        </button>
                                    )}
                                    {r.status === "Em andamento" && (
                                        <button disabled={processando} onClick={() => iniciarCheckout(r)} className="text-teal-dark hover:underline disabled:opacity-50">
                                            Check-out
                                        </button>
                                    )}
                                    <button
                                        onClick={() => excluirReserva(r.id)}
                                        disabled={processando}
                                        className="text-ink/40 hover:text-status-pendente"
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                            );
                        })}
                        {!carregando && reservasFiltradas.length === 0 && (
                            <tr>
                                <td className="py-4 px-4 text-ink/50" colSpan={6}>
                                    {filtroAtivo ? "Nenhuma reserva encontrada para essa busca." : "Nenhuma reserva criada ainda."}
                                </td>
                            </tr>
                        )}
                        {carregando && <tr><td className="py-4 px-4 text-ink/50" colSpan={6}>Carregando reservas...</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal de Extrato Resumo para Confirmação de Check-out */}
            {reservaParaCheckout && (
                <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm shadow-xl max-w-lg w-full border border-ink/10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-ink/10 flex justify-between items-center">
                            <div>
                                <h3 className="font-serif text-xl text-ink">Extrato de Check-out</h3>
                                <p className="text-xs text-ink/60 mt-0.5">
                                    Quarto {reservaParaCheckout.quarto_numero} — Hóspede: {reservaParaCheckout.hospede_nome}
                                </p>
                            </div>
                            <button
                                onClick={fecharModalCheckout}
                                disabled={processando}
                                className="text-ink/40 hover:text-ink text-2xl leading-none px-1"
                                aria-label="Fechar"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 text-sm">
                            {carregandoExtrato && <p className="text-ink/60">Carregando extrato da estadia...</p>}
                            {erroModal && <p className="text-status-pendente text-sm">{erroModal}</p>}

                            {extratoModal && (
                                <>
                                    <div className="bg-sand/30 p-3 rounded-sm space-y-1.5 border border-ink/10">
                                        <div className="flex justify-between text-ink/70 text-xs">
                                            <span>Período da estadia:</span>
                                            <span className="font-medium text-ink">
                                                {formatarData(extratoModal.data_checkin)} até {formatarData(extratoModal.data_checkout || new Date().toISOString().slice(0, 10))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-ink/70">
                                            <span>
                                                Diárias ({extratoModal.dias_hospedado} {extratoModal.dias_hospedado === 1 ? "diária" : "diárias"} &times; {formatoMoeda.format(extratoModal.diaria)}):
                                            </span>
                                            <span className="font-medium text-ink">{formatoMoeda.format(extratoModal.subtotal_diarias)}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-ink text-xs uppercase tracking-wider mb-2">Consumos do Minibar</h4>
                                        {extratoModal.consumos.length === 0 ? (
                                            <p className="text-xs text-ink/50 italic bg-ink/5 p-3 rounded-sm">
                                                Nenhum consumo de frigobar registrado para esta estadia.
                                            </p>
                                        ) : (
                                            <div className="border border-ink/10 rounded-sm overflow-hidden">
                                                <table className="w-full text-xs">
                                                    <thead className="bg-ink/5 text-ink/60 border-b border-ink/10">
                                                        <tr>
                                                            <th className="py-2 px-3 text-left font-normal">Item</th>
                                                            <th className="py-2 px-3 text-center font-normal">Qtd</th>
                                                            <th className="py-2 px-3 text-right font-normal">Unitário</th>
                                                            <th className="py-2 px-3 text-right font-normal">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {extratoModal.consumos.map((c, i) => (
                                                            <tr key={c.id ?? i} className="border-b border-ink/5 last:border-0">
                                                                <td className="py-2 px-3 text-ink">{c.item}</td>
                                                                <td className="py-2 px-3 text-center text-ink/70">{c.quantidade}</td>
                                                                <td className="py-2 px-3 text-right text-ink/70">{formatoMoeda.format(c.valor_unitario)}</td>
                                                                <td className="py-2 px-3 text-right font-medium text-ink">{formatoMoeda.format(c.subtotal)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-sand/20 border-t border-ink/10 text-ink/70 font-medium">
                                                        <tr>
                                                            <td colSpan={3} className="py-2 px-3 text-right font-normal">Subtotal minibar:</td>
                                                            <td className="py-2 px-3 text-right text-ink">{formatoMoeda.format(extratoModal.total_consumos)}</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-3 border-t border-ink/10 flex justify-between items-baseline">
                                        <span className="font-serif text-lg text-ink">Total a pagar:</span>
                                        <span className="font-serif text-2xl font-bold text-teal-dark">
                                            {formatoMoeda.format(extratoModal.total_a_pagar)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 bg-ink/5 border-t border-ink/10 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={processando}
                                onClick={fecharModalCheckout}
                                className="px-4 py-2 border border-ink/15 text-ink/70 rounded-sm hover:bg-ink/5 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={processando || carregandoExtrato || Boolean(erroModal)}
                                onClick={confirmarCheckout}
                                className="bg-teal text-white px-5 py-2 rounded-sm hover:bg-teal-dark transition-colors disabled:opacity-50"
                            >
                                {processando ? "Processando..." : "Confirmar Check-out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
