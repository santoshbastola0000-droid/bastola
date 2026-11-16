"use client";

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const chunkFailure = /ChunkLoadError|Failed to load chunk|Loading chunk|dynamically imported module/i.test(error?.message || "");
  return (
    <html lang="ne">
      <body style={{ margin: 0, padding: 24, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <main style={{ maxWidth: 440, margin: "15vh auto", padding: 24, background: "white", borderRadius: 16 }}>
          <h1 style={{ fontSize: 22 }}>पृष्ठ खोल्न सकिएन</h1>
          <p>{chunkFailure
            ? "Website को नयाँ version लोड गर्न पृष्ठ फेरि खोल्नुहोस्।"
            : "अस्थायी समस्या आयो। फेरि प्रयास गर्नुहोस्।"}</p>
          <button type="button" onClick={() => chunkFailure ? window.location.reload() : reset()}
            style={{ padding: "12px 18px", borderRadius: 8, cursor: "pointer" }}>
            {chunkFailure ? "Reload page" : "Retry"}
          </button>
          <a href="/" style={{ marginLeft: 20 }}>Go home</a>
        </main>
      </body>
    </html>
  );
}
