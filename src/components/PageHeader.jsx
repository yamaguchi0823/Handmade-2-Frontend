export default function PageHeader({ title, actions }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <h2 className="h4 mb-0">{title}</h2>
      <div className="d-flex gap-2">{actions}</div>
    </div>
  );
}
