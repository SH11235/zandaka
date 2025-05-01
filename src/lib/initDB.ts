import { AsyncDuckDB, ConsoleLogger, DuckDBAccessMode } from "@duckdb/duckdb-wasm";
import workerUrl from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?worker";
import wasmUrl from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";

const DB_PATH_OPFS = "opfs://zandaka.db";
const DB_PATH_INDEX_DB = "zandaka.db";

export async function initDB(): Promise<AsyncDuckDB> {
    const db = new AsyncDuckDB(new ConsoleLogger(), new workerUrl());
    await db.instantiate(wasmUrl);

    // --- open with retry wrapper -------------------------------------------
    async function tryOpen(path: string) {
        try {
            console.log("Opening DB:", path);
            await db.open({ path, accessMode: DuckDBAccessMode.READ_WRITE });
            console.log("DB opened:", path);
            return true;
        } catch {
            /* ファイルを削除して再作成を試す */
            await deleteDbFile(path);
            try {
                await db.open({ path, accessMode: DuckDBAccessMode.READ_WRITE });
                return true;
            } catch {
                return false;
            }
        }
    }

    // 1️⃣ OPFS 優先 → 2️⃣ IndexedDB フォールバック
    const opened = (await tryOpen(DB_PATH_OPFS)) || (await tryOpen(DB_PATH_INDEX_DB));

    if (!opened) throw new Error("DuckDB could not be opened in READ_WRITE mode");

    // 初期テーブル
    const conn = await db.connect();
    console.log("Creating table if not exists");
    await conn.query(`
    CREATE TABLE IF NOT EXISTS bank(
      date DATE,
      withdrawal BIGINT,
      deposit BIGINT,
      detail TEXT,
      balance BIGINT
    );
  `);
    await conn.close();
    return db;
}

/* browser-side: OPFS or idbfs ファイル削除 */
async function deleteDbFile(path: string) {
    if (path.startsWith("opfs://")) {
        try {
            const root = await navigator.storage.getDirectory();
            await root.removeEntry(path.replace("opfs://", ""));
        } catch {
            console.error("Failed to delete OPFS file:", path);
        }
    } else {
        // idbfs
        try {
            indexedDB.deleteDatabase(path);
        } catch {
            console.error("Failed to delete IndexedDB database:", path);
        }
    }
}
