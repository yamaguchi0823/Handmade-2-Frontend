import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ChannelProfitPanel from "../components/ChannelProfitPanel";

export default function ProfitPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [searchParams] = useSearchParams();

  // ダッシュボードから ?from=...&to=... で来たら自動セット＆自動集計
  useEffect(() => {
    const f = searchParams.get("from") || "";
    const t = searchParams.get("to") || "";
    setFrom(f);
    setTo(t);

    if (f || t) setReloadKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="h4 mb-3">利益詳細</h2>

      <form
        className="row g-2 align-items-end mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          setReloadKey((k) => k + 1);
        }}
      >
        <div className="col-12 col-sm">
          <label className="form-label">From</label>
          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="col-12 col-sm">
          <label className="form-label">To</label>
          <input
            type="date"
            className="form-control"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="col-12 col-sm-auto d-grid">
          <button type="submit" className="btn btn-primary">
            集計
          </button>
        </div>
      </form>

      <ChannelProfitPanel from={from} to={to} reloadKey={reloadKey} />
    </div>
  );
}
