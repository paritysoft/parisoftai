import { ImageResponse } from "next/og";

export const alt = "ParitySoft AI — Mobile App & Software Development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 85% 15%, #4c1d95 0%, transparent 45%), radial-gradient(circle at 10% 90%, #312e81 0%, transparent 50%), #090F1E",
          color: "#F8FAFC",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "flex", flexDirection: "column", justifyContent: "center", padding: 12, gap: 8 }}>
            <div style={{ width: 22, height: 8, background: "#fff", borderRadius: 4 }} />
            <div style={{ width: 22, height: 8, background: "#fff", borderRadius: 4, marginLeft: 10, opacity: 0.85 }} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>ParitySoft AI</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>We Build Digital Products That Make an Impact.</div>
          <div style={{ fontSize: 28, color: "#CBD5E1" }}>Mobile, desktop and AI-powered software development</div>
        </div>
      </div>
    ),
    size,
  );
}
