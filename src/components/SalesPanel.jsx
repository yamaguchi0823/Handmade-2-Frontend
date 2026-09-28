import {
  Fragment,
  useEffect,
  useState,
} from "react";

import {
  fetchSaleDetail,
  fetchSales,
} from "../api";

import styles from "./SalesPanel.module.css";

function number(value) {
  return Number(value ?? 0).toLocaleString("ja-JP");
}

function money(value) {
  return `${number(value)} 円`;
}

function formatDate(value) {
  if (!value) return "-";

  return String(value)
    .slice(0, 10)
    .replaceAll("-", "/");
}

function formatDateTime(value) {
  if (!value) return "-";

  const text = String(value).replace("T", " ");
  return text.length >= 16
    ? text.slice(0, 16)
    : text;
}

function hasMemo(note) {
  return Boolean(String(note ?? "").trim());
}

function MemoIcon() {
  return (
    <svg
      className={styles.memoIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 4.75h14v11.5H9.5L5 20V4.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 12.5h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SalesPanel({
  refreshKey = 0,
}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [expandedId, setExpandedId] =
    useState(null);

  const [detailsById, setDetailsById] =
    useState({});

  const [detailLoadingId, setDetailLoadingId] =
    useState(null);

  const [detailErrors, setDetailErrors] =
    useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetchSales(50);

      setSales(
        Array.isArray(res.data)
          ? res.data
          : [],
      );
    } catch (e) {
      console.error(e);
      setError("販売一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // refreshKeyが変わったときにも再取得
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const toggleDetail = async (saleId) => {
    if (expandedId === saleId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(saleId);

    if (detailsById[saleId]) {
      return;
    }

    try {
      setDetailLoadingId(saleId);

      setDetailErrors((prev) => ({
        ...prev,
        [saleId]: "",
      }));

      const res = await fetchSaleDetail(saleId);

      setDetailsById((prev) => ({
        ...prev,
        [saleId]: res.data,
      }));
    } catch (e) {
      console.error(e);

      setDetailErrors((prev) => ({
        ...prev,
        [saleId]:
          "販売詳細の取得に失敗しました",
      }));
    } finally {
      setDetailLoadingId(null);
    }
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby="sales-list-title"
    >
      <div className={styles.heading}>
        <h2 id="sales-list-title">
          販売一覧
        </h2>

        {/* <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={load}
          disabled={loading}
        >
          {loading ? "更新中" : "更新"}
        </button> */}
      </div>

      {error && (
        <div
          className="app-feedback app-feedback--error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className={`card ${styles.tablePanel}`}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.infoColumn}>
                  作品・バリエーション・販売日
                </th>

                <th className={styles.channelColumn}>
                  <span className={styles.desktopHeading}>
                    チャネル
                  </span>

                  <span className={styles.mobileHeading}>
                    チャネル
                    <br />
                    販売点数
                  </span>
                </th>

                <th className={styles.quantityColumn}>
                  点数
                </th>

                <th className={styles.memoColumn}>
                  メモ
                </th>

                <th className={styles.detailColumn}>
                  詳細
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && sales.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div
                      className="app-loading-state app-loading-state--compact"
                      role="status"
                      aria-live="polite"
                    >
                      <span
                        className="spinner-border spinner-border-sm"
                        aria-hidden="true"
                      />
                      <span>
                        販売一覧を読み込んでいます
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {sales.map((sale) => {
                const isExpanded =
                  expandedId === sale.id;

                const detail =
                  detailsById[sale.id];

                const detailError =
                  detailErrors[sale.id];

                const detailLoading =
                  detailLoadingId === sale.id;

                const lines = Array.isArray(
                  detail?.lines,
                )
                  ? detail.lines
                  : [];

                const primaryLine = lines[0] ?? null;

                return (
                  <Fragment key={sale.id}>
                    <tr
                      className={`
                        ${styles.mainRow}
                        ${isExpanded ? styles.expandedRow : ""}
                        `}
                    >
                      <td className={styles.infoCell}>
                        <div
                          className={styles.saleIdentity}
                        >
                          <p className={styles.itemName}>
                            {sale.itemNames ||
                              sale.itemName ||
                              "作品名未設定"}
                          </p>

                          <p
                            className={styles.variantName}
                          >
                            {sale.variantNames ||
                              sale.variantName ||
                              "バリエーション名未設定"}
                          </p>

                          <div
                            className={
                              styles.saleSubInfo
                            }
                          >
                            <time
                              dateTime={
                                sale.soldAt ?? undefined
                              }
                            >
                              {formatDate(
                                sale.soldAt,
                              )}
                            </time>

                            {hasMemo(sale.note) && (
                              <span
                                className={
                                  styles.mobileMemo
                                }
                                title="メモあり"
                              >
                                <MemoIcon />
                                <span className="visually-hidden">
                                  メモあり
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td
                        className={styles.channelCell}
                        title={
                          sale.channelName ?? "未設定"
                        }
                      >
                        <span
                          className={
                            styles.channelName
                          }
                        >
                          {sale.channelName ??
                            "未設定"}
                        </span>

                        <strong
                          className={
                            styles.mobileQuantity
                          }
                        >
                          {number(sale.totalQty)}
                          <small>点</small>
                        </strong>
                      </td>

                      <td
                        className={styles.quantityCell}
                      >
                        <strong>
                          {number(sale.totalQty)}
                        </strong>
                        <span>点</span>
                      </td>

                      <td className={styles.memoCell}>
                        {hasMemo(sale.note) && (
                          <span title="メモあり">
                            <MemoIcon />
                            <span className="visually-hidden">
                              メモあり
                            </span>
                          </span>
                        )}
                      </td>

                      <td className={styles.detailCell}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          // className={styles.detailButton}
                          aria-expanded={isExpanded}
                          aria-controls={`sale-detail-${sale.id}`}
                          aria-label={
                            isExpanded
                              ? `販売ID ${sale.id}の詳細を閉じる`
                              : `販売ID ${sale.id}の詳細を開く`
                          }
                          onClick={() =>
                            toggleDetail(sale.id)
                          }
                        >
                          <span aria-hidden="true">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr
                        id={`sale-detail-${sale.id}`}
                        className={styles.detailRow}
                      >
                        <td colSpan={5}>
                          {detailLoading && (
                            <div
                              className="app-loading-state app-loading-state--compact"
                              role="status"
                            >
                              <span
                                className="spinner-border spinner-border-sm"
                                aria-hidden="true"
                              />
                              <span>
                                販売詳細を読み込んでいます
                              </span>
                            </div>
                          )}

                          {detailError && (
                            <div
                              className="app-feedback app-feedback--error"
                              role="alert"
                            >
                              {detailError}
                            </div>
                          )}

                          {detail && (
                            <div className={styles.detailPanel}>
                              {primaryLine ? (
                                <div className={styles.detailGrid}>
                                  {/* ① メモ・登録日時 */}
                                  <div className={styles.detailMetaGroup}>
                                    <div className={styles.memoArea}>
                                      <span>メモ</span>

                                      <p>
                                        {String(detail.note ?? "").trim() ||
                                          "-"}
                                      </p>
                                    </div>

                                    <div className={styles.registeredAt}>
                                      <span>登録日時</span>

                                      <time
                                        dateTime={
                                          detail.createdAt ?? undefined
                                        }
                                      >
                                        {formatDateTime(
                                          detail.createdAt,
                                        )}
                                      </time>
                                    </div>
                                  </div>

                                  {/* ② 各種ID・SKU */}
                                  <dl className={styles.idList}>
                                    <div>
                                      <dt>販売ID</dt>
                                      <dd>{sale.id}</dd>
                                    </div>

                                    <div>
                                      <dt>作品ID</dt>
                                      <dd>
                                        {primaryLine.itemId ?? "-"}
                                      </dd>
                                    </div>

                                    <div>
                                      <dt>バリエーションID</dt>
                                      <dd>
                                        {primaryLine.variantId ?? "-"}
                                      </dd>
                                    </div>

                                    <div>
                                      <dt>SKU</dt>
                                      <dd>
                                        {primaryLine.skuCode || "-"}
                                      </dd>
                                    </div>
                                  </dl>

                                  {/* ③ 数量・金額 */}
                                  <dl className={styles.amountList}>
                                    <div>
                                      <dt>数量</dt>
                                      <dd>
                                        {number(sale.totalQty)} 点
                                      </dd>
                                    </div>

                                    <div>
                                      <dt>単価（税抜）</dt>
                                      <dd>
                                        {lines.length === 1
                                          ? money(primaryLine.unitPrice)
                                          : "複数"}
                                      </dd>
                                    </div>

                                    <div>
                                      <dt>売上</dt>
                                      <dd>
                                        {money(sale.totalAmount)}
                                      </dd>
                                    </div>

                                    <div>
                                      <dt>コスト</dt>
                                      <dd>
                                        {money(sale.totalCost)}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                              ) : (
                                <div className="app-empty-state app-empty-state--embedded">
                                  <p className="app-empty-state__title">
                                    販売明細がありません
                                  </p>
                                </div>
                              )}
                            </div>
)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!loading &&
                !error &&
                sales.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="app-empty-state app-empty-state--embedded">
                        <p className="app-empty-state__title">
                          販売データがありません
                        </p>

                        <p className="app-empty-state__description">
                          販売登録を行うと、こちらに履歴が表示されます。
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}