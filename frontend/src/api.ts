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
    data_checkout?: string | null;
    status: "Reservado" | "Em andamento" | "Finalizado";
    diaria_base?: number | null;
    dias_hospedado?: number | null;
    total_consumos?: number | null;
    subtotal_diarias?: number | null;
    valor_total?: number | null;
};

export type ConsumoMinibar = {
    id: number;
    reserva_id: number;
    item: string;
    quantidade: number;
    valor_unitario: number;
};

export type ItemConsumoExtrato = {
    id?: number;
    item: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
};

export type ExtratoReserva = {
    reserva_id: number;
    quarto_id: number;
    quarto_numero: string;
    quarto_tipo?: string;
    hospede_id: number;
    hospede_nome: string;
    status: "Reservado" | "Em andamento" | "Finalizado";
    data_checkin: string;
    data_checkout?: string | null;
    dias_hospedado: number;
    diaria: number;
    subtotal_diarias: number;
    consumos: ItemConsumoExtrato[];
    total_consumos: number;
    total_a_pagar: number;
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
    criarQuarto: (numero: string, tipo: string, diaria_base: number) =>
        request("/quartos", { method: "POST", body: JSON.stringify({ numero, tipo, diaria_base }) }),
    finalizarLimpeza: (id: number) => request(`/quartos/${id}/limpeza`, { method: "PATCH" }),
    excluirQuarto: (id: number) => request(`/quartos/${id}`, { method: "DELETE" }),

    listarHospedes: (): Promise<Hospede[]> => request("/hospedes"),
    criarHospede: (nome: string, documento: string, telefone: string) =>
        request("/hospedes", { method: "POST", body: JSON.stringify({ nome, documento, telefone }) }),
    editarHospede: (id: number, nome: string, documento: string, telefone: string) =>
        request(`/hospedes/${id}`, { method: "PUT", body: JSON.stringify({ nome, documento, telefone }) }),
    excluirHospede: (id: number) => request(`/hospedes/${id}`, { method: "DELETE" }),

    listarReservas: (): Promise<Reserva[]> => request("/reservas"),
    obterExtrato: (id: number): Promise<ExtratoReserva> => request(`/reservas/${id}/extrato`),
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
