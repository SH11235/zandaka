import { importBankCsv } from "@/lib/importCsv";
import { useBankStore } from "@/contexts/BankContext";

export function UploadZone() {
    const { db, setDB, ensureDB, refreshData, monthly } = useBankStore();

    const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("db:", db);

        console.log("File selected:", file);

        // ① 既存インスタンス or 新規生成
        const database = db ?? (await ensureDB());

        console.log("database:", database);

        // ② CSV 取り込み
        await importBankCsv(database, file);

        console.log("CSV imported");

        // ③ store に保存（初回だけ）
        if (!db) setDB(database);

        // ④ 集計を更新
        await refreshData();
    };

    return (
        <>
            <input
                type="file"
                accept=".csv,.tsv,text/plain"
                onChange={onFile}
                className="file-input"
            />
            <div className="flex flex-col gap-2">{JSON.stringify(monthly, null, 2)}</div>
        </>
    );
}
