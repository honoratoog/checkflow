import { useEffect, useState } from "react";
import { api, Quarto } from "./api";
import { Erro } from "./Erro";
import { Sucesso } from "./Sucesso";

const estiloStatus: Record<Quarto["status"], string> = {
    Livre: "bg-status-livre/10 text-status-livre",
    Ocupado: "bg-status-ocupado/10 text-status-ocupado",
    "Limpeza Pendente": "bg-status-pendente/10 text-status-pendente",
};

export function Quartos() {
    const [quartos, setQuartos] = useState<Quarto[]>([]);
    const [numero, setNumero] = useState("");
    const [tipo, setTipo] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [processando, setProcessando] = useState(false);
    const [carregando, setCarregando] = useState(true);

    const [buscaNumero, setBuscaNumero] = useState("");
    const [buscaTipo, setBuscaTipo] = useState("");
    const [buscaStatus, setBuscaStatus] = useState<Quarto["status"] | "">("");
    const [filtro, setFiltro] = useState({ numero: "", tipo: "", status: "" as Quarto["status"] | "" });

    function carregar() {
        setCarregando(true);
        api.listarQuartos().then(setQuartos).catch((err: Error) => setErro(err.message)).finally(() => setCarregando(false));
    }

    useEffect(() => {
        carregar();
    }, []);

    async function adicionarQuarto(e: React.FormEvent) {
        e.preventDefault();
        if (!numero || !tipo) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.criarQuarto(numero, tipo);
            setNumero("");
            setTipo("");
            setSucesso("Quarto cadastrado com sucesso.");
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    async function finalizarLimpeza(id: number) {
        setErro(""); setSucesso(""); setProcessando(true);
        try {
            await api.finalizarLimpeza(id);
            setSucesso("Limpeza do quarto concluída com sucesso.");
            carregar();
        } catch (err: any) { setErro(err.message); } finally { setProcessando(false); }
    }

    async function excluirQuarto(id: number, numero: string) {
        if (!confirm(`Excluir o quarto ${numero}? Essa ação não pode ser desfeita.`)) return;

        setErro("");
        setSucesso("");
        setProcessando(true);
        try {
            await api.excluirQuarto(id);
            setSucesso("Quarto excluído com sucesso.");
            carregar();
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setProcessando(false);
        }
    }

    function pesquisar(e: React.FormEvent) {
        e.preventDefault();
        setFiltro({ numero: buscaNumero, tipo: buscaTipo, status: buscaStatus });
    }

    const numeroFiltro = filtro.numero.trim().toLocaleLowerCase("pt-BR");
    const tipoFiltro = filtro.tipo.trim().toLocaleLowerCase("pt-BR");
    const filtroAtivo = Boolean(filtro.numero || filtro.tipo || filtro.status);
    const quartosFiltrados = [...quartos]
        .filter(
            (q) =>
                (!numeroFiltro || q.numero.toLocaleLowerCase("pt-BR").includes(numeroFiltro)) &&
                (!tipoFiltro || q.tipo.toLocaleLowerCase("pt-BR").includes(tipoFiltro)) &&
                (!filtro.status || q.status === filtro.status)
        )
        .sort((a, b) => a.numero.localeCompare(b.numero, "pt-BR", { numeric: true }));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-serif text-3xl text-ink">Quartos</h2>
                <p className="text-ink/60 mt-1">Cadastre quartos e acompanhe o status de cada um.</p>
            </div>

            <form onSubmit={adicionarQuarto} className="bg-white border border-ink/10 rounded-sm p-5 flex gap-3 flex-wrap items-end">
                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Número</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Ex: 12"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                    />
                </label>
                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Tipo</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Ex: Casal com varanda"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    />
                </label>
                <button disabled={processando} className="bg-teal text-white px-5 py-2 rounded-sm hover:bg-teal-dark transition-colors disabled:opacity-50" type="submit">
                    {processando ? "Salvando..." : "Adicionar quarto"}
                </button>
            </form>

            <Erro mensagem={erro} />
            <Sucesso mensagem={sucesso} />

            <form onSubmit={pesquisar} className="bg-white border border-ink/10 rounded-sm p-5 flex gap-3 flex-wrap items-end">
                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Número</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Número do quarto"
                        value={buscaNumero}
                        onChange={(e) => setBuscaNumero(e.target.value)}
                    />
                </label>

                <label className="flex-1 min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Tipo</span>
                    <input
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        placeholder="Tipo do quarto"
                        value={buscaTipo}
                        onChange={(e) => setBuscaTipo(e.target.value)}
                    />
                </label>

                <label className="min-w-[160px]">
                    <span className="block text-xs text-ink/50 mb-1">Status</span>
                    <select
                        className="border border-ink/15 rounded-sm px-3 py-2 w-full focus:outline-none focus:border-teal"
                        value={buscaStatus}
                        onChange={(e) => setBuscaStatus(e.target.value as Quarto["status"] | "")}
                    >
                        <option value="">Todos</option>
                        <option value="Livre">Livre</option>
                        <option value="Ocupado">Ocupado</option>
                        <option value="Limpeza Pendente">Limpeza Pendente</option>
                    </select>
                </label>

                <button className="bg-ink text-white px-5 py-2 rounded-sm hover:bg-ink/80 transition-colors" type="submit">
                    Pesquisar
                </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {quartosFiltrados.map((q) => (
                    <div key={q.id} className="bg-white border border-ink/10 rounded-sm p-5">
                        <div className="flex justify-between items-start">
                            <span className="font-serif text-lg">Quarto {q.numero}</span>
                            <span className={`text-xs px-2 py-1 rounded-sm ${estiloStatus[q.status]}`}>
                                {q.status}
                            </span>
                        </div>
                        <p className="text-sm text-ink/60 mt-1">{q.tipo}</p>

                        <div className="mt-4 flex gap-4">
                            {q.status === "Limpeza Pendente" && (
                                <button
                                    onClick={() => finalizarLimpeza(q.id)}
                                    disabled={processando}
                                    className="text-sm text-teal-dark hover:underline"
                                >
                                    Marcar limpeza como concluída
                                </button>
                            )}
                            <button
                                onClick={() => excluirQuarto(q.id, q.numero)}
                                disabled={processando}
                                className="text-sm text-ink/40 hover:text-status-pendente"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                ))}

                {!carregando && quartosFiltrados.length === 0 && (
                    <p className="text-sm text-ink/50 col-span-full">{filtroAtivo ? "Nenhum quarto encontrado para essa busca." : "Nenhum quarto cadastrado ainda."}</p>
                )}
                {carregando && <p className="text-sm text-ink/50 col-span-full">Carregando quartos...</p>}
            </div>
        </div>
    );
}
