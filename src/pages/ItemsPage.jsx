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

export default function ItemsPage() {
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
    mobileActionsRef.current?.removeAttribute("opne");
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

      setExpandedItemIds((prev) => {
        const validIds = prev.filter((id) =>
          list.some((item) => item.id === id),
        );

        if (validIds.length > 0 || list.length === 0) {
          return validIds;
        }

        // 初回は先頭の作品だけ開く
        return [list[0].id];
      });
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

const hasSearchConditions =
  searchQuery.trim() !== "" || itemFilter !== "ALL";

const resetSearchConditions = () => {
  setSearchQuery("");
  setItemFilter("ALL");
};


  return (
    <div>
      {toast && (
        <div className="alert alert-success" role="status">
          {toast}
        </div>
      )}

      <PageHeader
  title="作品管理"
  actions={
    <div className="item-page-actions">
      {/* PC版 */}
      <div className="item-page-actions-desktop">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setItemCreateOpen(true)}
        >
          ＋ 作品を登録
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setInactiveItemsOpen(true)}
        >
          無効化済み作品
        </button>

        <button
          type="button"
          className="btn btn-primary item-reload-button"
          onClick={reloadAll}
          disabled={itemsLoading || variantsLoading}
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
          {(itemsLoading || variantsLoading) && (
            <span className="visually-hidden">
              読み込み中
            </span>
          )}
        </button>
      </div>

      {/* スマホ版 */}
      <details
  ref={mobileActionsRef}
  className="item-page-actions-mobile"
  onBlur={() => {
    requestAnimationFrame(() => {
      const menu = mobileActionsRef.current;

      if (menu && !menu.contains(document.activeElement)) {
        menu.removeAttribute("open");
      }
    });
  }}
>
        <summary aria-label="作品管理メニューを開く">
          <span aria-hidden="true">•••</span>
        </summary>

        <div className="item-page-actions-menu">
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
            disabled={itemsLoading || variantsLoading}
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

      <p className="text-secondary mb-4">
        作品とバリエーションの登録・編集を行います。
      </p>

      <section aria-label="作品一覧">

        <section
          className="item-search-panel mb-4"
          aria-labelledby="item-search-title"
        >
            <h2 id="item-search-title" className="visually-hidden">
                作品を検索・絞り込み
            </h2>

            <div className="row g-2 align-items-md-end">
                <div className="col-12 col-lg">
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

                <div className="cil-12 col-md-6 col-lg-3">
                    <label
                        htmlFor="item-filter"
                        className="form-label fw-semibold"
                    >
                        作品の状態
                    </label>

                    <select
                        id="item-filter"
                        className="form-select"
                        value={itemFilter}
                        onChange={(e) => setItemFilter(e.target.value)}
                        >
                        <option value="ALL">すべて</option>
                        <option value="HAS_VARIANTS">バリエーション登録ありの作品</option>
                        <option value="NO_VARIANTS">バリエーション登録なしの作品</option>
                        <option value="HAS_ACTIVE_VARIANTS">
                          販売中のバリエーション</option>
                        <option value="HAS_LOW_STOCK">在庫：少 のバリエーション</option>
                        <option value="HAS_OUT_OF_STOCK">在庫：なし のバリエーション</option>
                    </select>
                </div>

                {hasSearchConditions && (
                    <div className="col-12 col-md-auto">
                        <button
                            type="button"
                            className="btn btn-secondary mt-1
                            "
                            onClick={resetSearchConditions}
                        >
                            条件をリセット
                        </button>
                    </div>
                )}
            </div>

            <p
                className="form-text mb-0 mt-2"
                aria-live="polite"
                aria-atomic="true"
            >
                {searchQuery.trim()
                    ? `${filteredItems.length}種の作品が見つかりました`
                    : `${filteredItems.length}種の作品を表示しています`
                }
            </p>
        </section>


        {itemError && (
          <div className="alert alert-danger" role="alert">
            {itemError}
          </div>
        )}

        {variantError && (
          <div className="alert alert-danger" role="alert">
            {variantError}
          </div>
        )}

        {itemsLoading && items.length === 0 ? (
          <div
            className="d-flex align-items-center justify-content-center gap-2 py-5"
            role="status"
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
                : `${itemVariants.length}件`
                const expanded = expandedItemIds.includes(item.id);

                const panelId = `item-variants-${item.id}`;

                return (
                    <article
                      key={item.id}
                      className="card item-management-card"
                    >
                  <div className="item-card-header">
                    <div className="item-card-heading">
                      <div className="item-card-title-group">
                        <svg
                          className="item-card-icon"
                          viewBox="0 0 24 24"
                          width="20"
                          height="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="m21 8-9 5-9-5" />
                          <path d="m3 8 9-5 9 5v8l-9 5-9-5Z" />
                          <path d="M12 13v8" />
                        </svg>

                        <h3
                          className="item-card-title"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary item-edit-button"
                        onClick={() => {
                          setEditingItem(item);
                          setItemEditOpen(true);
                        }}
                        aria-label={`${item.name}の作品情報を編集`}
                      >
                        <svg
                          className="item-edit-icon"
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

                        {/* <span>作品編集</span> */}
                      </button>
                    </div>

                    <p
                      className="item-card-description"
                      title={
                        item.description ||
                        "説明は登録されていません"
                      }
                    >
                      {item.description ||
                        ""
                        // "説明は登録されていません"
                        }
                    </p>

                    <div className="item-card-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary item-variants-toggle"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={expanded}
                        aria-controls={panelId}
                      >
                        <span
                          className="item-toggle-icon"
                          aria-hidden="true"
                        >
                          {expanded ? "▲" : "▼"}
                        </span>

                        <span>
                          {expanded ? "閉じる" : "バリエーション"}
                        </span>

                        <span className="item-variant-count">
                          {variantCountLabel}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary item-variant-add"
                        onClick={() => {
                          setCreatingVariantItemId(item.id);
                          setVariantCreateOpen(true);
                        }}
                        aria-label={`${item.name}にバリエーションを追加`}
                      >
                        ＋ 追加
                      </button>
                    </div>
</div>

                  {expanded && (
                      <div
                        id={panelId}
                        className="card-body item-variants-panel"
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
                            <div className="text-center text-muted py-4">
                          この作品にはバリエーションがありません
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {items.length > 0 && filteredItems.length === 0 && (
             <div className="card">
                 <div className="card-body text-center py-5">
                     <h3 className="h6">該当する作品がありません</h3>

                     {/* <p className="text-muted mb-3">
                        キーワードを変えて、もう一度お試しください。
                     </p> */}

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
              <div className="card">
                <div className="card-body text-center py-5">
                  <h3 className="h6">
                    登録されている作品がありません
                  </h3>

                  <p className="text-muted mb-3">
                    最初に作品を登録してください。
                  </p>

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
        open={itemCreateOpen}
        onClose={() => setItemCreateOpen(false)}
        onCreated={async () => {
          await loadItems();
          showToast("作品を登録しました");
        }}
      />

      <ItemEditModal
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
        open={inactiveItemsOpen}
        onClose={() => setInactiveItemsOpen(false)}
        onReactivated={async () => {
          await loadItems();
          showToast("作品を再有効化しました");
        }}
      />

      <VariantCreateModal
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