// src/components/InventoryVariantList.jsx
import styles from "./InventoryVariantList.module.css";

export default function InventoryVariantList({
  variants,
  updatingId,
  onDelta,
  onAdjust,
  onHistory,
  onPreviewImage,
}) {
  const isArray = Array.isArray(variants);

  const getStockState = (variant) => {
    const stock = Number(variant.stock ?? 0);
    const threshold = Number(variant.stockAlertThreshold ?? 0);

    if (stock === 0) {
      return {
        label: "在庫なし",
        className: styles.stockOut,
        rowClass: styles.outRow,
      };
    }

    if (threshold > 0 && stock <= threshold) {
      return {
        label: "在庫少",
        className: styles.stockLow,
        rowClass: styles.lowRow,
      };
    }

    return {
      label: "在庫あり",
      className: styles.stockAvailable,
      rowClass: "",
    };
  };

  const getStatusState = (variant) => {
    if (variant.status === "ACTIVE") {
      return {
        label: "販売中",
        className: styles.statusActive,
      };
    }

    return {
      label: "停止中",
      className: styles.statusInactive,
    };
  };

  const getVariantName = (variant) =>
    variant.variantName ?? "名称未設定";

  const renderImage = (variant, mobile = false) => {
    const imageClass = mobile
      ? styles.mobileImage
      : styles.desktopImage;

    const placeholderClass = mobile
      ? styles.mobilePlaceholder
      : styles.desktopPlaceholder;

    if (!variant.imageUrl) {
      return (
        <div
          className={placeholderClass}
          role="img"
          aria-label="画像は登録されていません"
        />
      );
    }

    return (
      <button
        type="button"
        className={styles.imageButton}
        onClick={() => onPreviewImage?.(variant)}
        aria-label={`${getVariantName(variant)}の画像を拡大`}
      >
        <img
          src={variant.imageUrl}
          alt=""
          className={imageClass}
        />
      </button>
    );
  };

  const renderStockBadges = (variant, mobile = false) => {
    const stockState = getStockState(variant);
    const statusState = getStatusState(variant);

    return (
      <div
        className={
          mobile
            ? styles.mobileBadges
            : styles.desktopBadges
        }
      >
        <span
          className={`${styles.badge} ${stockState.className}`}
        >
          {stockState.label}
        </span>

        <span
          className={`${styles.badge} ${statusState.className}`}
        >
          {statusState.label}
        </span>
      </div>
    );
  };

  const renderStockButtons = (variant, mobile = false) => {
    const busy = updatingId === variant.id;
    const stock = Number(variant.stock ?? 0);
    const name = getVariantName(variant);

    return (
      <div
        className={
          mobile
            ? styles.mobileStockActions
            : styles.desktopStockActions
        }
      >
        <button
          type="button"
          className={`btn btn-outline-danger ${styles.stockButton}`}
          onClick={() => onDelta?.(variant.id, -1)}
          disabled={busy || stock <= 0}
          aria-label={`${name}の在庫を1減らす`}
        >
          −1
        </button>

        <button
          type="button"
          className={`btn btn-outline-primary ${styles.stockButton}`}
          onClick={() => onDelta?.(variant.id, 1)}
          disabled={busy}
          aria-label={`${name}の在庫を1増やす`}
        >
          ＋1
        </button>
      </div>
    );
  };

  const renderOtherActions = (variant, mobile = false) => {
    const busy = updatingId === variant.id;
    const name = getVariantName(variant);

    return (
      <div
        className={
          mobile
            ? styles.mobileOtherActions
            : styles.desktopOtherActions
        }
      >
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => onAdjust?.(variant)}
          disabled={busy}
          aria-label={`${name}の棚卸を行う`}
        >
          棚卸
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => onHistory?.(variant)}
          disabled={busy}
          aria-label={`${name}の在庫履歴を表示`}
        >
          履歴
        </button>
      </div>
    );
  };

  if (!isArray) {
    return (
      <div className={styles.emptyState} role="alert">
        データ形式が不正です
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className={styles.emptyState}>
        条件に該当するバリエーションがありません
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
              <col className={styles.otherActionColumn} />
            </colgroup>

            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">画像</span>
                </th>
                <th scope="col">作品・バリエーション</th>
                <th scope="col">状態</th>
                <th scope="col" className={styles.numberHeading}>
                  在庫
                </th>
                <th scope="col">在庫を増減</th>
                <th scope="col">その他</th>
              </tr>
            </thead>

            <tbody>
              {variants.map((variant) => {
                const stockState = getStockState(variant);
                const busy = updatingId === variant.id;

                return (
                  <tr
                    key={variant.id}
                    className={stockState.rowClass}
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

                    <td>{renderStockBadges(variant)}</td>

                    <td className={styles.stockCell}>
                      <strong>{variant.stock ?? 0}</strong>

                      <span>
                        しきい値：
                        {variant.stockAlertThreshold ?? 0}
                      </span>
                    </td>

                    <td>
                      {renderStockButtons(variant)}

                      {busy && (
                        <span
                          className={styles.updating}
                          role="status"
                        >
                          <span
                            className="spinner-border spinner-border-sm"
                            aria-hidden="true"
                          />
                          <span className="visually-hidden">
                            在庫を更新中
                          </span>
                        </span>
                      )}
                    </td>

                    <td>{renderOtherActions(variant)}</td>
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
          const stockState = getStockState(variant);
          const busy = updatingId === variant.id;

          return (
            <article
              key={variant.id}
              className={`${styles.mobileCard} ${stockState.rowClass}`}
            >
              <div className={styles.mobileTop}>
                <div className={styles.mobileImageWrap}>
                  {renderImage(variant, true)}
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

                  <p
                    className={styles.mobileSku}
                    title={variant.skuCode || "SKU未設定"}
                  >
                    {variant.skuCode || "SKU未設定"}
                  </p>

                  <div className={styles.mobileStock}>
                    <span>現在庫</span>
                    <strong>{variant.stock ?? 0}</strong>
                  </div>

                  <div className={styles.mobileThreshold}>
                    <span>しきい値</span>
                    <strong>
                      {variant.stockAlertThreshold ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              {renderStockBadges(variant, true)}

              {renderStockButtons(variant, true)}
              {renderOtherActions(variant, true)}

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