import { useEffect, useRef, useState } from "react";
import api from "../api";
import SalesPanel from "../components/SalesPanel";
import SaleCreateModal from "../components/SaleCreateModal";
import PageHeader from "../components/PageHeader";

export default function SalesPage() {
  const [saleOpen, setSaleOpen] = useState(false);
  const [variants, setVariants] = useState([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  };

  const loadVariants = async () => {
    try {
      setError("");

      const res = await api.get("/variants");
      setVariants(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setVariants([]);
      setError(
        "販売登録に必要なバリエーションの取得に失敗しました",
      );
    }
  };

  useEffect(() => {
    loadVariants();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="販売"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSaleOpen(true)}
          >
            +販売登録
          </button>
        }
      />

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

        {error && (
          <div
            className="app-feedback app-feedback--error"
          >
            {error}
          </div>
        )}

      <SalesPanel />

      <SaleCreateModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        variants={variants}
        onCreated={async () => {
          await loadVariants(); // 次の登録の選択肢も最新に
          showToast("販売を登録しました");
        }}
      />
    </div>
  );
}
