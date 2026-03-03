"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
          color: "#e8e8e8",
          fontFamily:
            "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "1rem",
        }}
      >
        {/* Terminal-style error header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "3.5rem",
              fontFamily: "'Geist Mono', monospace",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#e8e8e8",
            }}
          >
            500
          </span>
          <span
            style={{
              height: "2.5rem",
              width: "1px",
              backgroundColor: "#2a2a2a",
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: "0.75rem",
              fontFamily: "'Geist Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#777",
            }}
          >
            System Error
          </span>
        </div>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#777",
            marginBottom: "2rem",
            textAlign: "center",
            maxWidth: "28rem",
          }}
        >
          Something went wrong. Our systems have been notified.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            borderRadius: "0.375rem",
            backgroundColor: "#a855f7",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#fafafa",
            border: "none",
            cursor: "pointer",
            transition: "background-color 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#9333ea"
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#a855f7"
          }}
        >
          Refresh Page
        </button>

        {/* Dev-only error details */}
        {process.env.NODE_ENV === "development" && (
          <div
            style={{
              marginTop: "2.5rem",
              maxWidth: "36rem",
              width: "100%",
              borderRadius: "0.375rem",
              border: "1px solid #2a2a2a",
              backgroundColor: "#161616",
              padding: "0.75rem 1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.625rem",
                fontFamily: "'Geist Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#555",
                marginBottom: "0.5rem",
              }}
            >
              Debug Info
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  fontFamily: "'Geist Mono', monospace",
                  color: "#888",
                  marginBottom: "0.25rem",
                }}
              >
                Digest: {error.digest}
              </p>
            )}
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "'Geist Mono', monospace",
                color: "#c87878",
                wordBreak: "break-all",
              }}
            >
              {error.message}
            </p>
          </div>
        )}

        {/* Brand footer */}
        <p
          style={{
            marginTop: "4rem",
            fontSize: "0.625rem",
            fontFamily: "'Geist Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "rgba(119,119,119,0.4)",
          }}
        >
          SOLRAD Terminal
        </p>
      </body>
    </html>
  )
}
