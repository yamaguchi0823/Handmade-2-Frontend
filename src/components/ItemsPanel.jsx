import { useState, useEffect } from "react";
import { createItem, fetchItems } from "../api";

export default function ItemPanel() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchItems();
      setItems(res.data);
    } catch (e) {
      console.error(e);
      setError("作品一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("作品名は必須です");
      return;
    }
    try {
      setSaving(true);
      setError("");

      await createItem({
        name: name.trim(),
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      await load(); // 作成後に再取得（理解優先）
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || "作品の追加に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <h2 className="h5 mb-0">作品一覧・登録</h2>

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
        </div>
        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {/* 追加フォーム */}
        <form onSubmit={onSubmit} className="row g-2 align-items-end mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">作品名</label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：ポリゴン（単色）"
            />
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label">説明</label>
            <input
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="任意"
            />
          </div>

          <div className="col-12 col-md d-grid">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                  追加中
                </>
              ) : (
                "追加"
              )}
            </button>
          </div>
        </form>

        {/* 一覧 */}
        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>作品名</th>
                <th>説明</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="text-nowrap">{it.id}</td>
                  <td>{it.name}</td>
                  <td className="text-muted">{it.description ?? "-"}</td>
                </tr>
              ))}

              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    作品がありません（追加してください）
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
