import { useState, useEffect } from "react";
import {
  deactivateItem,
  fetchInactiveItems,
  fetchItems,
  reactiveItem,
  updateItem,
 } from "../api";

export default function ItemPanel({ onItemsLoaded, refreshKey }) {
  const [items, setItems] = useState([]);
  const [inactiveItems, setInactiveitems] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchItems();
      const list = Array.isArray(res.data) ? res.data : [];

      setItems(list);
      onItemsLoaded?.(list);

    } catch (e) {
      console.error(e);
      setError("作品一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const loadInactive = async () => {
    try {
      setLoadingInactive(true);
      setError("");

      const res = await fetchInactiveItems();
      setInactiveitems(Array.isArray(res.data) ? res.data : []);
    } catch(e) {
      console.error(e);
      setError("無効化済み作品の取得に失敗しました");
      setInactiveitems([]);
    } finally {
      setLoadingInactive(false);
    }
  };

  const toggleInactive = () => {
    const next = !showInactive;
    setShowInactive(next);

    if (next) {
      loadInactive();
    }
  };

  useEffect(() => {
    load();
    // LoadとonItemsLoadedを依存配列へ追加すると、
    // 現在の書き方では再実行が繰り返されるため除外
    // eslint-disable-next-line react-hooks/ exhaustive-deps
  }, [refreshKey]);


  const startEdit = (item) => {
  setEditingId(item.id);
  setEditName(item.name ?? "");
  setEditDescription(item.description ?? "");
  setError("");
  setSuccess("");
};

const cancelEdit = () => {
  setEditingId(null);
  setEditName("");
  setEditDescription("");
};

const saveEdit = async (itemId) => {
  if (!editName.trim()) {
    setError("作品名は必須です");
    return;
  }

  try {
    setProcessingId(itemId);
    setError("");
    setSuccess("");

    await updateItem(itemId, {
      name: editName.trim(),
      description: editDescription.trim() || null,
    });

    cancelEdit();
    await load();
    setSuccess("作品を更新しました");
  } catch (e) {
    console.error(e);
    setError(e?.response?.data?.message || "作品の更新に失敗しました");
  } finally {
    setProcessingId(null);
  }
};

const deactivate = async (item) => {
  const confirmed = window.confirm(
    `「${item.name}」を無効化しますか？\n作品一覧には表示されなくなります。`,
  );

  if (!confirmed) return;

  try {
    setProcessingId(item.id);
    setError("");
    setSuccess("");

    await deactivateItem(item.id);

    if (editingId === item.id) {
      cancelEdit();
    }

    await load();

    if (showInactive){
      await loadInactive();
    }

    setSuccess("作品を無効化しました");

  } catch (e) {
    console.error(e);
    setError(e?.response?.data?.message || "作品の無効化に失敗しました");
  } finally {
    setProcessingId(null);
  }
};

const reactive = async (item) => {
  const confirmed = window.confirm(
    `「${item.name}」を再有効化しますか？`,
  );

  if (!confirmed) return;

  try {
    setProcessingId(item.id);
    setError("");
    setSuccess("");

    await reactiveItem(item.id);

    await Promise.all([load(), loadInactive()]);
    setSuccess("作品を再有効化しました");
  } catch (e) {
    console.error(e);
    setError(
      e?.response?.data?.message ||
      "作品の再有効化に失敗しました",
    );
  } finally {
    setProcessingId(null);
  }
};

  return (
    <section className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <h2 className="h5 mb-0">作品一覧</h2>
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={load}
              disabled={loading}
              >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                    />
                  読み込み中
                </>
              ) : (
                "再読み込み"
              )}
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={toggleInactive}
              disabled={loadingInactive}
              >
              {loadingInactive
                ? "読み込み中"
                : showInactive
                ? "無効化済みを閉じる"
                : "無効化済みを表示"
              }
            </button>
          </div>
        </div>
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success py-2" role="alert">
            {success}
          </div>
        )}

        {/* 一覧 */}
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>作品名</th>
                <th>説明</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const editing = editingId === item.id;
                const processing = processingId === item.id;

                return (
                  <tr key={item.id}>
                    <td className="text-nowrap">{item.id}</td>

                    <td>
                      {editing ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={processing}
                        />
                      ) : (
                        item.name
                      )}
                    </td>

                    <td>
                      {editing ? (
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={processing}
                        />
                      ) : (
                        <span className="text-muted">
                          {item.description ?? "-"}
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="d-flex gap-2 flex-wrap">
                        {editing ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => saveEdit(item.id)}
                              disabled={processing}
                            >
                              {processing ? "保存中" : "保存"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={cancelEdit}
                              disabled={processing}
                            >
                              キャンセル
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => startEdit(item)}
                              disabled={processingId !== null}
                            >
                              編集
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => deactivate(item)}
                              disabled={processingId !== null}
                            >
                              {processing ? "処理中" : "無効化"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    作品がありません（追加してください）
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {showInactive &&(
            <div className="mt-4 border-top pt-3">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <h3 className="h6 mb-0">
                  無効化済み作品
                  <span className="badge text-bg-secondary ms-2">
                    {inactiveItems.length}
                  </span>
                </h3>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadInactive}
                  disabled={loadingInactive}
                  >
                    {loadingInactive ? "読み込み中" : "再読み込み"}
                  </button>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>作品名</th>
                      <th>説明</th>
                      <th>操作</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inactiveItems.map((item) => {
                      const processing = processingId === item.id;

                      return (
                        <tr key={item.id} className="table-secondary">
                          <td className="text-nowrap">{item.id}</td>
                          <td>{item.name}</td>
                          <td className="text-muted">
                            {item.description ?? "-"}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={()=>reactive(item)}
                              disabled={processingId !== null}>
                                {processing ? "処理中" : "再有効化"}
                              </button>
                          </td>
                        </tr>
                      );
                    })}

                    {inactiveItems.length === 0 && !loadingInactive && (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-muted py-4"
                        >
                          無効化済みの作品はありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
