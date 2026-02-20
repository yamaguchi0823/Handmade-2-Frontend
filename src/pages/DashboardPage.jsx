import ChannelProfitPanel from "../components/ChannelProfitPanel";

export default function DashboardPage() {
  return (
    <div>
      <h2 className="h4 mb-3">ダッシュボード</h2>

      {/* ここに利益集計 */}
      <ChannelProfitPanel />
    </div>
  );
}
