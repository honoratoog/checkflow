export interface ConsumoMinibarItem {
    id?: number;
    item: string;
    quantidade: number;
    valor_unitario: number;
}

export interface ItemConsumoExtrato extends ConsumoMinibarItem {
    subtotal: number;
}

export interface ExtratoCalculado {
    dias_hospedado: number;
    diaria: number;
    subtotal_diarias: number;
    consumos: ItemConsumoExtrato[];
    total_consumos: number;
    total_a_pagar: number;
}

export function dataSomenteDia(valor: string): number {
    return new Date(valor.slice(0, 10)).getTime();
}

export function calcularDiasHospedado(dataCheckin: string, dataCheckout?: string | null): number {
    const inicio = dataSomenteDia(dataCheckin);
    const fim = dataSomenteDia(dataCheckout || new Date().toISOString().slice(0, 10));
    const diferencaDias = Math.round((fim - inicio) / (1000 * 60 * 60 * 24));
    return Math.max(1, diferencaDias);
}

export function calcularExtratoReserva(params: {
    data_checkin: string;
    data_checkout?: string | null;
    diaria_base?: number | null;
    consumos?: ConsumoMinibarItem[];
}): ExtratoCalculado {
    const dias = calcularDiasHospedado(params.data_checkin, params.data_checkout);
    const diaria = params.diaria_base !== null && params.diaria_base !== undefined ? Number(params.diaria_base) : 0;
    const subtotalDiarias = dias * diaria;

    const listaConsumos: ItemConsumoExtrato[] = (params.consumos || []).map((c) => {
        const qtd = Number(c.quantidade) || 0;
        const val = Number(c.valor_unitario) || 0;
        return {
            id: c.id,
            item: c.item,
            quantidade: qtd,
            valor_unitario: val,
            subtotal: qtd * val,
        };
    });

    const totalConsumos = listaConsumos.reduce((acc, c) => acc + c.subtotal, 0);
    const totalAPagar = subtotalDiarias + totalConsumos;

    return {
        dias_hospedado: dias,
        diaria,
        subtotal_diarias: subtotalDiarias,
        consumos: listaConsumos,
        total_consumos: totalConsumos,
        total_a_pagar: totalAPagar,
    };
}
