// Blog yazılarının küçük ve güvenli Markdown alt kümesi. Çıktı HTML dizesi
// değil bir ağaçtır; React bileşeni onu eleman eleman basar, böylece yazıdaki
// hiçbir metin HTML olarak yorumlanmaz. Desteklenenler yönetim formundaki
// yardım kutusunda listelenir; bu dosya değişirse o liste de güncellenmeli.

import { slugifyTr } from "./blog";

export type Inline =
  | { type: "text"; value: string }
  | { type: "strong"; children: Inline[] }
  | { type: "em"; children: Inline[] }
  | { type: "mark"; children: Inline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: Inline[] };

export type CalloutKind = "not" | "ipucu" | "dikkat" | "onemli";

export type Block =
  | { type: "heading"; level: 2 | 3; id: string; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; paragraphs: Inline[][] }
  | { type: "callout"; kind: CalloutKind; paragraphs: Inline[][] }
  | { type: "image"; src: string; alt: string }
  | { type: "table"; head: Inline[][]; rows: Inline[][][] }
  | { type: "rule" };

export type TocEntry = { id: string; level: 2 | 3; text: string };

/** Yazı içi bağlantılar: http(s), site içi yol, sayfa içi çapa, e-posta. */
export function isSafeHref(value: string): boolean {
  if (/[\u0000-\u0020\u007f\\]/.test(value)) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Görseller yalnız https ya da site içi yoldan gelir. */
export function isSafeImageSrc(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return isSafeHref(value);
  return isSafeHref(value) && value.startsWith("https://");
}

const INLINE_PATTERNS: { type: Inline["type"]; re: RegExp }[] = [
  { type: "code", re: /`([^`\n]+)`/ },
  { type: "link", re: /\[([^\]\n]+)\]\(([^)\s]+)\)/ },
  { type: "strong", re: /\*\*(?=\S)([\s\S]*?\S)\*\*/ },
  { type: "mark", re: /==(?=\S)([\s\S]*?\S)==/ },
  { type: "em", re: /\*(?=[^\s*])([^*]*?[^\s*])\*/ },
];

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let rest = source;

  const pushText = (value: string) => {
    if (!value) return;
    const last = out.at(-1);
    if (last?.type === "text") last.value += value;
    else out.push({ type: "text", value });
  };

  while (rest) {
    let best: { type: Inline["type"]; match: RegExpExecArray } | null = null;
    for (const { type, re } of INLINE_PATTERNS) {
      const match = re.exec(rest);
      if (match && (!best || match.index < best.match.index)) best = { type, match };
    }
    if (!best) {
      pushText(rest);
      break;
    }

    const { type, match } = best;
    pushText(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);

    if (type === "code") out.push({ type: "code", value: match[1] });
    else if (type === "link") {
      const href = match[2];
      const children = parseInline(match[1]);
      if (isSafeHref(href)) out.push({ type: "link", href, children });
      else
        for (const child of children) {
          if (child.type === "text") pushText(child.value);
          else out.push(child);
        }
    } else out.push({ type, children: parseInline(match[1]) } as Inline);
  }

  return out;
}

export function inlineText(nodes: Inline[]): string {
  return nodes
    .map((node) => ("children" in node ? inlineText(node.children) : node.value))
    .join("");
}

const CALLOUT_KINDS: Record<string, CalloutKind> = {
  not: "not",
  ipucu: "ipucu",
  dikkat: "dikkat",
  onemli: "onemli",
};

function calloutKind(marker: string): CalloutKind {
  return CALLOUT_KINDS[slugifyTr(marker)] ?? "not";
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const LIST_ITEM = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const usedIds = new Map<string, number>();
  let i = 0;

  const headingId = (text: string) => {
    const base = slugifyTr(text) || "bolum";
    const seen = usedIds.get(base) ?? 0;
    usedIds.set(base, seen + 1);
    return seen ? `${base}-${seen + 1}` : base;
  };

  const isBlockStart = (line: string, next: string | undefined) =>
    /^#{1,6}\s/.test(line) ||
    /^>/.test(line) ||
    LIST_ITEM.test(line) ||
    /^\s*(-{3,}|\*{3,})\s*$/.test(line) ||
    /^!\[[^\]]*\]\([^)\s]+\)\s*$/.test(line.trim()) ||
    (line.trim().startsWith("|") && next !== undefined && TABLE_SEPARATOR.test(next));

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(trimmed);
    if (heading) {
      // Sayfanın h1'i yazı başlığıdır; gövdedeki # ve ## ikinci düzey olur.
      const level = heading[1].length <= 2 ? 2 : 3;
      const children = parseInline(heading[2]);
      blocks.push({ type: "heading", level, id: headingId(inlineText(children)), children });
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (image) {
      if (isSafeImageSrc(image[2])) blocks.push({ type: "image", alt: image[1].trim(), src: image[2] });
      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      const marker = /^\[!([^\]]+)\]\s*(.*)$/.exec(quoted[0] ?? "");
      if (marker) quoted[0] = marker[2];
      const paragraphs = quoted
        .join("\n")
        .split(/\n\s*\n/)
        .map((chunk) => chunk.split("\n").map((part) => part.trim()).filter(Boolean).join(" "))
        .filter(Boolean)
        .map(parseInline);
      if (marker) blocks.push({ type: "callout", kind: calloutKind(marker[1]), paragraphs });
      else if (paragraphs.length) blocks.push({ type: "quote", paragraphs });
      continue;
    }

    if (trimmed.startsWith("|") && lines[i + 1] !== undefined && TABLE_SEPARATOR.test(lines[i + 1])) {
      const head = splitRow(trimmed).map(parseInline);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = splitRow(lines[i]);
        rows.push(head.map((_, index) => parseInline(cells[index] ?? "")));
        i += 1;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    const first = LIST_ITEM.exec(line);
    if (first) {
      const ordered = Boolean(first[2]);
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i];
        const item = LIST_ITEM.exec(current);
        if (item && Boolean(item[2]) === ordered) {
          items.push(item[3]);
          i += 1;
        } else if (current.trim() && /^\s{2,}/.test(current) && items.length) {
          items[items.length - 1] += ` ${current.trim()}`;
          i += 1;
        } else break;
      }
      blocks.push({ type: "list", ordered, items: items.map((item) => parseInline(item.trim())) });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !(paragraph.length && isBlockStart(lines[i], lines[i + 1]))) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join(" ")) });
  }

  return blocks;
}

export function tableOfContents(blocks: Block[]): TocEntry[] {
  return blocks.flatMap((block) =>
    block.type === "heading" ? [{ id: block.id, level: block.level, text: inlineText(block.children) }] : [],
  );
}
