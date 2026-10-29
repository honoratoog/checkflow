const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type Quarto = {
    id: number;
    numero: string;
    tipo: string;
    status: "Livre" | "Ocupado" | "Limpeza Pendente";
    diaria_base: number | null;
};

export type ResumoQuartos = {
    total: number;
    livres: number;
    ocupados: number;
    limpezaPendente: number;
};

export type Hospede = {
    id: number;
    nome: string;
    documento: string;
    telefone?: string;
};

export type Reserva = {
    id: number;
    quarto_id: number;
    hospede_id: number;
    quarto_numero: string;
    hospede_nome: string;
    data_checkin: string;
    // Ainda não retornada pela API; campo previsto para quando o backend passar a registrar a data de checkout.
    data_checkout?: string;
    status: "Reservado" | "Em andamento" | "Finalizado";
};

export type ConsumoMinibar = {
    id: number;
    reserva_id: number;
    item: string;
    quantidade: number;
    valor_unitario: number;
};

async function request(path: string, options?: RequestInit) {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (res.status === 204) {
        return null;
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error ?? "Erro na requisição");
    }

    return data;
}

export const api = {
    listarQuartos: (): Promise<Quarto[]> => request("/quartos"),
    // Hoje a rota "/resumo" é capturada por "/:id" no backend (registrada antes) e retorna erro. Não usar até corrigirem a ordem das rotas.
    obterResumoQuartos: (): Promise<ResumoQuartos> => request("/quartos/resumo"),
    criarQuarto: (numero: string, tipo: string) =>
        request("/quartos", { method: "POST", body: JSON.stringify({ numero, tipo }) }),
    finalizarLimpeza: (id: number) => request(`/quartos/${id}/limpeza`, { method: "PATCH" }),
    excluirQuarto: (id: number) => request(`/quartos/${id}`, { method: "DELETE" }),

    listarHospedes: (): Promise<Hospede[]> => request("/hospedes"),
    criarHospede: (nome: string, documento: string, telefone: string) =>
        request("/hospedes", { method: "POST", body: JSON.stringify({ nome, documento, telefone }) }),
    editarHospede: (id: number, nome: string, documento: string, telefone: string) =>
        request(`/hospedes/${id}`, { method: "PUT", body: JSON.stringify({ nome, documento, telefone }) }),
    excluirHospede: (id: number) => request(`/hospedes/${id}`, { method: "DELETE" }),

    listarReservas: (): Promise<Reserva[]> => request("/reservas"),
    criarReserva: (quarto_id: number, hospede_id: number, data_checkin: string) =>
        request("/reservas", { method: "POST", body: JSON.stringify({ quarto_id, hospede_id, data_checkin }) }),
    checkin: (id: number) => request(`/reservas/${id}/checkin`, { method: "POST" }),
    checkout: (id: number) => request(`/reservas/${id}/checkout`, { method: "POST" }),
    excluirReserva: (id: number) => request(`/reservas/${id}`, { method: "DELETE" }),

    listarConsumosMinibar: (reserva_id: number): Promise<ConsumoMinibar[]> => request(`/reservas/${reserva_id}/consumos`),
    lancarConsumoMinibar: (reserva_id: number, item: string, quantidade: number, valor_unitario: number) =>
        request(`/reservas/${reserva_id}/consumos`, {
            method: "POST",
            body: JSON.stringify({ item, quantidade, valor_unitario }),
        }),
    excluirConsumoMinibar: (id: number) => request(`/consumos/${id}`, { method: "DELETE" }),
};
