import { useEffect, useRef, useState } from "react";
import api from "../api";
import SalesPanel from "../components/SalesPanel";
import SaleCreateModal from "../components/SaleCreateModal";
import PageHeader from "../components/PageHeader";

export default function SalesPage() {
  const [saleOpen, setSaleOpen] = useState(false);
  const [variants, setVariants] = useState([]);
  const [toast, setToast] = useState("");

  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  };

  const loadVariants = async () => {
    try {
      const res = await api.get("/variants");
      setVariants(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setVariants([]);
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

      {toast && <div className="alert alert-success py-2">{toast}</div>}

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
