import { useEffect, useMemo, useState } from "react";
import { fetchChannelProfit, fetchLowStockVariants } from "../api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthRangeToday() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: ymd(from), to: ymd(to) };
}

function money(n) {
  return Number(n ?? 0).toLocaleString("ja-JP", {
    style: "currency",
    currency: "JPY",
  });
}

export default function DashboardPage() {
  const range = useMemo(() => monthRangeToday(), []);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    salesCount: 0,
    totalAmount: 0,
    profit: 0,
    lowStockCount: 0,
  });

  const navigate = useNavigate();

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetchChannelProfit({
        from: from || undefined,
        to: to || undefined,
      });
      const rows = Array.isArray(res.data) ? res.data : [];

      const salesCount = rows.reduce(
        (sum, r) => sum + Number(r.salesCount ?? 0),
        0,
      );
      const totalAmount = rows.reduce(
        (sum, r) => sum + Number(r.totalAmount ?? 0),
        0,
      );
      const profit = rows.reduce((sum, r) => sum + Number(r.profit ?? 0), 0);

      const res2 = await fetchLowStockVariants();
      const lowStockCount = Array.isArray(res2.data) ? res2.data.length : 0;

      setSummary({ salesCount, totalAmount, profit, lowStockCount });

    } catch (e) {
      console.error(e);
      setSummary((prev) => ({ ...prev }));
      setError("ダッシュボード集計の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="ダッシュボード"
        actions={
          <form
            className="row g-2 align-items-end"
            onSubmit={(e) => {
              e.preventDefault();
              loadSummary();
            }}
          >
            <div className="col-12 col-sm-auto">
              <label
                htmlFor="dashbord-from"
                className="form-label mb-1"
              >開始日
              </label>

              <input
                id="dashbord-from"
                type="date"
                className="form-control"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-12 col-sm-auto">
              <label
                htmlFor="dashbord-to"
                className="form-label mb-1"
              >
                終了日
              </label>

              <input
                id="dashbord-to"
                type="date"
                className="form-control"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="col-12 col-sm-auto d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "更新中" : "更新"}
              </button>
            </div>
          </form>
        }
      />

      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* サマリーカード */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">期間売上</div>
              <div className="fs-4 fw-semibold text-end">
                {money(summary.totalAmount)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div
            className="card"
            role="button"
            onClick={() => navigate(`/profit?from=${from}&to=${to}`)}
          >
            <div className="card-body">
              <div className="text-muted small">期間利益</div>
              <div
                className={`fs-4 fw-semibold text-end ${
                  Number(summary.profit) < 0 ? "text-danger" : ""
                }`}
              >
                {money(summary.profit)}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">期間販売件数</div>
              <div className="fs-4 fw-semibold text-end">
                {Number(summary.salesCount).toLocaleString()} 件
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">
                在庫少（現在）
              </div>
              <div className="fs-4 fw-semibold text-end">
                {Number(summary.lowStockCount).toLocaleString()} 件
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
