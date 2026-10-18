const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCaptchaCode(length: number = 4): string {
  let res = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CAPTCHA_CHARS.length);
    res += CAPTCHA_CHARS[idx];
  }
  return res;
}

export function drawCaptchaCanvas(canvas: HTMLCanvasElement | null, code: string, forceTheme?: "light" | "dark") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const isLight = forceTheme
    ? forceTheme === "light"
    : typeof document !== "undefined" && document.documentElement.classList.contains("light");

  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = isLight ? "#F1ECE3" : "#18181B";
  ctx.fillRect(0, 0, w, h);

  // Background subtle noise dots
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = isLight
      ? `rgba(${130 + Math.random() * 70}, ${100 + Math.random() * 60}, ${70 + Math.random() * 50}, ${0.25 + Math.random() * 0.2})`
      : `rgba(${180 + Math.random() * 75}, ${150 + Math.random() * 60}, ${100 + Math.random() * 50}, ${0.15 + Math.random() * 0.25})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Noise curve lines
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = isLight
      ? `rgba(180, 120, 60, ${0.35 + Math.random() * 0.25})`
      : `rgba(229, 196, 159, ${0.25 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.bezierCurveTo(
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h
    );
    ctx.stroke();
  }

  // High contrast characters
  const charWidth = w / (code.length + 0.8);
  const darkPalette = ["#92400E", "#1D4ED8", "#047857", "#B91C1C", "#6D28D9", "#C2410C"];
  const lightPalette = ["#FBBF24", "#93C5FD", "#34D399", "#F472B6", "#E5C49F", "#F97316"];
  const colors = isLight ? darkPalette : lightPalette;

  ctx.font = "bold 21px 'JetBrains Mono', 'Courier New', monospace";
  ctx.textBaseline = "middle";

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    ctx.save();
    const x = charWidth * (i + 0.7);
    const y = h / 2 + (Math.random() * 4 - 2);
    const angle = (Math.random() * 26 - 13) * (Math.PI / 180);

    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = colors[i % colors.length];
    ctx.shadowColor = isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = isLight ? 2 : 4;
    ctx.fillText(ch, -7, 0);
    ctx.restore();
  }
}
