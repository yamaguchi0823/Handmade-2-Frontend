import { useEffect, useState } from "react";
import api from "../api";
import SalesPanel from "../components/SalesPanel";
import SaleCreateModal from "../components/SaleCreateModal";

export default function SalesPage() {
  const [saleOpen, setSaleOpen] = useState(false);
  const [variants, setVariants] = useState([]);
  const [toast, setToast] = useState("");

  const loadVariants = async () => {
    try {
      const res = await api.get("/variants");
      setVariants(res.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVariants();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h4 mb-0">販売</h2>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setSaleOpen(true)}
        >
          +販売登録
        </button>
      </div>

      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <SalesPanel />

      <SaleCreateModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        variants={variants}
        onCreated={() => {
          setToast("販売を登録しました");
        }}
      />
    </div>
  );
}
