// src/components/VariantTable.jsx
import styles from "./VariantTable.module.css";

export default function VariantTable({
  variants,
  onDelta,
  updatingId,
  onEdit,
  onAdjust,
  onHistory,
  onPreviewImage,
  mode = "inventory",
  showItemName = true,
}) {
  const isArray = Array.isArray(variants);
  const isInventoryMode = mode === "inventory";
  const isManagementMode = mode === "management";

  const getStockInfo = (variant) => {
    const stock = Number(variant.stock ?? 0);
    const threshold = Number(
      variant.stockAlertThreshold ?? 0,
    );

    if (stock === 0) {
      return {
        label: "在庫なし",
        badgeClass: "text-bg-secondary",
        rowClass: "table-secondary",
        overlayClass: styles.stockOut,
      };
    }

    if (threshold > 0 && stock <= threshold) {
      return {
        label: `在庫少 ${stock}`,
        badgeClass: "text-bg-warning",
        rowClass: "table-warning",
        overlayClass: styles.stockLow,
      };
    }

    return {
      label: `在庫 ${stock}`,
      badgeClass: "text-bg-success",
      rowClass: "",
      overlayClass: styles.stockAvailable,
    };
  };

  const getStatusInfo = (variant) => {
    if (variant.status === "ACTIVE") {
      return {
        icon: "✓",
        label: "販売中",
        className: styles.statusActive,
      };
    }

    return {
      icon: "—",
      label: "停止中",
      className: styles.statusInactive,
    };
  };

  const formatPrice = (price, withYen = false) => {
    if (price == null) return "-";

    const formatted = Number(price).toLocaleString();

    return withYen ? `¥${formatted}` : formatted;
  };

  const renderDesktopImage = (variant) => {
    if (!variant.imageUrl) {
      return (
        <div
          className="u-thumb-placeholder-36"
          aria-hidden="true"
        />
      );
    }

    return (
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => onPreviewImage?.(variant)}
        aria-label={`${
          variant.variantName ?? "バリエーション"
        }の画像を拡大`}
      >
        <img
          src={variant.imageUrl}
          alt=""
          className="u-thumb-36"
        />
      </button>
    );
  };

  const renderManagementImage = (variant) => {
  if (!variant.imageUrl) {
    return (
      <div
        className={styles.managementPlaceholder}
        role="img"
        aria-label="画像は登録されていません"
      />
    );
  }

  return (
    <button
      type="button"
      className={styles.managementImageButton}
      onClick={() => onPreviewImage?.(variant)}
      aria-label={`${
        variant.variantName ?? "バリエーション"
      }の画像を拡大`}
    >
      <img
        src={variant.imageUrl}
        alt=""
        className={styles.managementImage}
      />
    </button>
  );
};

  const renderStatus = (variant) => {
    const stockInfo = getStockInfo(variant);

    return (
      <div className="d-flex flex-column gap-1">
        <span className={`badge ${stockInfo.badgeClass}`}>
          {stockInfo.label}
        </span>

        <span className="badge text-bg-light border">
          {variant.status ?? "-"}
        </span>
      </div>
    );
  };

  const renderActions = (variant) => {
    const busy = updatingId === variant.id;
    const stock = Number(variant.stock ?? 0);
    const name =
      variant.variantName ?? "名称未設定";

    return (
      <div className={styles.actionList}>
        {isInventoryMode && (
          <>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onDelta?.(variant.id, -1)}
              disabled={busy || stock <= 0}
              aria-label={`${name}の在庫を1減らす`}
            >
              −1
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => onDelta?.(variant.id, 1)}
              disabled={busy}
              aria-label={`${name}の在庫を1増やす`}
            >
              ＋1
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              onClick={() => onAdjust?.(variant)}
              disabled={busy}
            >
              棚卸
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => onHistory?.(variant)}
              disabled={busy}
            >
              履歴
            </button>
          </>
        )}

        {isManagementMode && (
  <button
    type="button"
    className={`btn btn-sm btn-outline-primary ${styles.editButton}`}
    onClick={() => onEdit?.(variant)}
    disabled={busy}
    aria-label={`${name}を編集`}
  >
    <svg
      className={styles.editIcon}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
    <span>バリエーション</span>
    <span>編集</span>
  </button>
)}

        {busy && (
          <span
            className="d-inline-flex align-items-center gap-2"
            role="status"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
            <span className="visually-hidden">更新中</span>
          </span>
        )}
      </div>
    );
  };

  if (!isArray) {
    return (
      <div className="text-center text-muted py-4">
        データ形式が不正です
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="text-center text-muted py-4">
        該当データがありません
      </div>
    );
  }

  return (
    <>
      {/* PC・タブレット用 */}

      {/* PC作品管理用 */}
      {isManagementMode && (
        <div className={styles.managementDesktop}>
          <div className={styles.managementTableWrap}>
            <table className={styles.managementTable}>
              <caption className="visually-hidden">
                バリエーション一覧
              </caption>

              <thead>
                <tr>
                  <th
                    scope="col"
                    className={styles.managementImageColumn}
                  >
                    <span className="visually-hidden">画像</span>
                  </th>

                  <th scope="col">
                    バリエーション名／SKU
                  </th>

                  <th
                    scope="col"
                    className={styles.managementStatusColumn}
                  >
                    状態
                  </th>

                  <th
                    scope="col"
                    className={styles.managementStockColumn}
                  >
                    <span>在庫</span>
                    <span>しきい値</span>
                  </th>

                  <th
                    scope="col"
                    className={styles.managementPriceColumn}
                  >
                    販売価格
                  </th>

                  <th
                    scope="col"
                    className={styles.managementEditColumn}
                  >
                    編集
                  </th>
                </tr>
              </thead>

              <tbody>
                {variants.map((variant) => {
                  const busy = updatingId === variant.id;
                  const stockInfo = getStockInfo(variant);
                  const statusInfo = getStatusInfo(variant);

                  const rowClass =
                    Number(variant.stock ?? 0) === 0
                      ? styles.managementOutRow
                      : Number(variant.stock ?? 0) <=
                            Number(
                              variant.stockAlertThreshold ?? 0,
                            ) &&
                          Number(
                            variant.stockAlertThreshold ?? 0,
                          ) > 0
                        ? styles.managementLowRow
                        : "";

                  return (
                    <tr
                      key={variant.id}
                      className={rowClass}
                    >
                      <td>
                        {renderManagementImage(variant)}
                      </td>

                      <td>
                        <div className={styles.managementNameArea}>
                          {showItemName && (
                            <span
                              className={styles.managementItemName}
                              title={variant.itemName ?? ""}
                            >
                              {variant.itemName ?? "-"}
                            </span>
                          )}

                          <span
                            className={styles.managementVariantName}
                            title={
                              variant.variantName ?? "名称未設定"
                            }
                          >
                            {variant.variantName ?? "名称未設定"}
                          </span>

                          <span
                            className={styles.managementSku}
                            title={
                              variant.skuCode || "SKU未設定"
                            }
                          >
                            {variant.skuCode || "SKU未設定"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.managementBadges}>
                          <span
                            className={`${styles.managementBadge} ${statusInfo.className}`}
                          >
                            <span aria-hidden="true">
                              {statusInfo.icon}
                            </span>
                            {statusInfo.label}
                          </span>

                          <span
                            className={`${styles.managementBadge} ${stockInfo.overlayClass}`}
                          >
                            {stockInfo.label}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.managementStock}>
                          <strong>
                            {variant.stock ?? 0}
                          </strong>
                          <span>
                            {variant.stockAlertThreshold ?? 0}
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong className={styles.managementPrice}>
                          {formatPrice(variant.price, true)}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={styles.managementEditButton}
                          onClick={() => onEdit?.(variant)}
                          disabled={busy}
                          aria-label={`${
                            variant.variantName ?? "名称未設定"
                          }を編集`}
                          title="バリエーションを編集"
                        >
                          {busy ? (
                            <span
                              className="spinner-border spinner-border-sm"
                              aria-hidden="true"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                            </svg>
                          )}

                          {busy && (
                            <span className="visually-hidden">
                              更新中
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isInventoryMode && (

        <div className={styles.desktopTable}>
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                {showItemName && (
                  <th className={styles.thName}>作品名</th>
                )}
                <th>バリエーション名</th>
                <th>SKU</th>
                <th className={`text-end ${styles.thStock}`}>
                  在庫
                </th>
                <th
                  className={`text-end ${styles.thThreshold}`}
                >
                  しきい値
                </th>
                <th className={`text-end ${styles.thPrice}`}>
                  価格
                </th>
                <th className={styles.thStatus}>状態</th>
                <th className={styles.thActions}>操作</th>
              </tr>
            </thead>

            <tbody>
              {variants.map((variant) => {
                const stockInfo = getStockInfo(variant);

                return (
                  <tr
                    key={variant.id}
                    className={stockInfo.rowClass}
                  >
                    {showItemName && (
                      <td>
                        <span
                          className="u-truncate u-maxw-140"
                          title={variant.itemName ?? ""}
                        >
                          {variant.itemName ?? "-"}
                        </span>
                      </td>
                    )}

                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {renderDesktopImage(variant)}

                        <span
                          className="u-truncate u-maxw-140"
                          title={
                            variant.variantName ??
                            "名称未設定"
                          }
                        >
                          {variant.variantName ??
                            "名称未設定"}
                        </span>
                      </div>
                    </td>

                    <td className="text-nowrap">
                      {variant.skuCode || "-"}
                    </td>

                    <td className="text-end">
                      <span className="fw-semibold">
                        {variant.stock ?? 0}
                      </span>
                    </td>

                    <td className="text-end">
                      {variant.stockAlertThreshold ?? 0}
                    </td>

                    <td className="text-end">
                      {formatPrice(variant.price)}
                    </td>

                    <td>{renderStatus(variant)}</td>
                    <td>{renderActions(variant)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* モバイル用 */}
<div
  className={styles.mobileList}
  aria-label="バリエーション一覧"
>
  {variants.map((variant) => {
    const stockInfo = getStockInfo(variant);
    const statusInfo = getStatusInfo(variant);

    return (
      <article
        key={variant.id}
        className={styles.mobileRow}
      >
        <div className={styles.mobileImageWrap}>
          {variant.imageUrl ? (
            <button
              type="button"
              className={styles.mobileImageButton}
              onClick={() => onPreviewImage?.(variant)}
              aria-label={`${
                variant.variantName ??
                "バリエーション"
              }の画像を拡大`}
            >
              <img
                src={variant.imageUrl}
                alt=""
                className={styles.mobileImage}
              />
            </button>
          ) : (
            <div
              className={styles.mobilePlaceholder}
              aria-label="画像は登録されていません"
              role="img"
            />
          )}
        </div>

        <div className={styles.mobileSummary}>
          {showItemName && (
            <p
              className={styles.mobileItemName}
              title={variant.itemName ?? ""}
            >
              {variant.itemName ?? "-"}
            </p>
          )}

          <h3
            className={styles.mobileTitle}
            title={
              variant.variantName ?? "名称未設定"
            }
          >
            {variant.variantName ?? "名称未設定"}
          </h3>

          <p
            className={styles.mobileSku}
            title={variant.skuCode || "SKU未設定"}
          >
            {variant.skuCode || "SKU未設定"}
          </p>

          <div className={styles.mobileMeta}>
            <p className={styles.mobilePrice}>
              <span>価格</span>
              <strong>
                {formatPrice(variant.price, true)}
              </strong>
            </p>

            <p className={styles.mobileThreshold}>
              <span>在庫しきい値</span>
              <strong>
                {variant.stockAlertThreshold ?? 0}
              </strong>
            </p>
          </div>
        </div>

        <div
          className={styles.mobileBadges}
          aria-label={`${
            statusInfo.label
          }、${stockInfo.label}`}
        >
          <span
            className={`${styles.mobileBadge} ${statusInfo.className}`}
          >
            <span aria-hidden="true">
              {statusInfo.icon}
            </span>
            {statusInfo.label}
          </span>

          <span
            className={`${styles.mobileBadge} ${stockInfo.overlayClass}`}
          >
            {stockInfo.label}
          </span>
        </div>

        <div className={styles.mobileActions}>
          {renderActions(variant)}
        </div>
      </article>
    );
  })}
</div>
    </>
  );
}