import styles from "./ManagementVariantList.module.css";

export default function ManagementVariantList({
  variants,
  updatingId,
  onEdit,
  onPreviewImage,
}) {
  const isArray = Array.isArray(variants);

  const getStockInfo = (variant) => {
    const stock = Number(variant.stock ?? 0);
    const threshold = Number(
      variant.stockAlertThreshold ?? 0,
    );

    if (stock === 0) {
      return {
        shortLabel: "なし",
        fullLabel: "在庫なし",
        badgeClass: styles.stockOut,
        rowClass: styles.rowOut,
      };
    }

    if (threshold > 0 && stock <= threshold) {
      return {
        shortLabel: "少",
        fullLabel: "在庫少",
        badgeClass: styles.stockLow,
        rowClass: styles.rowLow,
      };
    }

    return {
      shortLabel: "あり",
      fullLabel: "在庫あり",
      badgeClass: styles.stockAvailable,
      rowClass: "",
    };
  };

  const getStatusInfo = (variant) => {
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

  const formatPrice = (price) => {
    if (price == null) return "-";
    return `¥${Number(price).toLocaleString()}`;
  };

  const renderImage = (variant) => {
    if (!variant.imageUrl) {
      return (
        <div
          className={styles.imagePlaceholder}
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
        aria-label={`${
          variant.variantName ?? "バリエーション"
        }の画像を拡大`}
      >
        <img
          src={variant.imageUrl}
          alt=""
          className={styles.image}
        />
      </button>
    );
  };

  const renderThreshold = (variant) => (
    <span
      className={styles.thresholdBadge}
      title={`在庫しきい値：${
        variant.stockAlertThreshold ?? 0
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M10.27 21a2 2 0 0 0 3.46 0" />
        <path d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33Z" />
      </svg>

      <span className="visually-hidden">
        在庫しきい値：
      </span>

      <span>{variant.stockAlertThreshold ?? 0}</span>
    </span>
  );

  const renderEditButton = (variant, mobile = false) => {
    const busy = updatingId === variant.id;
    const name =
      variant.variantName ?? "名称未設定";

    return (
      <button
        type="button"
        className={
          mobile
            ? styles.mobileEditButton
            : styles.desktopEditButton
        }
        onClick={() => onEdit?.(variant)}
        disabled={busy}
        aria-label={`${name}を編集`}
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
            width={mobile ? "18" : "24"}
            height={mobile ? "18" : "24"}
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

        {mobile && (
          <span>バリエーション編集</span>
        )}

        {busy && (
          <span className="visually-hidden">更新中</span>
        )}
      </button>
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
        この作品にはバリエーションがありません
      </div>
    );
  }

  return (
    <>
      {/* PC版 */}
      <div className={styles.desktopList}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              バリエーション一覧
            </caption>

            <colgroup>
              <col className={styles.imageColumn} />
              <col className={styles.nameColumn} />
              <col className={styles.stockInfoColumn} />
              <col className={styles.stockNumberColumn} />
              <col className={styles.statusColumn} />
              <col className={styles.priceColumn} />
              <col className={styles.editColumn} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" colSpan="2">
                  バリエーション名／SKU
                </th>
                <th scope="col">
                  <span className={styles.headerStack}>
                    <span>在庫状況</span>
                    <span>しきい値</span>
                  </span>
                </th>
                <th scope="col">在庫</th>
                <th scope="col">販売状態</th>
                <th scope="col">販売価格</th>
                <th scope="col">編集</th>
              </tr>
            </thead>

            <tbody>
              {variants.map((variant) => {
                const stockInfo = getStockInfo(variant);
                const statusInfo = getStatusInfo(variant);

                return (
                  <tr
                    key={variant.id}
                    className={stockInfo.rowClass}
                  >
                    <td className={styles.imageCell}>
                      {renderImage(variant)}
                    </td>

                    <td className={styles.nameCell}>
                      <strong
                        className={styles.variantName}
                        title={
                          variant.variantName ??
                          "名称未設定"
                        }
                      >
                        {variant.variantName ??
                          "名称未設定"}
                      </strong>

                      <span
                        className={styles.sku}
                        title={
                          variant.skuCode || "SKU未設定"
                        }
                      >
                        {variant.skuCode || "SKU未設定"}
                      </span>
                    </td>

                    <td className={styles.stockInfoCell}>
                      <span
                        className={`${styles.stockBadge} ${stockInfo.badgeClass}`}
                      >
                        <span className="">
                          在庫
                        </span>
                        {stockInfo.shortLabel}
                      </span>

                      {renderThreshold(variant)}
                    </td>

                    <td className={styles.stockNumber}>
                      {variant.stock ?? 0}
                    </td>

                    <td>
                      <span
                        className={`${styles.statusBadge} ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className={styles.price}>
                      {formatPrice(variant.price)}
                    </td>

                    <td className={styles.editCell}>
                      {renderEditButton(variant)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* スマホ版 */}
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
              className={`${styles.mobileRow} ${stockInfo.rowClass}`}
            >
              <div className={styles.mobileImage}>
                {renderImage(variant)}
              </div>

              <div className={styles.mobileSummary}>
                <h3
                  className={styles.mobileName}
                  title={
                    variant.variantName ?? "名称未設定"
                  }
                >
                  {variant.variantName ?? "名称未設定"}
                </h3>

                <p
                  className={styles.mobileSku}
                  title={
                    variant.skuCode || "SKU未設定"
                  }
                >
                  {variant.skuCode || "SKU未設定"}
                </p>

                <div className={styles.mobileStock}>
                  <span className={styles.mobileMetaLabel}>
                    在庫
                  </span>

                  <span
                    className={`${styles.stockBadge} ${stockInfo.badgeClass}`}
                  >
                    <span className="visually-hidden">
                      在庫
                    </span>
                    {stockInfo.shortLabel}
                  </span>

                  {renderThreshold(variant)}

                  <strong className={styles.mobileStockNumber}>
                    {variant.stock ?? 0}
                  </strong>
                </div>

                <div className={styles.mobilePrice}>
                  <span className={styles.mobileMetaLabel}>
                    価格
                  </span>

                  <strong>
                    {formatPrice(variant.price)}
                  </strong>
                </div>
              </div>

              <div className={styles.mobileStatus}>
                <span
                  className={`${styles.statusBadge} ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div className={styles.mobileAction}>
                {renderEditButton(variant, true)}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}