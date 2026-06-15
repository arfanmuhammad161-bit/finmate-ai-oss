import { ImageResponse } from "next/og";

export const runtime = "nodejs";
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
          justifyContent: "center",
          padding: "80px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand at top */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: 900,
            }}
          >
            F
          </div>
          <div style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-1px" }}>
            FinMate AI
          </div>
        </div>

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "rgba(255, 255, 255, 0.18)",
            borderRadius: "100px",
            padding: "10px 24px",
            width: "fit-content",
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "30px",
          }}
        >
          <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "#4ade80" }} />
          Early Access · Beta Terbuka
        </div>

        {/* Main headline */}
        <div
          style={{
            fontSize: "92px",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-3px",
            marginBottom: "24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>Catat keuangan</div>
          <div style={{ color: "#fef3c7" }}>semudah chat WA.</div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            color: "rgba(255, 255, 255, 0.9)",
            lineHeight: 1.3,
            marginBottom: "50px",
            maxWidth: "950px",
          }}
        >
          AI yang catat pengeluaran Anda lewat Telegram, foto struk, atau voice note.
        </div>

        {/* Bottom features row */}
        <div style={{ display: "flex", gap: "40px", fontSize: "24px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "26px" }}>✓</div>
            Gratis 14 hari
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "26px" }}>✓</div>
            Tanpa kartu kredit
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "26px" }}>✓</div>
            Open Source
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
