// Tek seferlik: admin dosyalarındaki slate/gray/blue Tailwind renklerini
// panelin admin-* renklerine, büyük köşe ve gölgeyi panel ölçüsüne çevirir.
// "gradient" içeren satırlara dokunmaz: okul renk sınıfları veritabanına yazılan veridir.
// Kullanım: node scripts/admin-restyle.mjs <dosya...>
import { readFileSync, writeFileSync } from "node:fs";

const neutral = {
  50: "admin-ground", 100: "admin-line-soft", 200: "admin-line", 300: "admin-line-strong",
  400: "admin-faint", 500: "admin-muted", 600: "admin-body", 700: "admin-body",
  800: "admin-ink", 900: "admin-ink",
};
const accent = {
  50: "admin-tint", 100: "admin-tint", 200: "admin-accent-soft", 300: "admin-accent-soft",
  400: "admin-accent", 500: "admin-accent", 600: "admin-accent", 700: "admin-accent-deep",
  800: "admin-accent-deep", 900: "admin-accent-deep",
};
const MAP = { slate: neutral, gray: neutral, blue: accent };
const COLOR = /\b(slate|gray|blue)-(50|100|200|300|400|500|600|700|800|900)\b/g;

function restyleLine(line) {
  if (line.includes("gradient")) return line;
  return line
    .replace(COLOR, (_, color, shade) => MAP[color][shade])
    .replace(/\brounded-(2xl|3xl)\b/g, "rounded-xl")
    .replace(/\bshadow-sm\b/g, "shadow-admin-card")
    .replace(/\bfont-extrabold\b/g, "font-bold");
}

for (const file of process.argv.slice(2)) {
  const before = readFileSync(file, "utf8");
  const after = before.split("\n").map(restyleLine).join("\n");
  if (after !== before) {
    writeFileSync(file, after);
    console.log(`restyled ${file}`);
  }
}
