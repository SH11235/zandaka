import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { getMonthlySummary, MonthlyRow } from "@/lib/queries";
import { initDB } from "@/lib/initDB";

type BankState = {
    db?: AsyncDuckDB;
    monthly: MonthlyRow[];
    setDB: (db: AsyncDuckDB) => void;
    refreshData: () => Promise<void>;
    ensureDB: () => Promise<AsyncDuckDB>;
    purgeDb: () => Promise<void>;
};

const BankContext = createContext<BankState | undefined>(undefined);

// ---------------- Provider ----------------
export function BankProvider({ children }: { children: ReactNode }) {
    const [db, setDb] = useState<AsyncDuckDB>();

    const ensureDB = useCallback(async () => {
        if (db) return db;
        const newDb = await initDB();
        setDb(newDb);
        return newDb;
    }, [db]);

    const [monthly, setMonthly] = useState<MonthlyRow[]>([]);

    const setDB = useCallback((instance: AsyncDuckDB) => {
        setDb(instance);
    }, []);

    const refreshData = useCallback(async () => {
        const current = await ensureDB();
        const rows = await getMonthlySummary(current);
        setMonthly(rows);
    }, [ensureDB]);

    const purgeDb = useCallback(async () => {
        if (db) {
            await db.terminate(); // ハンドル解放
            console.log("DB terminated");
            setDb(undefined);
        }
        // ファイル削除
        const root = await navigator.storage.getDirectory();
        await root.removeEntry("zandaka.db", { recursive: true }).catch(() => {});
        await root.removeEntry("zandaka.db.wal", { recursive: true }).catch(() => {});
        indexedDB.deleteDatabase("zandaka.db");
        setMonthly([]);
    }, [db]);

    const value: BankState = {
        db,
        monthly,
        setDB,
        refreshData,
        ensureDB,
        purgeDb,
    };

    return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

// --------------- 専用フック ----------------
export function useBankStore(): BankState {
    const ctx = useContext(BankContext);
    if (!ctx) throw new Error("useBankStore must be inside <BankProvider>");
    return ctx;
}
