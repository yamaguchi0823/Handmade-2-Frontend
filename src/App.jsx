import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import SalesPage from "./pages/SalesPage";
import ProfitPage from "./pages/ProfitPage";

export default function App() {
  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "active fw-semibold" : ""}`;

  return (
    <BrowserRouter>
      <div className="container py-3">
        <header className="mb-3">
          <h1 className="h4 mb-2">Handmade-2</h1>

          <ul className="nav nav-pills gap-1">
            <li className="nav-item">
              <NavLink to="/dashboard" className={linkClass}>
                ダッシュボード
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/profit" className={linkClass}>
                利益詳細
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/inventory" className={linkClass}>
                在庫
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/sales" className={linkClass}>
                販売
              </NavLink>
            </li>
          </ul>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profit" element={<ProfitPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/sales" element={<SalesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
