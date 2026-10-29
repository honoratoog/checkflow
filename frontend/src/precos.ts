// Usado para o preview de diária no cadastro (antes do quarto existir, sem id pra consultar o valor real)
// e como fallback caso diaria_base venha nulo da API. O backend aplica os mesmos valores por padrão.
export const TIPOS_DE_QUARTO = ["Solteiro", "Casal", "Casal com varanda", "Suíte Master"] as const;

const PRECO_POR_TIPO: Record<string, number> = {
    Solteiro: 120,
    Casal: 180,
    "Casal com varanda": 220,
    "Suíte Master": 320,
};

// Normalizado porque quartos cadastrados fora da UI (ex.: via Postman) podem ter o tipo com capitalização diferente.
const PRECO_POR_TIPO_NORMALIZADO = Object.fromEntries(
    Object.entries(PRECO_POR_TIPO).map(([tipo, preco]) => [tipo.toLocaleLowerCase("pt-BR"), preco])
);

export function valorDiaria(tipo: string): number | undefined {
    return PRECO_POR_TIPO_NORMALIZADO[tipo.trim().toLocaleLowerCase("pt-BR")];
}

export const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
