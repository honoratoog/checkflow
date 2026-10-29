import Database from "better-sqlite3";
import { obterDiariaPadrao } from "./utils/precos";

export const db = new Database("pousada.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Livre',
    diaria_base REAL
  );

  CREATE TABLE IF NOT EXISTS hospedes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    documento TEXT NOT NULL,
    telefone TEXT,
    tipo_documento TEXT
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_id INTEGER NOT NULL REFERENCES quartos(id),
    hospede_id INTEGER NOT NULL REFERENCES hospedes(id),
    data_checkin TEXT NOT NULL,
    data_checkout TEXT,
    status TEXT NOT NULL DEFAULT 'Reservado'
  );

  CREATE TABLE IF NOT EXISTS consumos_minibar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_consumos_minibar_reserva ON consumos_minibar(reserva_id);
`);

// Migração para adicionar diaria_base em bancos que já possuíam a tabela quartos
const colunasQuartos = db.prepare("PRAGMA table_info(quartos)").all() as { name: string }[];
if (!colunasQuartos.some((c) => c.name === "diaria_base")) {
    db.exec("ALTER TABLE quartos ADD COLUMN diaria_base REAL");
}

// Migração para adicionar tipo_documento em hospedes
const colunasHospedes = db.prepare("PRAGMA table_info(hospedes)").all() as { name: string }[];
if (!colunasHospedes.some((c) => c.name === "tipo_documento")) {
    db.exec("ALTER TABLE hospedes ADD COLUMN tipo_documento TEXT");
}

// Migração para adicionar data_checkout em reservas
const colunasReservas = db.prepare("PRAGMA table_info(reservas)").all() as { name: string }[];
if (!colunasReservas.some((c) => c.name === "data_checkout")) {
    db.exec("ALTER TABLE reservas ADD COLUMN data_checkout TEXT");
}

// Preenche diaria_base de quartos pré-existentes sem valor
const quartosSemDiaria = db
    .prepare("SELECT id, tipo FROM quartos WHERE diaria_base IS NULL")
    .all() as { id: number; tipo: string }[];

for (const q of quartosSemDiaria) {
    const diaria = obterDiariaPadrao(q.tipo) ?? 120;
    db.prepare("UPDATE quartos SET diaria_base = ? WHERE id = ?").run(diaria, q.id);
}

