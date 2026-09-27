export default function AppLogo({ className = ""}) {
    return (
        <span className={`app-logo ${className}`.trim()}>
            <svg
                className="app-logo-icon"
                viewBox="0 0 36 40"
                aria-hidden="true"
            >
                <path d="M18 2 33 10.5v18L18 38 3 29V10.5L18 2Z" />
                <path d="m3 10.5 15 9 15-9" />
                <path d="M18 19.5V38" />
                <path d="m10.5 6.25 15 9" />
            </svg>

            <span className="app-logo-text">
                <span className="app-logo-name">Handmade</span>
                <span className="app-logo-accent">-2</span>
            </span>
        </span>
    );
}