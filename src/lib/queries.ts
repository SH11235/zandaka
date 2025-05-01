import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { Utf8, Float64 } from "apache-arrow";

export type MonthlyRow = {
    ym: string; // '2025-04'
    income: number; // 入金合計
    outgo: number; // 出金合計
};

export async function getMonthlySummary(db: AsyncDuckDB): Promise<MonthlyRow[]> {
    const conn = await db.connect();
    try {
        const res = await conn.query<{
            ym: Utf8;
            income: Float64;
            outgo: Float64;
        }>(`
      SELECT
        strftime('%Y-%m', date) AS ym,
        SUM(deposit)            AS income,
        SUM(withdrawal)         AS outgo
      FROM bank
      GROUP BY ym
      ORDER BY ym;
    `);
        return res.toArray();
    } finally {
        await conn.close();
    }
}
