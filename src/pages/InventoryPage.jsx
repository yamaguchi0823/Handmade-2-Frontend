import { useEffect, useRef, useState } from "react";
import api from "../api";

import PageHeader from "../components/PageHeader";
import StockAdjustModal from "../components/StockAdjustModal";
import StockHistoryModal from "../components/StockHistoryModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import SaleCreateModal from "../components/SaleCreateModal";
import InventoryVariantList from "../components/InventoryVariantList";

export default function InventoryPage({ readOnly = true }) {
  const [variants, setVariants] = useState([]);
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

  // 絞り込み条件がある状態
  const hasSearchConditions =
   q.trim() !== "" ||
   stockMode !== "ALL" ||
   status !== "";

  // 条件クリア
  const clearFilters = () => {
    setQ("");
    setStockMode("ALL");
    setStatus("");
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
        <div
          className="app-feedback app-feedback--success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast}
        </div>
      )}

      <PageHeader
        title="在庫一覧"
        description="バリエーションごとの在庫確認・調整・履歴管理を行います。"
        // actions={}
      />

      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section
        className="app-search-panel"
        aria-labelledby="inventory-search-title"
        aria-busy={searching}
      >
        <div className="app-search-fields app-search-fields--inventory">
          <div className="app-search-field">
            <label
              id="inventory-search-title"
              htmlFor="inventory-keyword"
              className="form-label"
            >
              バリエーションを検索
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

          <div className="app-search-field">
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

          <div className="app-search-field">
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

        <div className="app-search-footer">
          <p
            className="app-search-result"
            role="status"
            aria-live="polite"
          >
            {searching
              ? `検索しています`
              : `${variants.length}件のバリエーションを表示しています`
              }
          </p>

          {hasSearchConditions && (
            <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={clearFilters}
          >
            条件をクリア
          </button>
          )}
        </div>
      </section>

      <InventoryVariantList
        variants={variants}
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
        readOnly={readOnly}
        open={adjustOpen}
        variant={adjustVariant}
        onClose={() => {
          setAdjustOpen(false);
          setAdjustVariant(null);
        }}
        onAdjusted={async (newStock) => {
          setVariants((prev) =>
            prev.map((v) =>
              v.id === adjustVariant.id
                ? { ...v, stock: newStock }
                : v,
            ),
          );

          await loadVariants();
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
        readOnly={readOnly}
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
