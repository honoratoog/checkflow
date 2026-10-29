import { Router } from "express";
import { db } from "../db";

export const consumosRouter = Router();

consumosRouter.get("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de consumo deve ser numérico" });
    }

    const consumo = db.prepare("SELECT * FROM consumos_minibar WHERE id = ?").get(id);
    if (!consumo) {
        return res.status(404).json({ error: "Consumo não encontrado" });
    }

    res.json(consumo);
});

consumosRouter.put("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de consumo deve ser numérico" });
    }

    const consumo = db.prepare("SELECT * FROM consumos_minibar WHERE id = ?").get(id) as any;
    if (!consumo) {
        return res.status(404).json({ error: "Consumo não encontrado" });
    }

    const reserva = db.prepare("SELECT status FROM reservas WHERE id = ?").get(consumo.reserva_id) as any;
    if (reserva && reserva.status === "Finalizado") {
        return res.status(400).json({ error: "Não é possível alterar consumos de uma reserva já finalizada" });
    }

    const { item, quantidade, valor_unitario } = req.body;

    const novoItem = item !== undefined ? item : consumo.item;
    const novaQtd = quantidade !== undefined ? Number(quantidade) : consumo.quantidade;
    const novoValor = valor_unitario !== undefined ? Number(valor_unitario) : consumo.valor_unitario;

    if (typeof novoItem !== "string" || !novoItem.trim()) {
        return res.status(400).json({ error: "Informe o item do minibar" });
    }

    if (!Number.isInteger(novaQtd) || novaQtd <= 0) {
        return res.status(400).json({ error: "Quantidade deve ser um número inteiro positivo" });
    }

    if (isNaN(novoValor) || novoValor < 0) {
        return res.status(400).json({ error: "Valor unitário deve ser um número maior ou igual a zero" });
    }

    db.prepare("UPDATE consumos_minibar SET item = ?, quantidade = ?, valor_unitario = ? WHERE id = ?").run(
        novoItem.trim(),
        novaQtd,
        novoValor,
        id
    );

    const atualizado = db.prepare("SELECT * FROM consumos_minibar WHERE id = ?").get(id);
    res.json(atualizado);
});

consumosRouter.delete("/:id", (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: "ID de consumo deve ser numérico" });
    }

    const consumo = db.prepare("SELECT * FROM consumos_minibar WHERE id = ?").get(id) as any;
    if (!consumo) {
        return res.status(404).json({ error: "Consumo não encontrado" });
    }

    const reserva = db.prepare("SELECT status FROM reservas WHERE id = ?").get(consumo.reserva_id) as any;
    if (reserva && reserva.status === "Finalizado") {
        return res.status(400).json({ error: "Não é possível excluir consumos de uma reserva já finalizada" });
    }

    db.prepare("DELETE FROM consumos_minibar WHERE id = ?").run(id);
    res.status(204).send();
});
