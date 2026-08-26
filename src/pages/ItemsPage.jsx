import { useEffect, useRef, useState } from "react";
import api from "../api";

import PageHeader from "../components/PageHeader";
import ItemPanel from "../components/ItemsPanel";
import VariantTable from "../components/VariantTable";
import VariantCreateModal from "../components/VariantCreateModal";
import VariantEditModal from "../components/VariantEditModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import { useFormStatus } from "react-dom";

export default function ItemsPage(){
    const [items, setItems] = useState([]);
    const [expandedItemIds, setExpandedItemIds] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewTitle, setPreviewTitle] = useState("");

    const toastTimerRef = useRef(null);

    const showToast = (message) => {
        setToast(message);

        if (toastTimerRef.current){
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(()=>{
            setToast("");
        },3000);
    };

    const loadVariants = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await api.get("/variants");
            setVariants(Array.isArray(res.data) ? res.data : []);
        } catch (e){
            console.error(e);
            setError("バリエーションの取得に失敗しました");
            setVariants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleItemsLoaded = (list) => {
        setItems(list);

        setExpandedItemIds((prev) =>{
            const validIds = prev.filter((id)=>
                list.some((item) => item.id === id),
            );

            if (validIds.length > 0 || list.length === 0 ) {
                return validIds;
            }

            // 初回は戦闘の作品だけ開く
            return [list[0].id];
        });
    };

    // 開閉処理
    const toggleItem = (itemId) => {
        setExpandedItemIds((prev)=>
            prev.includes(itemId)
                ? prev.filter((id)=> id !== itemId)
                : [...prev, itemId],
        );
    };

    const setVariantImageUrl = (variantId, imageUrl) => {
        setVariants((prev) =>
            prev.map((variant)=>
                variant.id === variantId
                    ? {...variant, imageUrl: imageUrl || null}
                    : variant,
            ),
        );

        setEditingVariant((prev)=>
        prev && prev.id === variantId
            ? { ...prev, imageUrl: imageUrl || null  }
            : prev,
    );
    };

    useEffect(()=>{
        loadVariants();

        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    },[]);

    return(
        <div>
            {toast && (
                <div className="alert alert-success py-2" role="alert">
                    {toast}
                </div>
            )}

            <PageHeader
                title="作品管理"
                actions={
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={()=> setCreateOpen(true)}
                    >
                        + バリエーション追加
                        </button>
                }
            />

            <p className="text-secondary mb-0">
                作品とバリエーションの登録・編集を行います。
            </p>
            <ItemPanel onItemsLoaded={handleItemsLoaded} />

            <hr className="my-4" />
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h2 className="h5 mb-0">作品別バリエーション</h2>

                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={loadVariants}
                    disabled={loading}
                    >
                        {loading ? "読み込み中" : "再読み込み"}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger py-2" role="alert">
                    {error}
                </div>
            )}

            <div className="d-grid gap-3">
                {items.map((item) => {
                    const itemVariants = variants.filter(
                    (variant) => Number(variant.itemId) === Number(item.id),
                    );

                    const expanded = expandedItemIds.includes(item.id);

                    return (
                    <section key={item.id} className="card">
                        <div className="card-header bg-white p-0">
                        <button
                            type="button"
                            className="btn w-100 text-start border-0 rounded-0 p-3"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={expanded}
                        >
                            <div className="d-flex align-items-center justify-content-between gap-3">
                            <div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-semibold">{item.name}</span>

                                <span className="badge text-bg-secondary">
                                    {itemVariants.length}件
                                </span>
                                </div>

                                {item.description && (
                                <div className="small text-muted mt-1">
                                    {item.description}
                                </div>
                                )}
                            </div>

                            <span className="text-secondary">
                                {expanded ? "閉じる ▲" : "開く ▼"}
                            </span>
                            </div>
                        </button>
                        </div>

                        {expanded && (
                        <div className="card-body">
                            {itemVariants.length > 0 ? (
                            <VariantTable
                                variants={itemVariants}
                                updatingId={null}
                                mode="management"
                                showItemName={false}
                                onEdit={(variant) => {
                                setEditingVariant(variant);
                                setEditOpen(true);
                                }}
                                onPreviewImage={(variant) => {
                                if (!variant.imageUrl) return;

                                setPreviewUrl(variant.imageUrl);
                                setPreviewTitle(
                                    `${variant.itemName ?? ""} / ${
                                    variant.variantName ?? "名称未設定"
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
                    </section>
                    );
                })}

                {items.length === 0 && !loading && (
                    <div className="card">
                    <div className="card-body text-center text-muted py-4">
                        表示できる作品がありません
                    </div>
                    </div>
                )}
                </div>


            <VariantCreateModal
                open={createOpen}
                onClose={()=>setCreateOpen(false)}
                onCreated={async ()=>{
                    await loadVariants();
                    showToast("バリエーションを追加しました");
                }}
            />

            <VariantEditModal
                open={editOpen}
                variant={editingVariant}
                onClose={()=>{
                    setEditOpen(false);
                    setEditingVariant(null);
                }}
                onUpdated={async ()=> {
                    await loadVariants();
                    showToast("バリエーションを更新しました");
                }}
                onImageUploaded={(variantId, imageUrl)=>{
                    setVariantImageUrl(variantId,imageUrl);
                    showToast(imageUrl ? "画像を更新しました" : "画像を削除しました");
                }}
                onPreviewImage={(variant)=>{
                    if(!variant?.imageUrl) return;

                    setPreviewUrl(variant.imageUrl);
                    setPreviewTitle(
                        `${variant.itemName ?? ""} / ${variant.variantName ?? "名称未設定"}`,
                    );
                    setPreviewOpen(true);
                }}
            />

            <ImagePreviewModal
                open={previewOpen}
                imageUrl={previewUrl}
                title={previewTitle}
                onClose={()=>{
                    setPreviewOpen(false);
                    setPreviewUrl("");
                    setPreviewTitle("");
                }}
            />
        </div>
    );

}