export const PRECOS_PADRAO_POR_TIPO: Record<string, number> = {
    solteiro: 120,
    casal: 180,
    "casal com varanda": 220,
    "suíte master": 320,
    "suite master": 320,
};

export function obterDiariaPadrao(tipo: string): number | undefined {
    if (!tipo || typeof tipo !== "string") return undefined;
    return PRECOS_PADRAO_POR_TIPO[tipo.trim().toLowerCase()];
}
