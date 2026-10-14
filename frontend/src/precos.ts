// Valores fixos por tipo, provisórios no front: o backend ainda não registra diária por quarto (MODELO-DOMINIO.md
// prevê `diariaBase` em Quarto, mas é escopo N2/N3, ainda não implementado). Ajustar aqui até lá existir.
export const TIPOS_DE_QUARTO = ["Solteiro", "Casal", "Casal com varanda", "Suíte Master"] as const;

const PRECO_POR_TIPO: Record<string, number> = {
    Solteiro: 120,
    Casal: 180,
    "Casal com varanda": 220,
    "Suíte Master": 320,
};

export function valorDiaria(tipo: string): number | undefined {
    return PRECO_POR_TIPO[tipo];
}

export const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
