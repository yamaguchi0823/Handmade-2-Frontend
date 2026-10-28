import { useEffect, useRef, useState } from "react";
import api, { fetchItems } from "../api";

import PageHeader from "../components/PageHeader";
import ItemCreateModal from "../components/ItemCreateModal";
import ItemEditModal from "../components/ItemEditModal";
import InactiveItemsModal from "../components/InactiveItemsModal";
import ManagementVariantList from "../components/ManagementVariantList";
import VariantCreateModal from "../components/VariantCreateModal";
import VariantEditModal from "../components/VariantEditModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import styles from "./ItemsPage.module.css";

export default function ItemsPage({ readOnly = true }) {
  const [items, setItems] = useState([]);
  const [expandedItemIds, setExpandedItemIds] = useState([]);
  const [variants, setVariants] = useState([]);

  const [itemsLoading, setItemsLoading] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);

  const [itemError, setItemError] = useState("");
  const [variantError, setVariantError] = useState("");
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemFilter, setItemFilter] = useState("ALL");

  // 作品登録・編集・無効化済み一覧
  const [itemCreateOpen, setItemCreateOpen] = useState(false);
  const [itemEditOpen, setItemEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [inactiveItemsOpen, setInactiveItemsOpen] = useState(false);

  // バリエーション登録・編集
  const [variantCreateOpen, setVariantCreateOpen] = useState(false);
  const [creatingVariantItemId, setCreatingVariantItemId] = useState(null);
  const [variantEditOpen, setVariantEditOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);

  // 画像プレビュー
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const toastTimerRef = useRef(null);

  const mobileActionsRef = useRef(null);

  const closeMobileActions = () => {
    mobileActionsRef.current?.removeAttribute("open");
  };

  const showToast = (message) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const loadItems = async () => {
    try {
      setItemsLoading(true);
      setItemError("");

      const res = await fetchItems();
      const list = Array.isArray(res.data) ? res.data : [];

      setItems(list);

      // 存在している作品の開閉状態だけを維持する
      // 初回は空配列なので、すべて閉じた状態になる
      setExpandedItemIds((prev) =>
        prev.filter((id) =>
          list.some((item) => item.id === id),
        ),
      );
    } catch (e) {
      console.error(e);
      setItemError("作品一覧の取得に失敗しました");
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const loadVariants = async () => {
    try {
      setVariantsLoading(true);
      setVariantError("");

      const res = await api.get("/variants");
      setVariants(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setVariantError("バリエーションの取得に失敗しました");
      setVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  };

  const reloadAll = async () => {
    await Promise.all([loadItems(), loadVariants()]);
  };

  const toggleItem = (itemId) => {
    setExpandedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const setVariantImageUrl = (variantId, imageUrl) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? { ...variant, imageUrl: imageUrl || null }
          : variant,
      ),
    );

    setEditingVariant((prev) =>
      prev && prev.id === variantId
        ? { ...prev, imageUrl: imageUrl || null }
        : prev,
    );
  };

  useEffect(() => {
    loadItems();
    loadVariants();

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };

    // 初回表示時のみ取得
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const normalizedSearchQuery = searchQuery
  .trim()
  .toLocaleLowerCase("ja-JP");

const includesSearchQuery = (value) =>
  String(value ?? "")
    .toLowerCase()
    .includes(normalizedSearchQuery);

const itemMachesSearchQuery = (item) =>
  !normalizedSearchQuery ||
  includesSearchQuery(item.name) ||
  includesSearchQuery(item.description);

const variantMatchesSearchQuery = (variant) =>
  !normalizedSearchQuery ||
  includesSearchQuery(variant.variantName) ||
  includesSearchQuery(variant.skuCode);

const matchesVariantFilter = (variant) => {
  const stock = Number(variant.stock ?? 0);
  const threshold = Number(
    variant.stockAlertThreshold ?? 0,
  );

  switch (itemFilter) {
    case "HAS_ACTIVE_VARIANTS":
      return variant.status === "ACTIVE";

    case "HAS_LOW_STOCK":
      return (
        variant.status === "ACTIVE" &&
        threshold > 0 &&
        stock > 0 &&
        stock <= threshold
      );

    case "HAS_OUT_OF_STOCK":
      return (
        variant.status === "ACTIVE" &&
        stock === 0
      );

      default:
        return true;
  }
};

const filtersVariantRows = [
  "HAS_ACTIVE_VARIANTS",
  "HAS_LOW_STOCK",
  "HAS_OUT_OF_STOCK",
].includes(itemFilter);

const filteredItems = items.filter((item) => {
  const itemVariants = variants.filter(
    (variant) =>
      Number(variant.itemId) === Number(item.id),
  );

  const itemText = [
    item.name,
    item.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ja-JP");

  const itemMatches =
    !normalizedSearchQuery || itemText.includes(normalizedSearchQuery);

  const variantMatches =
    !normalizedSearchQuery ||
    itemVariants.some((variant) => {
      const variantText = [
        variant.variantName,
        variant.skuCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ja-JP");

      return variantText.includes(normalizedSearchQuery);
    });

  if (!itemMatches && !variantMatches) {
    return false;
  }

  switch (itemFilter) {
    case "HAS_VARIANTS":
      return itemVariants.length > 0;

    case "NO_VARIANTS":
      return itemVariants.length === 0;

    case "HAS_ACTIVE_VARIANTS":
    case "HAS_LOW_STOCK":
    case "HAS_OUT_OF_STOCK":
      return itemVariants.some(matchesVariantFilter);

    default:
      return true;
  }
});

const allDisplayedEpanded =
  filteredItems.length > 0 &&
  filteredItems.every((item) =>
    expandedItemIds.includes(item.id),
);

const anyDisplayedExpanded = filteredItems.some((item) =>
  expandedItemIds.includes(item.id),
);

const expandedAllDisplayed = () => {
  setExpandedItemIds((prev) => [
    ...new Set([
      ...prev,
      ...filteredItems.map((item) => item.id),
    ]),
  ]);
};

const collapseAllDisplayed = () => {
  const displayedIds = new Set(
    filteredItems.map((item) => item.id),
  );

  setExpandedItemIds((prev) =>
  prev.filter((id) => !displayedIds.has(id)),
  );
};

const hasSearchConditions =
  searchQuery.trim() !== "" || itemFilter !== "ALL";

const resetSearchConditions = () => {
  setSearchQuery("");
  setItemFilter("ALL");
};


  return (
    <div>
      {toast && (
        <div
          className="app-feedback app-feedback--success"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast}
        </div>
      )}

      <PageHeader
        title="作品管理"
        description="作品とバリエーションの登録・編集を行います。"
        actions={
          <div className={styles.pageActions}>
            {/* PC版 */}
            <div className={styles.desktopActions}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() =>
                  setInactiveItemsOpen(true)
                }
              >
                無効化済み作品
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setItemCreateOpen(true)
                }
              >
                ＋ 作品を登録
              </button>

              <button
                type="button"
                className="app-icon-button app-icon-button--solid-primary"
                onClick={reloadAll}
                disabled={
                  itemsLoading || variantsLoading
                }
                aria-label="作品とバリエーションを再読み込み"
                title="再読み込み"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
                  <path d="M21 21v-5h-5" />
                </svg>

                {(itemsLoading ||
                  variantsLoading) && (
                  <span className="visually-hidden">
                    読み込み中
                  </span>
                )}
              </button>
            </div>

            {/* スマホ版 */}
            <details
              ref={mobileActionsRef}
              className={styles.mobileActions}
              onBlur={() => {
                requestAnimationFrame(() => {
                  const menu =
                    mobileActionsRef.current;

                  if (
                    menu &&
                    !menu.contains(
                      document.activeElement,
                    )
                  ) {
                    menu.removeAttribute("open");
                  }
                });
              }}
            >
              <summary aria-label="作品管理メニューを開く">
                <span aria-hidden="true">•••</span>
              </summary>

              <div className={styles.mobileMenu}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    closeMobileActions();
                    setItemCreateOpen(true);
                  }}
                >
                  ＋ 作品を登録
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    closeMobileActions();
                    setInactiveItemsOpen(true);
                  }}
                >
                  無効化済み作品
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={async () => {
                    closeMobileActions();
                    await reloadAll();
                  }}
                  disabled={
                    itemsLoading || variantsLoading
                  }
                >
                  {itemsLoading || variantsLoading
                    ? "読み込み中..."
                    : "再読み込み"}
                </button>
              </div>
            </details>
          </div>
        }
      />

      <section aria-label="作品一覧">

        <section
  className="app-search-panel"
  aria-labelledby="item-search-title"
>
  <h2
    id="item-search-title"
    className="visually-hidden"
  >
    作品を検索・絞り込み
  </h2>

  <div className="app-search-fields app-search-fields--items">
    <div className="app-search-field">
      <label
        htmlFor="item-search"
        className="form-label fw-semibold"
      >
        作品を検索
      </label>

      <input
        id="item-search"
        type="search"
        className="form-control"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="作品名・説明・バリエーション名・SKU"
      />
    </div>

    <div className="app-search-field">
      <label
        htmlFor="item-filter"
        className="form-label fw-semibold"
      >
        作品・バリエーションの状態
      </label>

      <select
        id="item-filter"
        className="form-select"
        value={itemFilter}
        onChange={(e) => setItemFilter(e.target.value)}
      >
        <option value="ALL">すべて</option>

        <option value="HAS_VARIANTS">
          バリエーション登録ありの作品
        </option>

        <option value="NO_VARIANTS">
          バリエーション登録なしの作品
        </option>

        <option value="HAS_ACTIVE_VARIANTS">
          販売中のバリエーション
        </option>

        <option value="HAS_LOW_STOCK">
          在庫：少 のバリエーション
        </option>

        <option value="HAS_OUT_OF_STOCK">
          在庫：なし のバリエーション
        </option>
      </select>
    </div>
  </div>

  <div className="app-search-footer">
    <p
      className="app-search-result"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {searchQuery.trim() || itemFilter !== "ALL"
        ? `${filteredItems.length}種の作品が見つかりました`
        : `${filteredItems.length}種の作品を表示しています`}
    </p>

    {hasSearchConditions && (
      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={resetSearchConditions}
      >
        条件をクリア
      </button>
    )}
  </div>
</section>


        {itemError && (
          <div
            className="app-feedback app-feedback--error"
            role="alert"
          >
            {itemError}
          </div>
        )}

        {variantError && (
          <div
            className="app-feedback app-feedback--error"
            role="alert"
            >
            {variantError}
          </div>
        )}

        <div className={styles.listToolbar}>
          <h2 className={styles.listTitle}>作品一覧</h2>

          <div className={styles.expandActions}>
            <span className={styles.expandLabel}>
              バリエーション
            </span>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={expandedAllDisplayed}
              disabled={
                itemsLoading ||
                variantsLoading ||
                filteredItems.length === 0 ||
                allDisplayedEpanded
              }
            >
              すべて開く
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={collapseAllDisplayed}
              disabled={
                itemsLoading ||
                variantsLoading ||
                !anyDisplayedExpanded
              }
            >
              すべて閉じる
            </button>
          </div>
        </div>

        {itemsLoading && items.length === 0 ? (
          <div
            className="app-loading-state"
            role="status"
            aria-live="polite"
          >
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
            <span>作品を読み込んでいます</span>
          </div>
        ) : (
          <div className="d-grid gap-3">
            {filteredItems.map((item) => {
              const itemVariants = variants.filter(
                (variant) =>
                  Number(variant.itemId) === Number(item.id),
              );

              const itemMatchesQuery = itemMachesSearchQuery(item);

              const searchMatchesVariants =
                !normalizedSearchQuery || itemMatchesQuery
                  ? itemVariants
                  : itemVariants.filter(variantMatchesSearchQuery);

              const displayedVariants = filtersVariantRows
                ? searchMatchesVariants.filter(matchesVariantFilter)
                : searchMatchesVariants;

              const variantCountLabel =
                normalizedSearchQuery || filtersVariantRows
                ? `${displayedVariants.length} / ${itemVariants.length}件`
                : `${itemVariants.length}件`;
                const expanded = expandedItemIds.includes(item.id);

                const panelId = `item-variants-${item.id}`;

                return (
                    <article
                      key={item.id}
                      className="card item-management-card"
                    >
                  <div className={styles.itemHeader}>
                    <div className={styles.itemSummary}>
                        <h3
                          className={styles.itemTitle}
                          title={item.name}
                        >
                          {item.name}
                        </h3>

                        <button
                          type="button"
                          className={styles.variantCount}
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={expanded}
                          aria-controls={panelId}
                        >
                          <svg
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
                            <path d="M20 13 13 20 3 10V3h7Z" />
                            <circle cx="7.5" cy="7.5" r="1" />
                          </svg>
                        <span>バリエーション：{variantCountLabel}</span>
                        </button>

                        {item.description && (
                          <p className={styles.itemDescription}>
                            {item.description}
                          </p>
                        )}
                    </div>

                    <div className={styles.itemControls}>
                      <details
                        className={styles.itemMenu}
                        onKeyDown={(e) => {
                          if (e.key !== "Escape") return;

                          e.preventDefault();
                          e.stopPropagation();
                          e.currentTarget.removeAttribute("open");
                          e.currentTarget
                            .querySelector("summary")
                            ?.focus();
                        }}
                        onBlur={(e) => {
                          const menu = e.currentTarget;

                          requestAnimationFrame(() => {
                            if (
                              !menu.contains(document.activeElement)
                            ) {
                              menu.removeAttribute("open");
                            }
                          });
                        }}
                      >
                        <summary
                          aria-label={`${item.name}の操作メニュー`}
                          title="作品の操作"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            fill="currentColor"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <circle cx="5" cy="12" r="1.75" />
                            <circle cx="12" cy="12" r="1.75" />
                            <circle cx="19" cy="12" r="1.75" />
                          </svg>
                        </summary>

                        <div className={styles.itemMenuPanel}>
                          <button
                            type="button"
                            onClick={(e) => {
                              const menu =
                                e.currentTarget.closest("details");

                                // モーダルを閉じた後の戻り先を
                                // メニューボタンにする
                                menu?.querySelector("summary")?.focus();
                                menu?.removeAttribute("open");

                                setEditingItem(item);
                                setItemEditOpen(true);
                            }}
                          >
                            作品を編集
                          </button>

                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={panelId}
                            onClick={(e) => {
                              const menu =
                                e.currentTarget.closest("details");

                                menu?.querySelector("summary")?.focus();
                                menu?.removeAttribute("open");
                                toggleItem(item.id);
                            }}
                          >
                            {expanded
                              ? "バリエーション一覧を閉じる"
                              : "バリエーション一覧を開く"
                            }
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              const menu =
                                e.currentTarget.closest("details");

                                menu?.querySelector("summary")?.focus();
                                menu?.removeAttribute("open");

                                setCreatingVariantItemId(item.id);
                                setVariantCreateOpen(true);
                            }}
                          >
                            + バリエーションを追加
                          </button>
                        </div>
                      </details>

                      {expanded && (
                        <button
                          type="button"
                          className={styles.closeVariants}
                          aria-label={`${item.name}のバリエーションを閉じる`}
                          aria-controls={panelId}
                          aria-expanded={expanded}
                          onClick={(e) => {
                            // 閉じるとこのボタンが消えるため、
                            // 同じカードのメニューボタンへ戻す
                            e.currentTarget.parentElement
                              ?.querySelector("summary")
                              ?.focus();

                            toggleItem(item.id);
                          }}
                        >
                          <span className={styles.closeLabel}>
                            バリエーションを閉じる
                          </span>

                          <span
                            className={styles.closeIcon}
                            aria-hidden="true"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="22"
                              height="22"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLineCap="round"
                              focusable="false"
                            >
                              <path d="m6 6 12 12M18 6 6 18" />
                            </svg>
                          </span>

                          {/* <span
                            className={styles.closeIcon}
                            aria-hidden="true"
                          >
                            x
                          </span> */}
                        </button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                      <div
                        id={panelId}
                        className="item-variants-panel"
                      >
                      {itemVariants.length > 0 ? (
                          <ManagementVariantList
                            variants={displayedVariants}
                            updatingId={null}
                            onEdit={(variant) => {
                              setEditingVariant(variant);
                              setVariantEditOpen(true);
                            }}
                            onPreviewImage={(variant) =>{
                              if (!variant.imageUrl) return;

                              setPreviewUrl(variant.imageUrl);
                              setPreviewTitle(
                                `${variant.itemName ?? ""} / ${
                                  variant.variantName ?? "名称未設定"
                                }`
                              );
                              setPreviewOpen(true);
                            }}
                          />
                        ) : (
                            <div
                              className="app-empty-state app-empty-state--embedded"
                              role="status"
                              >
                                <p className="app-empty-state__title">
                                  この作品にはバリエーションがありません
                                </p>

                                <p className="app-empty-state__description">
                                  作品メニューの「バリエーション追加」から登録できます。
                                </p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {items.length > 0 && filteredItems.length === 0 && (
             <div
              className="app-empty-state app-empty-state--surface"
              role="status"
              >
                <h3 className="app-empty-state__title">
                  該当する作品がありません
                </h3>

                <p className="app-empty-state__description">
                  キーワードや絞り込み条件を変更してお試しください。
                </p>

                <div className="app-empty-state__action">
                     <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetSearchConditions}
                     >
                        検索条件をリセット
                     </button>
                 </div>
             </div>
           )}

            {items.length === 0 && !itemsLoading && (
              <div
                className="app-empty-state app-empty-state--surface"
                role="status"
              >
                <h3 className="app-empty-state__title">
                  登録されている作品がありません
                </h3>

                <p className="app-empty-state__description">
                  最初の作品を登録すると、バリエーションや在庫を管理できます。
                </p>

                <div className="app-empty-state__action">

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setItemCreateOpen(true)}
                  >
                    ＋ 作品を登録
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ItemCreateModal
        readOnly={readOnly}
        open={itemCreateOpen}
        onClose={() => setItemCreateOpen(false)}
        onCreated={async () => {
          await loadItems();
          showToast("作品を登録しました");
        }}
      />

      <ItemEditModal
        readOnly={readOnly}
        open={itemEditOpen}
        item={editingItem}
        hasActiveVariants={variants.some(
            (variant) =>
                Number(variant.itemId) === Number(editingItem?.id) &&
                variant.status === "ACTIVE",
        )}
        onClose={() => {
          setItemEditOpen(false);
          setEditingItem(null);
        }}
        onUpdated={async () => {
          await loadItems();
          showToast("作品情報を更新しました");
        }}
        onDeactivated={async () => {
            await loadItems();
            showToast("作品を無効化しました");
        }}
      />

      <InactiveItemsModal
        readOnly={readOnly}
        open={inactiveItemsOpen}
        onClose={() => setInactiveItemsOpen(false)}
        onReactivated={async () => {
          await loadItems();
          showToast("作品を再有効化しました");
        }}
      />

      <VariantCreateModal
        readOnly={readOnly}
        open={variantCreateOpen}
        initialItemId={creatingVariantItemId}
        onClose={() => {
            setVariantCreateOpen(false);
            setCreatingVariantItemId(null);
        }}
        onCreated={async () => {
          await loadVariants();

          if (creatingVariantItemId !== null) {
            setExpandedItemIds((prev) =>
                prev.includes(creatingVariantItemId)
                    ? prev
                    : [...prev, creatingVariantItemId]
            );
          }

          showToast("バリエーションを追加しました");
        }}
      />

      <VariantEditModal
        readOnly={readOnly}
        open={variantEditOpen}
        variant={editingVariant}
        onClose={() => {
          setVariantEditOpen(false);
          setEditingVariant(null);
        }}
        onUpdated={async () => {
          await loadVariants();
          showToast("バリエーションを更新しました");
        }}
        onImageUploaded={(variantId, imageUrl) => {
          setVariantImageUrl(variantId, imageUrl);
          showToast(
            imageUrl ? "画像を更新しました" : "画像を削除しました",
          );
        }}
        onPreviewImage={(variant) => {
          if (!variant?.imageUrl) return;

          setPreviewUrl(variant.imageUrl);
          setPreviewTitle(
            `${variant.itemName ?? ""} / ${
              variant.variantName ?? "名称未設定"
            }`,
          );
          setPreviewOpen(true);
        }}
      />

      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewUrl}
        title={previewTitle}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewUrl("");
          setPreviewTitle("");
        }}
      />
    </div>
  );
}