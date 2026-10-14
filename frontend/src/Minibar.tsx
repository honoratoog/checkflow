import { useEffect, useState } from "react";
import { api, ConsumoMinibar, Reserva } from "./api";
import { Erro } from "./Erro";
import { Sucesso } from "./Sucesso";
import { Lookup } from "./Lookup";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Minibar() {
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [reservaId, setReservaId] = useState("");
    const [consumos, setConsumos] = useState<ConsumoMinibar[]>([]);

    const [item, setItem] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [valorUnitario, setValorUnitario] = useState("");

    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processando, setProcessando] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [carregandoConsumos, setCarregandoConsumos] = useState(false);

    function carregar() {
        setCarregando(true);
        api.listarReservas().then(setReservas).catch((err: Error) => setErro(err.message)).finally(() => setCarregando(false));
    }

    useEffect(() => {
        carregar();
    }, []);

    function carregarConsumos(id: string) {
        if (!id) {
            setConsumos([]);
            return;
        }
        setCarregandoConsumos(true);
        api.listarConsumosMinibar(Number(id))
            .then(setConsumos)
            .catch((err: Error) => setErro(err.message))
            .finally(() => setCarregandoConsumos(false));
    }

    useEffect(() => {
        carregarConsumos(reservaId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reservaId]);

    async function lancarConsumo(e: React.FormEvent) {
        e.preventDefault();
        const qtd = Number(quantidade);
        const valor = Number(valorUnitario);
        if (!reservaId || !item || !(qtd > 0) || !(valor > 0)) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.lancarConsumoMinibar(Number(reservaId), item, qtd, valor);
            setItem("");
            setQuantidade("1");
            setValorUnitario("");
            setSucesso("Consumo lançado com sucesso.");
            carregarConsumos(reservaId);
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    async function excluirConsumo(id: number) {
        if (!confirm("Excluir esse consumo? Essa ação não pode ser desfeita.")) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.excluirConsumoMinibar(id);
            setSucesso("Consumo excluído com sucesso.");
            carregarConsumos(reservaId);
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    const estadiasEmAndamento = reservas
        .filter((r) => r.status === "Em andamento")
        .sort((a, b) => a.quarto_numero.localeCompare(b.quarto_numero, "pt-BR", { numeric: true }));
    const subtotalMinibar = consumos.reduce((soma, c) => soma + c.quantidade * c.valor_unitario, 0);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-3xl text-ink">Minibar</h2>
                <p className="text-ink/60 mt-1">Lance os consumos do minibar de estadias em andamento.</p>
            </div>

            {carregando && <p className="text-sm text-ink/50">Carregando estadias...</p>}

            {!carregando && estadiasEmAndamento.length === 0 && (
                <p className="text-sm text-ink/50">Nenhuma estadia em andamento no momento.</p>
            )}

            {!carregando && estadiasEmAndamento.length > 0 && (
                <>
                    <div className="bg-white border border-ink/10 rounded-sm p-5 max-w-md">
                        <span className="block text-xs text-ink/50 mb-1">Estadia</span>
                        <Lookup
                            items={estadiasEmAndamento}
                            value={reservaId}
                            onChange={setReservaId}
                            getId={(r) => r.id}
                            getLabel={(r) => `Quarto ${r.quarto_numero} — ${r.hospede_nome}`}
                            placeholder="Buscar estadia em andamento"
                        />
                    </div>

                    <Erro mensagem={erro} />
                    <Sucesso mensagem={sucesso} />

                    {reservaId && (
                        <>
                            <form onSubmit={lancarConsumo} className="bg-white border border-ink/10 rounded-sm p-5 flex gap-3 flex-wrap items-end">
                                <label className="flex-1 min-w-[160px]">
                                    <span className="block text-xs text-ink/50 mb-1">Item</span>
                                    <input
                                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                                        placeholder="Ex: Água, Refrigerante"
                                        value={item}
                                        onChange={(e) => setItem(e.target.value)}
                                    />
                                </label>
                                <label className="min-w-[110px]">
                                    <span className="block text-xs text-ink/50 mb-1">Quantidade</span>
                                    <input
                                        type="number"
                                        min={1}
                                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(e.target.value)}
                                    />
                                </label>
                                <label className="min-w-[140px]">
                                    <span className="block text-xs text-ink/50 mb-1">Valor unitário</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                                        placeholder="0,00"
                                        value={valorUnitario}
                                        onChange={(e) => setValorUnitario(e.target.value)}
                                    />
                                </label>
                                <button disabled={processando} className="bg-teal text-white px-5 py-2 rounded-sm hover:bg-teal-dark transition-colors disabled:opacity-50" type="submit">
                                    {processando ? "Lançando..." : "Lançar consumo"}
                                </button>
                            </form>

                            <div className="bg-white border border-ink/10 rounded-sm overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-ink/10 text-ink/50">
                                            <th className="py-3 px-4 font-normal">Item</th>
                                            <th className="py-3 px-4 font-normal">Quantidade</th>
                                            <th className="py-3 px-4 font-normal">Valor unitário</th>
                                            <th className="py-3 px-4 font-normal">Subtotal</th>
                                            <th className="py-3 px-4 font-normal">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {consumos.map((c) => (
                                            <tr key={c.id} className="border-b border-ink/5 last:border-0">
                                                <td className="py-3 px-4">{c.item}</td>
                                                <td className="py-3 px-4 text-ink/70">{c.quantidade}</td>
                                                <td className="py-3 px-4 text-ink/70 whitespace-nowrap">{formatoMoeda.format(c.valor_unitario)}</td>
                                                <td className="py-3 px-4 text-ink/70 whitespace-nowrap">
                                                    {formatoMoeda.format(c.quantidade * c.valor_unitario)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => excluirConsumo(c.id)}
                                                        disabled={processando}
                                                        className="text-sm text-ink/40 hover:text-status-pendente"
                                                    >
                                                        Excluir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {!carregandoConsumos && consumos.length === 0 && (
                                            <tr>
                                                <td className="py-4 px-4 text-ink/50" colSpan={5}>
                                                    Nenhum consumo lançado para essa estadia ainda.
                                                </td>
                                            </tr>
                                        )}
                                        {carregandoConsumos && (
                                            <tr>
                                                <td className="py-4 px-4 text-ink/50" colSpan={5}>
                                                    Carregando consumos...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {consumos.length > 0 && (
                                        <tfoot>
                                            <tr className="border-t border-ink/10">
                                                <td className="py-3 px-4 font-medium" colSpan={3}>
                                                    Subtotal do minibar
                                                </td>
                                                <td className="py-3 px-4 font-medium whitespace-nowrap" colSpan={2}>
                                                    {formatoMoeda.format(subtotalMinibar)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
