import { useBankStore } from "@/contexts/BankContext";
import { Button } from "@/components/ui/button";

export function PurgeButton() {
    const { purgeDb } = useBankStore();

    const onClick = async () => {
        if (!confirm("ローカルDBを削除してよろしいですか？")) return;
        await purgeDb();
        alert("データベースを初期化しました");
    };

    return (
        <Button variant="destructive" onClick={onClick}>
            データ削除
        </Button>
    );
}
