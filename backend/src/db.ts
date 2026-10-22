import Database from "better-sqlite3";

export const db = new Database("pousada.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS quartos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Livre'
  );

  CREATE TABLE IF NOT EXISTS hospedes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    documento TEXT NOT NULL,
    telefone TEXT
  );

  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quarto_id INTEGER NOT NULL REFERENCES quartos(id),
    hospede_id INTEGER NOT NULL REFERENCES hospedes(id),
    data_checkin TEXT NOT NULL,
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
