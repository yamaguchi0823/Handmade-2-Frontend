import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage"
import ItemsPage from "./pages/ItemsPage";
import SalesPage from "./pages/SalesPage";
import ProfitPage from "./pages/ProfitPage";

export default function App() {
  const linkClass = ({ isActive }) =>
    `app-nav-link${isActive ? " is-active" : ""}`;

  return (
    <BrowserRouter>
      <a href="#main-content" className="skip-link">
        本文へ移動
      </a>

      <div className="app-shell">
        <header className="app-header">
          <div className="app-container app-header-inner">
            <NavLink
              to="/dashboard"
              className="app-brand"
              aria-label="Handmade-2 ダッシュボードへ"
              >
                Handmade-2
              </NavLink>

              <nav
                className="app-nav"
                aria-label="メインナビゲーション"
              >
                <ul className="app-nav-list">
                  <li>
                    <NavLink to="/dashboard" className={linkClass}>
                      ダッシュボード
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/profit" className={linkClass}>
                      利益詳細
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/items" className={linkClass}>
                      作品管理
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/inventory" className={linkClass}>
                      在庫
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/sales" className={linkClass}>
                      販売
                    </NavLink>
                  </li>
                </ul>
              </nav>
          </div>
        </header>

        <main
          id="main-content"
          className="app-main"
          tabIndex="-1"
          >
            <div className="app-container app-main-container">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profit" element={<ProfitPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/sales" element={<SalesPage />} />
              </Routes>
            </div>
        </main>
      </div>
    </BrowserRouter>
  )

}

