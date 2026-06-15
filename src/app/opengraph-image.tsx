import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FinMate AI — Catat keuangan semudah chat WA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #7c3aed 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          position: "relative",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Decorative blob */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.1)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "9999px",
            background: "rgba(139, 92, 246, 0.3)",
            filter: "blur(60px)",
          }}
        />

        {/* Top: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", zIndex: 10 }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: "bold",
            }}
          >
            F
          </div>
          <div style={{ fontSize: "36px", fontWeight: "bold", letterSpacing: "-0.02em" }}>
            FinMate AI
          </div>
        </div>

        {/* Center: Tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative", zIndex: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "9999px",
              padding: "10px 20px",
              width: "fit-content",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            <div style={{ width: "12px", height: "12px", borderRadius: "9999px", background: "#4ade80" }} />
            Early Access · Beta Terbuka
          </div>
          <div
            style={{
              fontSize: "88px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              maxWidth: "1000px",
            }}
          >
            Catat keuangan
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #ffffff 0%, #fef3c7 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              semudah chat WA.
            </span>
          </div>
          <div style={{ fontSize: "30px", color: "rgba(255, 255, 255, 0.85)", maxWidth: "900px", lineHeight: 1.3 }}>
            Ketik &ldquo;kopi 18rb&rdquo; di Telegram, AI yang catat. Bukan aplikasi keuangan rumit.
          </div>
        </div>

        {/* Bottom: Features + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", gap: "32px" }}>
            {["✓ Gratis 14 hari", "✓ Tanpa kartu kredit", "✓ Open Source"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.95)",
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 600, color: "rgba(255, 255, 255, 0.7)" }}>
            finmate-ai-brown.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
