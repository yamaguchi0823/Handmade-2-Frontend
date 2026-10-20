import styles from "./PageHeader.module.css"

export default function PageHeader({
  title,
  description,
  actions,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {title}
        </h1>

        {description && (
          <p className={styles.description}>
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </header>
  );
}
