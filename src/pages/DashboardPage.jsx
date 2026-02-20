import { useEffect, useMemo, useState } from "react";
import ChannelProfitPanel from "../components/ChannelProfitPanel";
import { fetchChannelProfit, fetchLowStockVariants } from "../api";

function ymd(d) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthRangeToday() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 月末
  return { from: ymd(from), to: ymd(to) };
}

function money(n) {
  return Number(n ?? 0).toLocaleString();
}

export default function DashboardPage() {
  const range = useMemo(() => monthRangeToday(), []);
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [reloadKey, setReloadKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    salesCount: 0,
    totalAmount: 0,
    profit: 0,
    lowStockCount: 0,
  });

  const loadSummary = async () => {
    try {
      setLoading(true);

      // ① 今月のチャネル別集計（売上・利益・件数を合計する）
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

      // ② 在庫少 件数（今月関係なく「現在」）
      const res2 = await fetchLowStockVariants();
      const lowStockCount = Array.isArray(res2.data) ? res2.data.length : 0;

      setSummary({ salesCount, totalAmount, profit, lowStockCount });
      setReloadKey((k) => k + 1);
    } catch (e) {
      console.error(e);
      // 失敗しても真っ白にしない
      setSummary((prev) => ({ ...prev }));
      alert("ダッシュボード集計の取得に失敗しました");
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
      <div className="d-flex align-item-center justify-content-between mb-3 flex-wrap gap-2">
        <h2 className="h4 mb-3">ダッシュボード</h2>

        <div className="d-flex gap-2 align-items-end flex-wrap">
          <div>
            <label className="form-label mb-1">From</label>
            <input
              type="date"
              className="form-control"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-control"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={loadSummary}
            disabled={loading}
            style={{ height: 38, marginTop: 23 }}
          >
            {loading ? "更新中" : "更新"}
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">今月売上</div>
              <div className="fs-4 fw-semibold text-end">
                {money(summary.totalAmount)} 円
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">今月利益</div>
              <div
                className={`fs-4 fw-semibold text-end ${
                  Number(summary.profit) < 0 ? "text-danget" : ""
                }`}
              >
                {money(summary.profit)} 円
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card">
            <div className="card-body">
              <div className="text-muted small">今月販売件数</div>
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
                在庫少（現在※しきい値以下の件数）
              </div>
              <div className="fs-4 fw-semibold text-end">
                {Number(summary.lowStockCount).toLocaleString()} 件
              </div>
              {/* <div className="text-muted small">しきい値以下の件数</div> */}
            </div>
          </div>
        </div>
      </div>

      {/* 既存：チャネル別利益テーブル（期間入力付きのままでもOK） */}
      <ChannelProfitPanel from={from} to={to} reloadkey={reloadKey} />
    </div>
  );
}
