import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

/**
 * 三井住友銀行の明細 TSV/CSV を bank テーブルへ INSERT する。
 * - 想定ヘッダ: 年月日 / お引出し / お預入れ / お取り扱い内容 / 残高
 * - 区切り:   タブ (エクセル貼付) または カンマ
 * - 金額の空欄は 0 とみなす
 */
export async function importBankCsv(db: AsyncDuckDB, file: File): Promise<void> {
    // ① テキスト取得
    const raw = await file.text();

    // ② 一時ファイルとして登録
    await db.registerFileText(file.name, raw);

    // ③ 区切りを判定（1行目にカンマが含まれていれば CSV とみなす）
    const delimiter = raw.split(/\r?\n/, 1)[0].includes(",") ? "," : "\t";

    // ④ INSERT
    const conn = await db.connect();
    try {
        await conn.query(`
      COPY bank FROM '${file.name}'
      (DELIMITER '${delimiter}', HEADER TRUE, NULL '', AUTO_DETECT TRUE);
      /* NULL '' で空欄→NULL、AUTO_DETECT で型推論 */
    `);

        /* withdrawal / deposit の空NULLを 0 に整形しておく */
        await conn.query(`
      UPDATE bank
      SET
        withdrawal = COALESCE(withdrawal, 0),
        deposit    = COALESCE(deposit,    0);
    `);
    } finally {
        await conn.close();
        await db.dropFile(file.name); // 仮登録ファイルを削除
    }
}
