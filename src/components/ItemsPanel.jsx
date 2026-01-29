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
      setError("作家名は必須です");
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
      const msg = e?.response?.message || "作品の追加に失敗しました";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 16 }}>
      <h2>作品管理（Items）</h2>
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {/* 追加フォーム */}
      <form onSubmit={onSubmit} style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "inline-block", width: 80 }}>作品名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：ポリゴン（単色）"
            style={{ width: 260 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "inline-block", width: 80 }}>説明</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="任意"
            style={{ width: 420 }}
          />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "追加中" : "追加"}
        </button>
      </form>

      {/* 一覧 */}
      <div style={{ marginBottom: 8 }}>
        <button onClick={load} disabled={loading}>
          {loading ? "読み込み中" : "再読み込み"}
        </button>
      </div>

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>作品名</th>
            <th>説明</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>{it.name}</td>
              <td>{it.description ?? "-"}</td>
            </tr>
          ))}

          {items.length === 0 && !loading && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>
                作品がありません（追加してください）
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
