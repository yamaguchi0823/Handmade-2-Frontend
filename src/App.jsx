import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import ItemsPage from "./pages/ItemsPage";
import SalesPage from "./pages/SalesPage";
import ChannelsPage from "./pages/ChannelsPage";

import AppLogo from "./components/AppLogo";

import { fetchAppConfig } from "./api";

const navigationItems = [
  {
    to: "/dashboard",
    label: "ダッシュボード",
    icon: "dashboard",
  },
  {
    to: "/inventory",
    label: "在庫管理",
    icon: "inventory",
  },
  {
    to: "/sales",
    label: "販売管理",
    icon: "sales",
  },
  {
    to: "/items",
    label: "作品管理",
    icon: "item",
  },
  {
    to: "/channels",
    label: "チャネル管理",
    icon: "channel",
  },



];

function NavigationIcon({ name }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V12" />
        <path d="M10 20V7" />
        <path d="M16 20V3" />
        <path d="M2 20h20" />
      </svg>
    );
  }

  if (name === "item") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 13 13 20 4 11V4h7l9 9Z" />
        <path d="M8 8h.01" />
      </svg>
    );
  }

  if (name === "inventory") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </svg>
    );
  }

  if (name === "channel") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </svg>
    );
  }

  if (name === "sales") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10v10h16V10" />
        <path d="M3 4h18l-1 6H4L3 4Z" />
        <path d="M8 4v6" />
        <path d="M12 4v6" />
        <path d="M16 4v6" />
        <path d="M8 20v-5h4v5" />
      </svg>
    );
  }
  return null;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [appConfig, setAppConfig] = useState(null);
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const res = await fetchAppConfig();

        if (typeof res.data?.readOnly !== "boolean") {
          throw new Error("設定の形式が正しくありません");
        }

        if (!cancelled) {
          setAppConfig(res.data);
          setConfigError("");
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setConfigError(
            "設定を取得できませんでした。ページを再読み込みしてください。"
          );
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  },[]);

  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const linkClass = ({ isActive }) =>
    `app-nav-link${isActive ? " is-active" : ""}`;

  const mobileLinkClass = ({ isActive }) =>
    `app-mobile-nav-link${isActive ? " is-active" : ""}`;

  const openMenu = () => {
    setMenuOpen(true);
  };

  const closeMenu = ({ returnFocus = true } = {}) => {
    setMenuOpen(false);

    if (returnFocus) {
      window.requestAnimationFrame(() => {
        menuButtonRef.current?.focus();
      });
    }
  };

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen]);

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
              onClick={() =>
                setMenuOpen(false)
              }
            >
              <AppLogo />
            </NavLink>

            <nav
              className="app-nav"
              aria-label="メインナビゲーション"
            >
              <ul className="app-nav-list">
                {navigationItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={linkClass}
                    >
                      <span className="app-nav-icon">
                        <NavigationIcon
                          name={item.icon}
                        />
                      </span>

                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              ref={menuButtonRef}
              type="button"
              className="app-menu-toggle"
              aria-label="メニューを開く"
              aria-expanded={menuOpen}
              aria-controls="app-mobile-menu"
              onClick={openMenu}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        {menuOpen && (
          <div
            className="app-mobile-overlay"
            onClick={() => closeMenu()}
          >
            <aside
              id="app-mobile-menu"
              className="app-mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="メインメニュー"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <div className="app-mobile-menu-header">
                <NavLink
                  to="/dashboard"
                  className="app-brand"
                  aria-label="Handmade-2 ダッシュボードへ"
                  onClick={() =>
                    closeMenu({
                      returnFocus: false,
                    })
                  }
                >
                  <AppLogo />
                </NavLink>

                <button
                  ref={closeButtonRef}
                  type="button"
                  className="app-menu-close"
                  aria-label="メニューを閉じる"
                  onClick={() => closeMenu()}
                >
                  <span />
                  <span />
                </button>
              </div>

              <nav aria-label="スマートフォン用メインナビゲーション">
                <ul className="app-mobile-nav-list">
                  {navigationItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        className={mobileLinkClass}
                        onClick={() =>
                          closeMenu({
                            returnFocus: false,
                          })
                        }
                      >
                        <span className="app-mobile-nav-icon">
                          <NavigationIcon
                            name={item.icon}
                          />
                        </span>

                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        )}

        <main
          id="main-content"
          className="app-main"
          tabIndex="-1"
        >
          <div className="app-container app-main-container">
            {appConfig?.readOnly && (
              <div className="alert alert-info" role="status">
                <strong>閲覧専用デモ</strong>
                サンプルデータを使用しています。
                登録・編集・削除などの更新操作はできません。
              </div>
            )}

            {configError && (
              <div className="alert alert-danger" role="alert">
                {configError}
              </div>
            )}

            {!appConfig && !configError && (
              <p role="status">設定を読み込んでいます...</p>
            )}
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/profit"
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              <Route
                path="/items"
                element={
                <ItemsPage
                  readOnly={appConfig?.readOnly !== false}
                />}
              />

              <Route
                path="/inventory"
                element={
                <InventoryPage
                  readOnly={appConfig?.readOnly !== false}
                  />}
              />

              <Route
                path="/sales"
                element={
                <SalesPage
                  readOnly={appConfig?.readOnly !== false}
                />}
              />

              <Route
                path="/channels"
                element={
                <ChannelsPage
                  readOnly={appConfig?.readOnly !== false}
                />}
              />

            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}