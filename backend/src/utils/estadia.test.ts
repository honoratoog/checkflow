import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularDiasHospedado, calcularExtratoReserva } from "./estadia";

test("calcularDiasHospedado calcula noites entre datas no mesmo dia retornando 1 noite mínima", () => {
    const dias = calcularDiasHospedado("2026-10-20", "2026-10-20");
    assert.equal(dias, 1);
});

test("calcularDiasHospedado calcula diferença em dias entre checkin e checkout", () => {
    const dias = calcularDiasHospedado("2026-10-20", "2026-10-23");
    assert.equal(dias, 3);
});

test("calcularExtratoReserva calcula diárias e consumos somados no total a pagar", () => {
    const extrato = calcularExtratoReserva({
        data_checkin: "2026-10-20",
        data_checkout: "2026-10-23",
        diaria_base: 200,
        consumos: [
            { id: 1, item: "Água Mineral", quantidade: 2, valor_unitario: 6.0 },
            { id: 2, item: "Refrigerante", quantidade: 1, valor_unitario: 8.0 },
        ],
    });

    assert.equal(extrato.dias_hospedado, 3);
    assert.equal(extrato.diaria, 200);
    assert.equal(extrato.subtotal_diarias, 600);
    assert.equal(extrato.consumos.length, 2);
    assert.equal(extrato.consumos[0].subtotal, 12.0);
    assert.equal(extrato.consumos[1].subtotal, 8.0);
    assert.equal(extrato.total_consumos, 20.0);
    assert.equal(extrato.total_a_pagar, 620.0);
});

test("calcularExtratoReserva com consumos vazios calcula apenas diárias", () => {
    const extrato = calcularExtratoReserva({
        data_checkin: "2026-10-20",
        data_checkout: "2026-10-22",
        diaria_base: 150,
        consumos: [],
    });

    assert.equal(extrato.dias_hospedado, 2);
    assert.equal(extrato.subtotal_diarias, 300);
    assert.equal(extrato.total_consumos, 0);
    assert.equal(extrato.total_a_pagar, 300);
});

test("calcularExtratoReserva com diaria nula ou indefinida considera diaria zero", () => {
    const extrato = calcularExtratoReserva({
        data_checkin: "2026-10-20",
        data_checkout: "2026-10-21",
        diaria_base: null,
        consumos: [{ item: "Cerveja", quantidade: 2, valor_unitario: 10 }],
    });

    assert.equal(extrato.dias_hospedado, 1);
    assert.equal(extrato.subtotal_diarias, 0);
    assert.equal(extrato.total_consumos, 20);
    assert.equal(extrato.total_a_pagar, 20);
});
