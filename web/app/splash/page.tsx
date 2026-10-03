// Splash: azzurro ground, app icon centred, «Benvenuto». Tap anywhere to start.
export default function Splash() {
  return (
    <a
      href="/?demo=1"
      aria-label="GuidaMI, start"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#3AC6F4",
        color: "#212121",
        textDecoration: "none",
        borderRadius: "inherit",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={112} height={112} style={{ borderRadius: 28, boxShadow: "0 12px 32px rgba(0,0,0,.18)" }} />
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em" }}>
        Guida<b style={{ fontWeight: 800 }}>MI</b>
      </div>
      <div style={{ textAlign: "center", lineHeight: 1.4 }}>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Benvenuto</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Welcome to Milan · Guido, l&apos;assistente del Comune</div>
      </div>
    </a>
  );
}
