import { Router } from "express";
import { db } from "../db";

export const reservasRouter = Router();

reservasRouter.get("/", (req, res) => {
    const { quarto, hospede, checkin, checkout, status } = req.query;

    const condicoes: string[] = [];
    const params: any[] = [];

    if (typeof quarto === "string" && quarto.trim()) {
        condicoes.push("quartos.numero LIKE '%' || ? || '%' COLLATE NOCASE");
        params.push(quarto.trim());
    }

    if (typeof hospede === "string" && hospede.trim()) {
        condicoes.push("hospedes.nome LIKE '%' || ? || '%' COLLATE NOCASE");
        params.push(hospede.trim());
    }

    if (typeof checkin === "string" && checkin.trim()) {
        condicoes.push("reservas.data_checkin LIKE ? || '%'");
        params.push(checkin.trim());
    }

    if (typeof checkout === "string" && checkout.trim()) {
        condicoes.push("reservas.data_checkout LIKE ? || '%'");
        params.push(checkout.trim());
    }

    if (typeof status === "string" && status.trim()) {
        condicoes.push("reservas.status LIKE ? || '%' COLLATE NOCASE");
        params.push(status.trim());
    }

    const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
    const sql = `
        SELECT reservas.*, quartos.numero AS quarto_numero, hospedes.nome AS hospede_nome
        FROM reservas
        JOIN quartos ON quartos.id = reservas.quarto_id
        JOIN hospedes ON hospedes.id = reservas.hospede_id
        ${whereClause}
        ORDER BY reservas.data_checkin DESC, reservas.id DESC
    `;

    const reservas = db.prepare(sql).all(...params);
    res.json(reservas);
});

reservasRouter.get("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de reserva deve ser numérico" });
    }

    const reserva = db
        .prepare(`
            SELECT reservas.*, quartos.numero AS quarto_numero, hospedes.nome AS hospede_nome
            FROM reservas
            JOIN quartos ON quartos.id = reservas.quarto_id
            JOIN hospedes ON hospedes.id = reservas.hospede_id
            WHERE reservas.id = ?
        `)
        .get(id);

    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    res.json(reserva);
});

reservasRouter.post("/", (req, res) => {
    const { quarto_id, hospede_id, data_checkin, data_checkout } = req.body;

    if (!quarto_id || !hospede_id || !data_checkin) {
        return res.status(400).json({ error: "Informe quarto, hóspede e data de check-in" });
    }

    let checkoutFormatado: string | null = null;
    if (data_checkout !== undefined && data_checkout !== null && String(data_checkout).trim()) {
        checkoutFormatado = String(data_checkout).trim();
        if (checkoutFormatado.slice(0, 10) < String(data_checkin).trim().slice(0, 10)) {
            return res.status(400).json({ error: "Data de check-out deve ser igual ou posterior à data de check-in" });
        }
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
            INSERT INTO reservas (quarto_id, hospede_id, data_checkin, data_checkout, status)
            VALUES (?, ?, ?, ?, 'Reservado')
        `)
        .run(quarto_id, hospede_id, data_checkin, checkoutFormatado);

    const criada = db.prepare("SELECT * FROM reservas WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(criada);
});

reservasRouter.post("/:id/checkin", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de reserva deve ser numérico" });
    }

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

    const atualizada = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id);
    res.json(atualizada);
});

reservasRouter.post("/:id/checkout", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de reserva deve ser numérico" });
    }

    const reserva = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as any;
    if (!reserva) {
        return res.status(404).json({ error: "Reserva não encontrada" });
    }

    if (reserva.status !== "Em andamento") {
        return res.status(400).json({ error: "Só é possível realizar check-out de uma reserva em andamento" });
    }

    const hoje = new Date().toISOString().slice(0, 10);

    db.prepare("UPDATE quartos SET status = 'Limpeza Pendente' WHERE id = ?").run(reserva.quarto_id);
    db.prepare("UPDATE reservas SET status = 'Finalizado', data_checkout = COALESCE(data_checkout, ?) WHERE id = ?").run(hoje, id);

    const atualizada = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id);
    res.json(atualizada);
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

