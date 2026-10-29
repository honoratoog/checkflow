import { Router } from "express";
import { db } from "../db";
import { validarDocumento } from "../utils/documentos";

export const hospedesRouter = Router();

hospedesRouter.get("/", (req, res) => {
    const hospedes = db.prepare("SELECT * FROM hospedes").all();
    res.json(hospedes);
});

hospedesRouter.get("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de hóspede deve ser numérico" });
    }

    const hospede = db.prepare("SELECT * FROM hospedes WHERE id = ?").get(id);
    if (!hospede) {
        return res.status(404).json({ error: "Hóspede não encontrado" });
    }

    res.json(hospede);
});

hospedesRouter.post("/", (req, res) => {
    const { nome, documento, telefone, tipo_documento, tipoDocumento } = req.body;

    if (!nome || !documento || typeof nome !== "string" || typeof documento !== "string" || !nome.trim() || !documento.trim()) {
        return res.status(400).json({ error: "Informe nome e documento do hóspede" });
    }

    const tipoDocInformado = tipo_documento ?? tipoDocumento;
    const validacao = validarDocumento(documento, tipoDocInformado);

    if (!validacao.valido) {
        return res.status(400).json({ error: validacao.erro });
    }

    const docNormalizado = validacao.documentoNormalizado;
    const tipoDoc = validacao.tipo ?? "CPF";

    const existente = db.prepare("SELECT id FROM hospedes WHERE documento = ?").get(docNormalizado);
    if (existente) {
        return res.status(400).json({ error: "Já existe um hóspede cadastrado com esse documento" });
    }

    const telFormatado = typeof telefone === "string" && telefone.trim() ? telefone.trim() : null;

    const result = db
        .prepare("INSERT INTO hospedes (nome, documento, telefone, tipo_documento) VALUES (?, ?, ?, ?)")
        .run(nome.trim(), docNormalizado, telFormatado, tipoDoc);

    const novo = db.prepare("SELECT * FROM hospedes WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(novo);
});

hospedesRouter.put("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de hóspede deve ser numérico" });
    }

    const hospede = db.prepare("SELECT * FROM hospedes WHERE id = ?").get(id) as any;
    if (!hospede) {
        return res.status(404).json({ error: "Hóspede não encontrado" });
    }

    const { nome, documento, telefone, tipo_documento, tipoDocumento } = req.body;

    const novoNome = nome !== undefined ? String(nome).trim() : hospede.nome;
    const novoTelefone = telefone !== undefined ? (typeof telefone === "string" && telefone.trim() ? telefone.trim() : null) : hospede.telefone;

    if (!novoNome) {
        return res.status(400).json({ error: "Informe nome e documento do hóspede" });
    }

    let docNormalizado = hospede.documento;
    let tipoDoc = hospede.tipo_documento ?? "CPF";

    if (documento !== undefined) {
        if (!documento || typeof documento !== "string" || !documento.trim()) {
            return res.status(400).json({ error: "Informe nome e documento do hóspede" });
        }

        const tipoDocInformado = tipo_documento ?? tipoDocumento;
        const validacao = validarDocumento(documento, tipoDocInformado);

        if (!validacao.valido) {
            return res.status(400).json({ error: validacao.erro });
        }

        docNormalizado = validacao.documentoNormalizado;
        tipoDoc = validacao.tipo ?? tipoDoc;

        const existente = db
            .prepare("SELECT id FROM hospedes WHERE documento = ? AND id != ?")
            .get(docNormalizado, id);

        if (existente) {
            return res.status(400).json({ error: "Já existe outro hóspede cadastrado com esse documento" });
        }
    }

    db.prepare("UPDATE hospedes SET nome = ?, documento = ?, telefone = ?, tipo_documento = ? WHERE id = ?").run(
        novoNome,
        docNormalizado,
        novoTelefone,
        tipoDoc,
        id
    );

    const atualizado = db.prepare("SELECT * FROM hospedes WHERE id = ?").get(id);
    res.json(atualizado);
});

hospedesRouter.put("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de hóspede deve ser numérico" });
    }

    const { nome, documento, telefone } = req.body;

    if (!nome || !documento || typeof nome !== "string" || typeof documento !== "string" || !nome.trim() || !documento.trim()) {
        return res.status(400).json({ error: "Informe nome e documento do hóspede" });
    }

    const hospede = db.prepare("SELECT id FROM hospedes WHERE id = ?").get(id);
    if (!hospede) {
        return res.status(404).json({ error: "Hóspede não encontrado" });
    }

    const documentoFormatado = documento.trim();
    const existente = db
        .prepare("SELECT id FROM hospedes WHERE documento = ? AND id != ?")
        .get(documentoFormatado, id);

    if (existente) {
        return res.status(400).json({ error: "Já existe outro hóspede cadastrado com esse documento" });
    }

    const telefoneFormatado = typeof telefone === "string" && telefone.trim() ? telefone.trim() : null;

    db.prepare("UPDATE hospedes SET nome = ?, documento = ?, telefone = ? WHERE id = ?").run(
        nome.trim(),
        documentoFormatado,
        telefoneFormatado,
        id
    );

    const atualizado = db.prepare("SELECT * FROM hospedes WHERE id = ?").get(id);
    res.json(atualizado);
});

hospedesRouter.delete("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de hóspede deve ser numérico" });
    }

    const hospede = db.prepare("SELECT id FROM hospedes WHERE id = ?").get(id);
    if (!hospede) {
        return res.status(404).json({ error: "Hóspede não encontrado" });
    }

    const reservaVinculada = db.prepare("SELECT id FROM reservas WHERE hospede_id = ?").get(id);
    if (reservaVinculada) {
        return res.status(400).json({ error: "Este hóspede possui reservas vinculadas e não pode ser excluído" });
    }

    db.prepare("DELETE FROM hospedes WHERE id = ?").run(id);
    res.status(204).send();
});
