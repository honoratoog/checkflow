import { Router } from "express";
import { db } from "../db";

export const reservasRouter = Router();

reservasRouter.get("/", (req, res) => {
    const reservas = db
        .prepare(`
            SELECT reservas.*, quartos.numero AS quarto_numero, hospedes.nome AS hospede_nome
            FROM reservas
            JOIN quartos ON quartos.id = reservas.quarto_id
            JOIN hospedes ON hospedes.id = reservas.hospede_id
        `)
        .all();

    res.json(reservas);
});

reservasRouter.post("/", (req, res) => {
    const { quarto_id, hospede_id, data_checkin } = req.body;

    if (!quarto_id || !hospede_id || !data_checkin) {
        return res.status(400).json({ error: "Informe quarto, hóspede e data de check-in" });
    }

    const conflito = db
        .prepare(`
            SELECT id FROM reservas
            WHERE quarto_id = ? AND data_checkin = ? AND status != 'Finalizado'
        `)
        .get(quarto_id, data_checkin);

    if (conflito) {
        return res.status(400).json({ error: "Já existe uma reserva para esse quarto nessa data" });
    }

    const result = db
        .prepare(`
            INSERT INTO reservas (quarto_id, hospede_id, data_checkin, status)
            VALUES (?, ?, ?, 'Reservado')
        `)
        .run(quarto_id, hospede_id, data_checkin);

    res.status(201).json({ id: result.lastInsertRowid, status: "Reservado" });
});

reservasRouter.post("/:id/checkin", (req, res) => {
    const { id } = req.params;

    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as any;
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    if (reserva.status !== "Reservado") {
        return res.status(400).json({ error: "Essa reserva já teve o check-in realizado" });
    }

    const quarto = db.prepare("SELECT * FROM quartos WHERE id = ?").get(reserva.quarto_id) as any;

    if (quarto.status === "Limpeza Pendente") {
        return res.status(400).json({ error: "Quarto com limpeza pendente. Check-in não permitido." });
    }

    if (quarto.status === "Ocupado") {
        return res.status(400).json({ error: "Quarto já está ocupado por outro hóspede" });
    }

    db.prepare("UPDATE quartos SET status = 'Ocupado' WHERE id = ?").run(quarto.id);
    db.prepare("UPDATE reservas SET status = 'Em andamento' WHERE id = ?").run(id);

    res.json({ id, status: "Em andamento" });
});

reservasRouter.post("/:id/checkout", (req, res) => {
    const { id } = req.params;

    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as any;
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    if (reserva.status !== "Em andamento") {
        return res.status(400).json({ error: "Só é possível realizar check-out de uma reserva em andamento" });
    }

    db.prepare("UPDATE quartos SET status = 'Limpeza Pendente' WHERE id = ?").run(reserva.quarto_id);
    db.prepare("UPDATE reservas SET status = 'Finalizado' WHERE id = ?").run(id);

    res.json({ id, status: "Finalizado" });
});

reservasRouter.delete("/:id", (req, res) => {
    const { id } = req.params;

    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as any;
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    if (reserva.status === "Em andamento") {
        db.prepare("UPDATE quartos SET status = 'Livre' WHERE id = ?").run(reserva.quarto_id);
    }

    db.prepare("DELETE FROM reservas WHERE id = ?").run(id);
    res.status(204).send();
});

reservasRouter.get("/:id/consumos", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de reserva deve ser numérico" });
    }

    const reserva = db.prepare("SELECT id FROM reservas WHERE id = ?").get(id);
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    const consumos = db
        .prepare("SELECT * FROM consumos_minibar WHERE reserva_id = ? ORDER BY id ASC")
        .all(id);

    res.json(consumos);
});

reservasRouter.post("/:id/consumos", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de reserva deve ser numérico" });
    }

    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as any;
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // RN05: Consumos de minibar só podem ser lançados enquanto a estadia estiver ativa (quarto Ocupado / reserva "Em andamento")
    if (reserva.status !== "Em andamento") {
        return res.status(400).json({ error: "Consumos de minibar só podem ser lançados para reservas em andamento" });
    }

    const { item, quantidade, valor_unitario } = req.body;

    if (!item || typeof item !== "string" || !item.trim()) {
        return res.status(400).json({ error: "Informe o item do minibar" });
    }

    const qtd = quantidade !== undefined ? Number(quantidade) : 1;
    if (!Number.isInteger(qtd) || qtd <= 0) {
        return res.status(400).json({ error: "Quantidade deve ser um número inteiro positivo" });
    }

    const valor = Number(valor_unitario);
    if (valor_unitario === undefined || isNaN(valor) || valor < 0) {
        return res.status(400).json({ error: "Valor unitário deve ser um número maior ou igual a zero" });
    }

    const result = db
        .prepare("INSERT INTO consumos_minibar (reserva_id, item, quantidade, valor_unitario) VALUES (?, ?, ?, ?)")
        .run(id, item.trim(), qtd, valor);

    res.status(201).json({
        id: result.lastInsertRowid,
        reserva_id: Number(id),
        item: item.trim(),
        quantidade: qtd,
        valor_unitario: valor,
    });
});

