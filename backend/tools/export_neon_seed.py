from __future__ import annotations

import sqlite3
from pathlib import Path


SRC = Path(__file__).resolve().parents[1] / "fairsplit.db"
OUT = Path(__file__).resolve().parents[1] / "neon_seed.sql"

TABLES = ["users", "developer_profiles", "expenses", "trip_plans", "reviews"]
JSON_COLUMNS = {"participants", "shares", "settlements", "interests", "trip_data"}
TS_COLUMNS = {"created_at", "updated_at"}


def sql_literal(value: object) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return repr(value)
    text = str(value).replace("'", "''")
    return f"'{text}'"


def main() -> None:
    conn = sqlite3.connect(SRC)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    lines: list[str] = []
    lines.append("BEGIN;")
    lines.append("")
    lines.append("-- Reset Neon so the local sample data can be imported cleanly.")
    lines.append("TRUNCATE TABLE reviews, trip_plans, expenses, developer_profiles, users RESTART IDENTITY CASCADE;")

    for table in TABLES:
        rows = [dict(row) for row in cur.execute(f"SELECT * FROM {table} ORDER BY id").fetchall()]
        if not rows:
            continue

        columns = list(rows[0].keys())
        values_sql: list[str] = []

        for row in rows:
            values: list[str] = []
            for column in columns:
                value = row[column]
                literal = sql_literal(value)
                if column in JSON_COLUMNS and value is not None:
                    literal += "::json"
                elif column in TS_COLUMNS and value is not None:
                    literal += "::timestamp"
                values.append(literal)
            values_sql.append("(" + ", ".join(values) + ")")

        lines.append("")
        lines.append(f"INSERT INTO {table} ({', '.join(columns)}) VALUES")
        lines.append(",\n".join(values_sql) + ";")

    for table in ["users", "expenses", "trip_plans", "reviews"]:
        lines.append("")
        lines.append(
            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {table}), 1), true);"
        )

    lines.append("")
    lines.append("COMMIT;")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
