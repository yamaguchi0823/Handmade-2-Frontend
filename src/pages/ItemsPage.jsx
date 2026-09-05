import { useEffect, useRef, useState } from "react";
import api, { fetchItems } from "../api";

import PageHeader from "../components/PageHeader";
import ItemCreateModal from "../components/ItemCreateModal";
import ItemEditModal from "../components/ItemEditModal";
import InactiveItemsModal from "../components/InactiveItemsModal";
import VariantTable from "../components/VariantTable";
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

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("ja-JP");

  const filteredItems = items.filter((item) => {
    if (!normalizedQuery) {
        return true;
    }

    const itemText = [
        item.name,
        item.description,
    ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ja-JP");

    const itemMatches = itemText.includes(normalizedQuery);

    const variantMatches = variants.some((variant) => {
        if (Number(variant.itemId) !== Number(item.id)) {
            return false;
        }

        const variantText = [
            variant.variantName,
            variant.skuCode,
        ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ja-JP");

        return variantText.includes(normalizedQuery);
    });

    return itemMatches || variantMatches;
  });

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
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setItemCreateOpen(true)}
            >
              ＋ 作品を登録
            </button>
        }
      />

      <p className="text-secondary mb-4">
        作品とバリエーションの登録・編集を行います。
      </p>

      <section aria-labelledby="items-heading">
        <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <h2 id="items-heading" className="h5 mb-1">
              作品一覧
            </h2>

            <p className="small text-muted mb-0">
              作品ごとにバリエーションを確認・管理できます。
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setInactiveItemsOpen(true)}
            >
              無効化済み作品
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={reloadAll}
              disabled={itemsLoading || variantsLoading}
            >
              {itemsLoading || variantsLoading
                ? "読み込み中..."
                : "再読み込み"}
            </button>
          </div>
        </div>

        <section className="mb-4" aria-labelledby="item-search-title">
            <h2 id="item-search-title" className="visually-hidden">
                作品を検索
            </h2>

            <div className="d-flex flex-column flex-md-row align-items-md-end gap-2">
                <div className="flex-grow-1">
                    <label htmlFor="item-search" className="form-label fw-semibold">
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

                {searchQuery && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchQuery("")}
                    >
                        検索をクリア
                    </button>
                )}
            </div>
            <p
                className="form-text mb-0 mt-2"
                aria-live="polite"
                aria-atomic="true"
            >
                {searchQuery.trim()
                    ? `${filteredItems.length}件の作品が見つかりました`
                    : `${filteredItems.length}件の作品を表示しています`
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

                const expanded = expandedItemIds.includes(item.id);

                const panelId = `item-variants-${item.id}`;

                return (
                    <article key={item.id} className="card">
                  <div className="card-header bg-white p-3">
                    <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h3 className="h6 mb-0">{item.name}</h3>

                          <span className="badge text-bg-secondary">
                            {itemVariants.length}件
                          </span>
                        </div>

                        {item.description ? (
                            <p className="small text-muted mt-2 mb-0">
                            {item.description}
                          </p>
                        ) : (
                            <p className="small text-muted mt-2 mb-0">
                            説明は登録されていません
                          </p>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                                setCreatingVariantItemId(item.id);
                                setVariantCreateOpen(true);
                            }}
                        >
                            + バリエーション
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                              setEditingItem(item);
                              setItemEditOpen(true);
                            }}
                            >
                          作品を編集
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={expanded}
                          aria-controls={panelId}
                          >
                          {expanded
                            ? "閉じる"
                            : "バリエーションを表示"}

                          <span className="ms-2" aria-hidden="true">
                            {expanded ? "▲" : "▼"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {expanded && (
                      <div id={panelId} className="card-body">
                      {itemVariants.length > 0 ? (
                          <VariantTable
                          variants={itemVariants}
                          updatingId={null}
                          mode="management"
                          showItemName={false}
                          onEdit={(variant) => {
                              setEditingVariant(variant);
                              setVariantEditOpen(true);
                            }}
                            onPreviewImage={(variant) => {
                                if (!variant.imageUrl) return;

                                setPreviewUrl(variant.imageUrl);
                                setPreviewTitle(
                                    `${variant.itemName ?? ""} / ${
                                        variant.variantName ??
                                        "名称未設定"
                                    }`,
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

                     {/* <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchQuery("")}
                     >
                        検索条件をクリア
                     </button> */}
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