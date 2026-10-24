export function normalizarCpf(valor: string): string {
    if (!valor || typeof valor !== "string") return "";
    return valor.replace(/\D/g, "");
}

export function validarCpf(valor: string): boolean {
    const cpf = normalizarCpf(valor);

    if (cpf.length !== 11) {
        return false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    let digito1 = resto === 10 || resto === 11 ? 0 : resto;
    if (digito1 !== Number(cpf[9])) {
        return false;
    }

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }
    resto = (soma * 10) % 11;
    let digito2 = resto === 10 || resto === 11 ? 0 : resto;
    if (digito2 !== Number(cpf[10])) {
        return false;
    }

    return true;
}

export function normalizarRg(valor: string): string {
    if (!valor || typeof valor !== "string") return "";
    return valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function validarRg(valor: string): boolean {
    const rg = normalizarRg(valor);

    if (rg.length < 5 || rg.length > 14) {
        return false;
    }

    if (/^(.)\1+$/.test(rg)) {
        return false;
    }

    return true;
}

export interface ResultadoValidacaoDocumento {
    valido: boolean;
    tipo?: "CPF" | "RG";
    documentoNormalizado: string;
    erro?: string;
}

export function validarDocumento(documento: string, tipo?: string): ResultadoValidacaoDocumento {
    if (!documento || typeof documento !== "string" || !documento.trim()) {
        return { valido: false, documentoNormalizado: "", erro: "Informe nome e documento do hóspede" };
    }

    const docTrim = documento.trim();
    const tipoNormalizado = typeof tipo === "string" ? tipo.trim().toUpperCase() : undefined;

    if (tipoNormalizado) {
        if (tipoNormalizado === "CPF") {
            const cpfNorm = normalizarCpf(docTrim);
            if (!validarCpf(cpfNorm)) {
                return { valido: false, tipo: "CPF", documentoNormalizado: cpfNorm, erro: "CPF inválido" };
            }
            return { valido: true, tipo: "CPF", documentoNormalizado: cpfNorm };
        }

        if (tipoNormalizado === "RG") {
            const rgNorm = normalizarRg(docTrim);
            if (!validarRg(rgNorm)) {
                return { valido: false, tipo: "RG", documentoNormalizado: rgNorm, erro: "RG inválido" };
            }
            return { valido: true, tipo: "RG", documentoNormalizado: rgNorm };
        }

        return {
            valido: false,
            documentoNormalizado: docTrim,
            erro: "Tipo de documento deve ser 'CPF' ou 'RG'",
        };
    }

    const apenasDigitos = normalizarCpf(docTrim);
    if (apenasDigitos.length === 11 && /^\d+$/.test(docTrim.replace(/[\.\-\s]/g, ""))) {
        if (!validarCpf(apenasDigitos)) {
            return { valido: false, tipo: "CPF", documentoNormalizado: apenasDigitos, erro: "CPF inválido" };
        }
        return { valido: true, tipo: "CPF", documentoNormalizado: apenasDigitos };
    }

    const rgNorm = normalizarRg(docTrim);
    if (validarRg(rgNorm)) {
        return { valido: true, tipo: "RG", documentoNormalizado: rgNorm };
    }

    return {
        valido: false,
        documentoNormalizado: docTrim,
        erro: "Documento inválido. Informe um CPF válido (11 dígitos) ou um RG válido",
    };
}
