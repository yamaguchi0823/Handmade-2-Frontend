import { useEffect, useState } from "react";
import api from "./api";
import VariantTable from "./components/VariantTable";
import ItemPanel from "./components/ItemsPanel";
import VariantCreateModal from "./components/VariantCreateModal";
import VariantEditModal from "./components/VariantEditModal";
import StockAdjustModal from "./components/StockAdjustModal";
import StockHistoryModal from "./components/StockHistoryModal";
import ImagePreviewModal from "./components/ImagePreviewModal";
import SaleCreateModal from "./components/SaleCreateModal";
import SalesPanel from "./components/SalesPanel";

function App() {
  const [variants, setVariants] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustVariant, setAdjustVariant] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVariant, setHistoryVariant] = useState(null);
  const [saleOpen, setSaleOpen] = useState(false);

  const [q, setQ] = useState("");
  const [stockMode, setStockMode] = useState("ALL");
  const [status, setStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [toastTimer, setToastTimer] = useState(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToast(""), 3000);
    setToastTimer(t);
  };

  // 一覧取得（共通処理）
  const loadVariants = async () => {
    try {
      setSearching(true);
      setError(""); // 成功したら消えるように開始時にクリア

      const res = await api.get("/variants", {
        params: {
          q: q || undefined,
          stockMode,
          status: status || undefined,
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

      const newStock = res.data?.stock;

      // ★一覧を全取り直しせず、その行だけ更新
      if (typeof newStock === "number") {
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v)),
        );
      } else {
        // 万一レスポンス形が違う場合だけ再取得
        await loadVariants();
      }

      showToast("在庫を更新しました");
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

  // 画像URLを更新
  const setVariantImageUrl = (variantId, imageUrl) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId ? { ...v, imageUrl: imageUrl || null } : v,
      ),
    );

    //編集モーダル側で表示している variant も更新しておくと気持ち良い
    setEditingVariant((prev) =>
      prev && prev.id === variantId
        ? { ...prev, imageUrl: imageUrl || null }
        : prev,
    );
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
    <div className="container py-4 overflow-x-auto">
      <ItemPanel />
      <hr className="my-4" />
      <SalesPanel />

      <hr className="my-4" />
      {toast && (
        <div className="alert alert-success py-2" role="alert">
          {toast}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="h4 mb-0">在庫一覧</h2>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setSaleOpen(true)}
        >
          +販売登録
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setVariantModalOpen(true)}
        >
          +バリエ追加
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 mb-2" role="alert">
          {error}
        </div>
      )}

      <form
        className="row g-2 align-items-end mb-3"
        onSubmit={(e) => {
          e.preventDefault(); // ページリロード禁止
          loadVariants();
        }}
      >
        <div className="col-12 col-md-4">
          <label className="form-label">キーワード</label>
          <input
            type="text"
            className="form-control"
            placeholder="作品名/SKU"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">在庫</label>
          <select
            value={stockMode}
            onChange={(e) => setStockMode(e.target.value)}
            className="form-select"
          >
            <option value="ALL">すべて</option>
            <option value="IN_STOCK">在庫あり</option>
            <option value="OUT_OF_STOCK">在庫なし</option>
            <option value="LOW_STOCK">在庫少</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">状態</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="">状態：すべて</option>
            <option value="ACTIVE">ACTIVE（販売中）</option>
            <option value="INACTIVE">INACTIVE（停止）</option>
          </select>
        </div>

        <div className="col-12 col-md-2 d-grid">
          <button
            type="submit"
            disabled={searching}
            className="btn btn-outline-primary"
          >
            {searching ? "検索中" : "検索"}
          </button>
        </div>
      </form>

      <div className="table-responsive">
        <VariantTable
          variants={variants}
          onDelta={changeStock}
          updatingId={updatingId}
          onEdit={(v) => {
            setEditingVariant(v);
            setEditOpen(true);
          }}
          onPreviewImage={(v) => {
            if (!v.imageUrl) return;
            setPreviewUrl(v.imageUrl);
            setPreviewTitle(`${v.itemName ?? ""} / ${v.skuCode ?? ""}`);
            setPreviewOpen(true);
          }}
          onHistory={(v) => {
            setHistoryVariant(v);
            setHistoryOpen(true);
          }}
          onAdjust={(v) => {
            setAdjustVariant(v);
            setAdjustOpen(true);
          }}
        />
      </div>

      <VariantEditModal
        open={editOpen}
        variant={editingVariant}
        onClose={() => {
          setEditOpen(false);
          setEditingVariant(null);
        }}
        onUpdated={() => {
          loadVariants();
          showToast("更新しました");
        }}
        onImageUploaded={(variantId, imageUrl) => {
          setVariantImageUrl(variantId, imageUrl);
          showToast(imageUrl ? "画像を更新しました" : "画像を削除しました");
        }}
        onPreviewImage={(v) => {
          if (!v?.imageUrl) return;
          setPreviewUrl(v.imageUrl);
          setPreviewTitle(`${v.itemName ?? ""} / ${v.skuCode ?? ""}`);
          setPreviewOpen(true);
        }}
      />

      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewUrl}
        title={previewTitle}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewUrl("");
          setPreviewTitle("");
        }}
      />

      <StockAdjustModal
        open={adjustOpen}
        variant={adjustVariant}
        onClose={() => {
          setAdjustOpen(false);
          setAdjustVariant(null);
        }}
        onAdjusted={(newStock) => {
          setVariants((prev) =>
            prev.map((v) =>
              v.id === adjustVariant.id ? { ...v, stock: newStock } : v,
            ),
          );
          showToast("棚卸を反映しました");
        }}
      />

      <StockHistoryModal
        open={historyOpen}
        variant={historyVariant}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryVariant(null);
        }}
      />

      <VariantCreateModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        onCreated={() => {
          loadVariants(); // 登録後に一覧更新
          showToast("バリエーションを追加しました");
        }}
      />

      <SaleCreateModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        variants={variants}
        onCreated={async () => {
          await loadVariants(); // 在庫を更新
          showToast("販売を登録しました");
        }}
      />
    </div>
  );
}

export default App;
