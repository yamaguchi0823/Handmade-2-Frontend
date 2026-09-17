// src/components/InventoryVariantList.jsx
import { useState } from "react";
import styles from "./InventoryVariantList.module.css";

export default function InventoryVariantList({
  variants,
  updatingId,
  onDelta,
  onAdjust,
  onHistory,
  onPreviewImage,
}) {
  const [openActionsId, setOpenActionsId] = useState(null);

  const isArray = Array.isArray(variants);

  const getStockState = (variant) => {
    const stock = Number(variant.stock ?? 0);
    const threshold = Number(variant.stockAlertThreshold ?? 0);

    if (stock === 0) {
      return {
        label: "在庫なし",
        shortLabel: "なし",
        type: "out"
      };
    }

    if (threshold > 0 && stock <= threshold) {
      return {
        label: "在庫少",
        shortLabel: "少",
        type: "low"
      };
    }

    return {
      label: "在庫あり",
      shortLabel: "あり",
      type: "available"
    };
  };

  const getStatusState = (variant) => {
    if (variant.status === "ACTIVE") {
      return {
        label: "販売中",
        type: "active",
        rowClass: "",
      };
    }

    return {
      label: "停止中",
      type: "inactive",
      rowClass:
        variant.status === "INACTIVE"
          ? styles.inactiveRow
          : "",
    };
  };

  const getVariantName = (variant) =>
    variant.variantName ?? "名称未設定";

  const renderImage = (variant) => {
    if (!variant.imageUrl) {
      return (
        <div
          className="app-variant-image-placeholder"
          role="img"
          aria-label="画像は登録されていません"
        />
      );
    }

    return (
      <button
        type="button"
        className="app-variant-image-button"
        onClick={() => onPreviewImage?.(variant)}
        aria-label={`${getVariantName(variant)}の画像を拡大`}
      >
        <img
          src={variant.imageUrl}
          alt=""
          className="app-variant-image"
        />
      </button>
    );
  };

  const renderStockBadge = (variant, short = false) => {
    const stockState = getStockState(variant);

    return (
      <span
        className={`app-stock-status app-stock-status--${stockState.type}`}
      >
        {short ? stockState.shortLabel : stockState.label}
      </span>
    );
  };

  const renderStatus = (
    variant,
    presentation = "inline",
  ) => {
    const statusState = getStatusState(variant);

    return (
      <span
        className={`app-sales-status app-sales-status--${presentation} app-sales-status--${statusState.type}`}
      >
        {presentation === "inline" && (
          <span
            className="app-sales-status__dot"
            aria-hidden="true"
            />
        )}

        {statusState.label}
        </span>
    );
  };

  const renderThreshold = (variant) => (
    <span
      className="app-threshold-indicator"
      aria-label={`在庫しきい値 ${
        variant.stockAlertThreshold ?? 0
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>

      <span>{variant.stockAlertThreshold ?? 0}</span>
    </span>
  );

  const renderAdjustIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
    </svg>
  );

  const renderHistoryIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );

  if (!isArray) {
    return (
      <div className="app-empty-state app-empty-state--surface" role="alert">
        <p className="app-empty-state__title">
          データを表示できません
        </p>
        <p className="app-empty-state__description">
          データ形式が正しくありません。
        </p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="app-empty-state app-empty-state--surface">
        <p className="app-empty-state__title">
          条件に該当するバリエーションがありません
        </p>

        <p className="app-empty-state__description">
          検索条件を変更してお試しください。
        </p>
      </div>
    );
  }

  return (
    <>
      {/* PC・タブレット */}
      <div className={styles.desktopList}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              在庫バリエーション一覧
            </caption>

            <colgroup>
              <col className={styles.imageColumn} />
              <col className={styles.nameColumn} />
              <col className={styles.stateColumn} />
              <col className={styles.stockColumn} />
              <col className={styles.changeColumn} />
              <col className={styles.adjustColumn} />
              <col className={styles.historyColumn} />
            </colgroup>

            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  作品・バリエーション
                </th>
                <th scope="col">
                  <span>在庫状況</span>
                  <span>販売状況</span>
                </th>
                <th scope="col" className={styles.numberHeading}>
                  在庫
                </th>
                <th scope="col" className={styles.centerHeading}>
                  在庫を増減
                </th>
                <th scope="col" className={styles.centerHeading}>
                  棚卸
                </th>
                <th scope="col" className={styles.centerHeading}>
                  在庫履歴
                </th>
              </tr>
            </thead>

            <tbody>
              {variants.map((variant) => {
                const busy = updatingId === variant.id;
                const stock = Number(variant.stock ?? 0);
                const statusState = getStatusState(variant);

                return (
                  <tr
                    key={variant.id}
                    className={statusState.rowClass}
                  >
                    <td>{renderImage(variant)}</td>

                    <td>
                      <div className={styles.nameArea}>
                        <span
                          className={styles.itemName}
                          title={variant.itemName ?? ""}
                        >
                          {variant.itemName ?? "-"}
                        </span>

                        <strong
                          className={styles.variantName}
                          title={getVariantName(variant)}
                        >
                          {getVariantName(variant)}
                        </strong>

                        <span
                          className={styles.sku}
                          title={variant.skuCode || "SKU未設定"}
                        >
                          {variant.skuCode || "SKU未設定"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.desktopStates}>
                        {renderStockBadge(variant)}
                        {renderStatus(variant)}
                      </div>
                    </td>

                    <td className={styles.stockCell}>
                      <strong>{stock}</strong>
                      <span>
                        しきい値：
                        {variant.stockAlertThreshold ?? 0}
                      </span>
                    </td>

                    <td>
                      <div className={styles.desktopStockActions}>
                        <button
                          type="button"
                          className={`btn btn-outline-danger ${styles.stockButton}`}
                          onClick={() => onDelta?.(variant.id, -1)}
                          disabled={busy || stock <= 0}
                          aria-label={`${getVariantName(
                            variant,
                          )}の在庫を1減らす`}
                        >
                          −1
                        </button>

                        <button
                          type="button"
                          className={`btn btn-outline-primary ${styles.stockButton}`}
                          onClick={() => onDelta?.(variant.id, 1)}
                          disabled={busy}
                          aria-label={`${getVariantName(
                            variant,
                          )}の在庫を1増やす`}
                        >
                          ＋1
                        </button>
                      </div>
                    </td>

                    <td className={styles.iconCell}>
                      <button
                        type="button"
                        className="app-icon-button app-icon-button--secondary"
                        onClick={() => onAdjust?.(variant)}
                        disabled={busy}
                        aria-label={`${getVariantName(
                          variant,
                        )}の棚卸を行う`}
                        title="棚卸"
                      >
                        {renderAdjustIcon()}
                      </button>
                    </td>

                    <td className={styles.iconCell}>
                      <button
                        type="button"
                        className="app-icon-button app-icon-button--secondary"
                        onClick={() => onHistory?.(variant)}
                        disabled={busy}
                        aria-label={`${getVariantName(
                          variant,
                        )}の在庫履歴を表示`}
                        title="在庫履歴"
                      >
                        {renderHistoryIcon()}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* スマホ */}
      <div
        className={styles.mobileList}
        aria-label="在庫バリエーション一覧"
      >
        {variants.map((variant) => {
          const busy = updatingId === variant.id;
          const stock = Number(variant.stock ?? 0);
          const statusState = getStatusState(variant);
          const actionsOpen = openActionsId === variant.id;
          const actionsId = `inventory-actions-${variant.id}`;

          return (
            <article
              key={variant.id}
              className={`${styles.mobileCard} ${statusState.rowClass}`}
            >
              <div className={styles.mobileTop}>
                <div className={styles.mobileImageWrap}>
                  {renderImage(variant)}
                </div>

                <div className={styles.mobileSummary}>
                  <p
                    className={styles.mobileItemName}
                    title={variant.itemName ?? ""}
                  >
                    {variant.itemName ?? "-"}
                  </p>

                  <h2
                    className={styles.mobileVariantName}
                    title={getVariantName(variant)}
                  >
                    {getVariantName(variant)}
                  </h2>
                </div>
              </div>

              <div className={styles.mobileMiddle}>
                {renderStatus(variant,"badge")}

                <p
                  className={styles.mobileSku}
                  title={variant.skuCode || "SKU未設定"}
                >
                  {variant.skuCode || "SKU未設定"}
                </p>
              </div>

              <div className={styles.mobileBottom}>
                <div className={styles.mobileStockInfo}>
                  <span className={styles.stockLabel}>在庫</span>
                  {renderStockBadge(variant, true)}
                  {renderThreshold(variant)}
                </div>

                <strong
                  className={styles.mobileStockNumber}
                  aria-label={`現在庫 ${stock}`}
                >
                  {stock}
                </strong>

                <button
                  type="button"
                  className={styles.mobileMenuButton}
                  onClick={() =>
                    setOpenActionsId((currentId) =>
                      currentId === variant.id
                        ? null
                        : variant.id,
                    )
                  }
                  aria-expanded={actionsOpen}
                  aria-controls={actionsId}
                  aria-label={
                    actionsOpen
                      ? `${getVariantName(variant)}の在庫操作を閉じる`
                      : `${getVariantName(variant)}の在庫操作を開く`
                  }
                >
                  <span aria-hidden="true">
                    {actionsOpen ? "×" : "•••"}
                  </span>
                </button>
              </div>

              {actionsOpen && (
                <div
                  id={actionsId}
                  className={styles.mobileActionPanel}
                >
                  {/* 1. 在庫を増やす */}
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => onDelta?.(variant.id, 1)}
                    disabled={busy}
                    aria-label={`${getVariantName(variant)}の在庫を1増やす`}
                  >
                    ＋1
                  </button>

                  {/* 2. 在庫を減らす */}
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => onDelta?.(variant.id, -1)}
                    disabled={busy || stock <= 0}
                    aria-label={`${getVariantName(variant)}の在庫を1減らす`}
                  >
                    −1
                  </button>

                  {/* 3. 棚卸 */}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onAdjust?.(variant)}
                    disabled={busy}
                    aria-label={`${getVariantName(variant)}の棚卸を行う`}
                  >
                    {renderAdjustIcon()}
                    <span>棚卸</span>
                  </button>

                  {/* 4. 在庫履歴 */}
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => onHistory?.(variant)}
                    disabled={busy}
                    aria-label={`${getVariantName(variant)}の在庫履歴を表示`}
                  >
                    {renderHistoryIcon()}
                    <span>在庫履歴</span>
                  </button>
                </div>
              )}

              {busy && (
                <div className={styles.mobileUpdating} role="status">
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  />
                  <span>在庫を更新しています</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}