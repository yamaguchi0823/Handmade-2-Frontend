import { useEffect, useState } from "react";
import api from "./api";
import VariantTable from "./components/VariantTable";
import ItemPanel from "./components/ItemsPanel";
import VariantCreateModal from "./components/VariantCreateModal";

function App() {
  const [variants, setVariants] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [q, setQ] = useState("");
  const [stockMode, setStockMode] = useState("ALL");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [variantModalOpen, setVariantModalOpen] = useState(false);

  // 一覧取得（共通処理）
  const loadVariants = async () => {
    try {
      setSearching(true);
      setError(""); // 成功したら消えるように開始時にクリア

      const res = await api.get("/variants", {
        params: {
          q: q || undefined,
          stockMode,
        },
      });
      setVariants(res.data); // 配列がくる
    } catch (e) {
      console.error(e);
      setError("一覧の取得に失敗しました");
    } finally {
      setSearching(false);
    }
  };

  // 在庫増減
  const changeStock = async (variantId, delta) => {
    if (updatingId === variantId) return; // 連打防止（次の「1」に繋がる）

    try {
      setUpdatingId(variantId);
      setError(""); //開始時にクリア

      const res = await api.post(
        `/variants/${variantId}/stock-movements/delta`,
        {
          delta,
          note: "Reactから調整",
        },
      );
      await loadVariants(); // 再取得
    } catch (e) {
      console.error(e);

      // Spring側が{message:"..."}を返している場合はそれを表示
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 409 ? "在庫が不足しています" : "") ||
        "在庫更新に失敗しました";

      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // 初回表示時
  useEffect(
    () => {
      // 第1引数には実行させたい副作用《関数》を記述（戻り値はクリーンアップ関数、または何も返さない）
      const init = async () => {
        await loadVariants();
      };
      init();
    },
    // 第2引数には副作用関数の実行タイミングを制御する依存データを記述（[状態変数、または空の配列]）
    [],
  );

  return (
    <div style={{ padding: "20px" }}>
      <ItemPanel />
      <h2>在庫一覧</h2>

      <button type="button" onClick={() => setVariantModalOpen(true)}>
        +バリエ追加
      </button>
      <VariantCreateModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        onCreated={() => loadVariants()} // 登録後に一覧更新
      />

      {error && (
        <div style={{ color: "red", marginBottom: "8px" }}>{error}</div>
      )}
      <form
        style={{ marginBottom: "12px" }}
        onSubmit={(e) => {
          e.preventDefault(); // ページリロード禁止
          loadVariants();
        }}
      >
        <input
          type="text"
          placeholder="キーワード（作品名/SKU）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginRight: "8px" }}
        />
        <select
          value={stockMode}
          onChange={(e) => setStockMode(e.target.value)}
          style={{ marginRight: "8px" }}
        >
          <option value="ALL">すべて</option>
          <option value="IN_STOCK">在庫あり</option>
          <option value="OUT_OF_STOCK">在庫なし</option>
          <option value="LOW_STOCK">在庫少</option>
        </select>

        <button
          type="submit"
          disabled={searching}
          style={{ backgroundColor: "pink" }}
        >
          {searching ? "検索中" : "検索"}
        </button>
      </form>

      <VariantTable
        variants={variants}
        onDelta={changeStock}
        updatingId={updatingId}
      />
    </div>
  );
}

export default App;
