import styles from "./InventoryPage.module.css"
import { useEffect, useRef, useState } from "react";
import api from "../api";

import PageHeader from "../components/PageHeader";
import StockAdjustModal from "../components/StockAdjustModal";
import StockHistoryModal from "../components/StockHistoryModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import SaleCreateModal from "../components/SaleCreateModal";
import InventoryVariantList from "../components/InventoryVariantList";

export default function InventoryPage() {
  const [variants, setVariants] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
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

  const toastTimerRef = useRef(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  };

  // 一覧取得（共通処理）
  const loadVariants = async () => {
    try {
      setSearching(true);
      setError("");

      const res = await api.get("/variants", {
        params: {
          q: q || undefined,
          stockMode,
          status: status || undefined,
        },
      });

      setVariants(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError("一覧の取得に失敗しました");
      setVariants([]);
    } finally {
      setSearching(false);
    }
  };

  // 条件クリア
  const clearFilters = () => {
    setQ("");
    setStockMode("ALL");
    setStatus("");
  };

  // 在庫増減
  const changeStock = async (variantId, delta) => {
    if (updatingId === variantId) return;

    try {
      setUpdatingId(variantId);
      setError("");

      const res = await api.post(
        `/variants/${variantId}/stock-movements/delta`,
        {
          delta,
          note: "Reactから調整",
        },
      );

      const newStock = res.data?.stock;

      if (typeof newStock === "number") {
        setVariants((prev) =>
          prev.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v)),
        );
      } else {
        await loadVariants();
      }

      showToast("在庫を更新しました");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message ||
        (e?.response?.status === 409 ? "在庫が不足しています" : "") ||
        "在庫更新に失敗しました";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // 初回表示時：検索条件が変わったら自動的に取得
  useEffect(() => {
    const timerId = window.setTimeout(() => {
      loadVariants();
    }, 300);

    return () => {
      window.clearTimeout(timerId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, stockMode, status]);

  // 画面を離れるときにトーストのタイマーを解除
  useEffect(()=>{
    return () =>{
      if (toastTimerRef.current){
        clearTimeout(toastTimerRef.current);
      }
    };
  },[]);

  return (
    <div>
      {toast && (
        <div className="alert alert-success py-2" role="alert">
          {toast}
        </div>
      )}

      <PageHeader
        title="在庫一覧"
        actions={
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => setSaleOpen(true)}
            >
              +販売登録
            </button>
          </div>
        }
      />

      {error && (
        <div className="alert alert-danger py-2 mb-2" role="alert">
          {error}
        </div>
      )}

      <section
        className={styles.searchPanel}
        aria-labelledby="inventory-search-title"
        aria-busy={searching}
      >
        <div className={styles.searchFields}>
          <div className={styles.keywordFields}>
            <label
              id="inventory-search-title"
              htmlFor="inventory-keyword"
              className="form-label"
            >
              在庫を検索
            </label>

            <input
              id="inventory-keyword"
              type="search"
              className="form-control"
              placeholder="作品名・説明・バリエーション名・SKU"
              value={q}
              onChange={(e) => setQ(e.target.value)}
             />
          </div>

          <div>
            <label
              htmlFor="inventory-stock-mode"
              className="form-label"
            >
              在庫状況
            </label>

            <select
              id="inventory-stock-mode"
              value={stockMode}
              onChange={(e) => setStockMode(e.target.value)}
              className="form-select"
            >
              <option value="ALL">すべて</option>
              <option value="IN_STOCK">在庫あり</option>
              <option value="LOW_STOCK">在庫少</option>
              <option value="OUT_OF_STOCK">在庫なし</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="inventory-status"
              className="form-label"
            >
              販売状態
            </label>

            <select
              id="inventory-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="">すべて</option>
              <option value="ACTIVE">販売中</option>
              <option value="INACTIVE">停止中</option>
            </select>
          </div>
        </div>

        <div className={styles.searchFooter}>
          <p
            className={styles.resultCount}
            role="status"
            aria-live="polite"
          >
            検索しています
            {variants.length}件のバリエーションを表示しています
          </p>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={clearFilters}
            disabled={
              q === "" &&
              stockMode === "ALL" &&
              status === ""
            }
          >
            条件をクリア
          </button>
        </div>
      </section>

      <InventoryVariantList
        variants={variants}
        updatingId={updatingId}
        onDelta={changeStock}
        onPreviewImage={(v) => {
          if (!v.imageUrl) return;

          setPreviewUrl(v.imageUrl);
          setPreviewTitle(
            `${v.itemName ?? ""} / ${v.variantName ?? ""}`,
          );
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

      <SaleCreateModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        variants={variants}
        onCreated={async () => {
          await loadVariants();
          showToast("販売を登録しました");
        }}
      />
    </div>
  );
}
