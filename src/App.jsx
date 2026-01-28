import { useEffect, useState } from "react";
import api from "./api";
import VariantTable from "./components/VariantTable";

function App() {
  const [variants, setVariants] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  // 一覧取得（共通処理）
  const loadVariants = async () => {
    const res = await api.get("/variants");
    setVariants(res.data); // 配列がくる
  };

  // 在庫増減
  const changeStock = async (variantId, delta) => {
    if (updatingId === variantId) return; // 連打防止（次の「1」に繋がる）

    try {
      setUpdatingId(variantId);

      await api.post(`/variants/${variantId}/stock-movements/delta`, {
        delta,
        note: "Reactから調整",
      });
      await loadVariants(); // 再取得
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
      <h2>在庫一覧</h2>

      <VariantTable
        variants={variants}
        onDelta={changeStock}
        updatingId={updatingId}
      />
    </div>
  );
}

export default App;
