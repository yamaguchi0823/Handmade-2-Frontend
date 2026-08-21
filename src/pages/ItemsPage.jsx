import { useEffect, useRef, useState } from "react";
import api from "../api";

import PageHeader from "../components/PageHeader";
import ItemPanel from "../components/ItemsPanel";
import VariantTable from "../components/VariantTable";
import VariantCreateModal from "../components/VariantCreateModal";
import VariantEditModal from "../components/VariantEditModal";
import ImagePreviewModal from "../components/ImagePreviewModal";

export default function ItemsPage(){
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

    const setVariantImageUrl = (variantId, imageUrl) => {
        setVariants((prev) =>
            prev.map((variant)=>
                variant.id === variantId
                    ? {...variant, iamageUrl: imageUrl || null}
                    : variant,
            ),
        );

        setEditingVariant((prev)=>
        prev && prev.id === variantId
            ? { ...prev, imaggeUrl: imageUrl || null  }
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
                <div className="aleat alert-succsess py-2" role="alert">
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
            <ItemPanel />
            <hr className="my-4" />

            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <h2 className="h5 mb-0">バリエーション一覧</h2>

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
                <div className="aleart alert-danger py-2" role="alert">
                    {error}
                </div>
            )}

            <VariantTable
                variants={variants}
                updatingId={null}
                mode="management"
                onEdit={(variant)=>{
                    setEditingVariant(variant);
                    setEditOpen(true);
                }}
                onPreviewImage={(variant)=>{
                    if (!variant.imaggeUrl) return;

                    setPreviewUrl(variant.imageUrl);
                    setPreviewTitle(
                        `${variant.itemName ?? ""} / ${variant.skuCode ?? ""}`,
                    );
                    setPreviewOpen(true);
                 }}
            />

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
                        `${variant.itemName ?? ""} / ${variant.skuCode ?? ""}`,
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