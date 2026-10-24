import { Router } from "express";
import { db } from "../db";
import { obterDiariaPadrao } from "../utils/precos";

export const quartosRouter = Router();

function formatarQuarto(q: any) {
    if (!q) return null;
    return {
        id: q.id,
        numero: q.numero,
        tipo: q.tipo,
        status: q.status,
        diaria_base: q.diaria_base !== null && q.diaria_base !== undefined ? Number(q.diaria_base) : null,
        diariaBase: q.diaria_base !== null && q.diaria_base !== undefined ? Number(q.diaria_base) : undefined,
    };
}

quartosRouter.get("/", (req, res) => {
    const { numero, tipo, status } = req.query;

    const condicoes: string[] = [];
    const params: any[] = [];

    if (typeof numero === "string" && numero.trim()) {
        condicoes.push("numero LIKE '%' || ? || '%' COLLATE NOCASE");
        params.push(numero.trim());
    }

    if (typeof tipo === "string" && tipo.trim()) {
        condicoes.push("tipo LIKE '%' || ? || '%' COLLATE NOCASE");
        params.push(tipo.trim());
    }

    if (typeof status === "string" && status.trim()) {
        condicoes.push("status LIKE '%' || ? || '%' COLLATE NOCASE");
        params.push(status.trim());
    }

    const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
    const sql = `SELECT * FROM quartos ${whereClause} ORDER BY CAST(numero AS INTEGER), numero ASC`;

    const quartos = db.prepare(sql).all(...params);
    res.json(quartos.map(formatarQuarto));
});

quartosRouter.get("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de quarto deve ser numérico" });
    }

    const quarto = db.prepare("SELECT * FROM quartos WHERE id = ?").get(id);
    if (!quarto) {
        return res.status(404).json({ error: "Quarto não encontrado" });
    }

    res.json(formatarQuarto(quarto));
});

quartosRouter.post("/", (req, res) => {
    const { numero, tipo, diaria_base, diariaBase } = req.body;

    if (!numero || !tipo || typeof numero !== "string" || typeof tipo !== "string" || !numero.trim() || !tipo.trim()) {
        return res.status(400).json({ error: "Informe número e tipo do quarto" });
    }

    const numFormatado = numero.trim();
    const tipoFormatado = tipo.trim();

    const existente = db.prepare("SELECT id FROM quartos WHERE numero = ?").get(numFormatado);
    if (existente) {
        return res.status(400).json({ error: "Já existe um quarto com esse número" });
    }

    const diariaInformada = diaria_base !== undefined ? diaria_base : diariaBase;
    let diaria: number;

    if (diariaInformada !== undefined && diariaInformada !== null && diariaInformada !== "") {
        diaria = Number(diariaInformada);
        if (isNaN(diaria) || diaria < 0) {
            return res.status(400).json({ error: "Valor da diária deve ser um número maior ou igual a zero" });
        }
    } else {
        const padrao = obterDiariaPadrao(tipoFormatado);
        if (padrao === undefined) {
            return res.status(400).json({ error: "Informe o valor da diária para este tipo de quarto" });
        }
        diaria = padrao;
    }

    const result = db
        .prepare("INSERT INTO quartos (numero, tipo, status, diaria_base) VALUES (?, ?, 'Livre', ?)")
        .run(numFormatado, tipoFormatado, diaria);

    const novo = db.prepare("SELECT * FROM quartos WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(formatarQuarto(novo));
});

quartosRouter.put("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de quarto deve ser numérico" });
    }

    const quarto = db.prepare("SELECT * FROM quartos WHERE id = ?").get(id) as any;
    if (!quarto) {
        return res.status(404).json({ error: "Quarto não encontrado" });
    }

    const { numero, tipo, diaria_base, diariaBase, status } = req.body;

    const novoNumero = numero !== undefined ? String(numero).trim() : quarto.numero;
    const novoTipo = tipo !== undefined ? String(tipo).trim() : quarto.tipo;
    const novoStatus = status !== undefined ? String(status).trim() : quarto.status;

    if (!novoNumero || !novoTipo) {
        return res.status(400).json({ error: "Informe número e tipo do quarto" });
    }

    const statusValidos = ["Livre", "Ocupado", "Limpeza Pendente"];
    if (status !== undefined && !statusValidos.includes(novoStatus)) {
        return res.status(400).json({ error: "Status inválido para o quarto" });
    }

    const existente = db
        .prepare("SELECT id FROM quartos WHERE numero = ? AND id != ?")
        .get(novoNumero, id);

    if (existente) {
        return res.status(400).json({ error: "Já existe um quarto com esse número" });
    }

    const diariaInformada = diaria_base !== undefined ? diaria_base : diariaBase;
    let novaDiaria: number;

    if (diariaInformada !== undefined && diariaInformada !== null && diariaInformada !== "") {
        novaDiaria = Number(diariaInformada);
        if (isNaN(novaDiaria) || novaDiaria < 0) {
            return res.status(400).json({ error: "Valor da diária deve ser um número maior ou igual a zero" });
        }
    } else if (tipo !== undefined && novoTipo.toLowerCase() !== quarto.tipo.toLowerCase()) {
        novaDiaria = obterDiariaPadrao(novoTipo) ?? quarto.diaria_base;
    } else {
        novaDiaria = quarto.diaria_base;
    }

    db.prepare("UPDATE quartos SET numero = ?, tipo = ?, status = ?, diaria_base = ? WHERE id = ?").run(
        novoNumero,
        novoTipo,
        novoStatus,
        novaDiaria,
        id
    );

    const atualizado = db.prepare("SELECT * FROM quartos WHERE id = ?").get(id);
    res.json(formatarQuarto(atualizado));
});

quartosRouter.patch("/:id/limpeza", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de quarto deve ser numérico" });
    }

    const quarto = db.prepare("SELECT * FROM quartos WHERE id = ?").get(id);

    if (!quarto) {
        return res.status(404).json({ error: "Quarto não encontrado" });
    }

    db.prepare("UPDATE quartos SET status = 'Livre' WHERE id = ?").run(id);
    const atualizado = db.prepare("SELECT * FROM quartos WHERE id = ?").get(id);
    res.json(formatarQuarto(atualizado));
});

quartosRouter.delete("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de quarto deve ser numérico" });
    }

    const quarto = db.prepare("SELECT id FROM quartos WHERE id = ?").get(id);
    if (!quarto) {
        return res.status(404).json({ error: "Quarto não encontrado" });
    }

    const reservaVinculada = db.prepare("SELECT id FROM reservas WHERE quarto_id = ?").get(id);
    if (reservaVinculada) {
        return res.status(400).json({ error: "Este quarto possui reservas vinculadas e não pode ser excluído" });
    }

    db.prepare("DELETE FROM quartos WHERE id = ?").run(id);
    res.status(204).send();
});
