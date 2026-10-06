import Link from "next/link";
import { cn } from "@/lib/cn";
import { parseMarkdown, type Block, type CalloutKind, type Inline } from "@/lib/blog-markdown";
import { FOCUS } from "@/components/school/doc-styles";

// Soru-cevap yanıtlarının belge dünyasındaki (.landing) okuma metni. Yanıt
// Markdown'ı ağaca çevrilir ve eleman eleman basılır; hiçbir yanıt HTML olarak
// yorumlanmaz. Blogun gövdesiyle aynı alt küme, ama kılavuzun dilinde:
// Source Serif metin, teal madde imleri, mono not etiketleri, hairline tablo.

const LINK = `rounded-sm font-semibold text-[var(--teal)] underline decoration-[color-mix(in_srgb,var(--teal)_35%,transparent)] decoration-1 underline-offset-4 transition-colors hover:text-[var(--teal-deep)] hover:decoration-[var(--teal)] ${FOCUS}`;

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "strong":
        return (
          <strong key={index} className="font-semibold text-[var(--ink)]">
            <InlineNodes nodes={node.children} />
          </strong>
        );
      case "em":
        return (
          <em key={index}>
            <InlineNodes nodes={node.children} />
          </em>
        );
      case "mark":
        return (
          <mark key={index} className="rounded-[3px] bg-[var(--teal-tint)] px-0.5 text-[var(--ink)]">
            <InlineNodes nodes={node.children} />
          </mark>
        );
      case "code":
        return (
          <code
            key={index}
            className="rounded-[4px] border border-[var(--line)] bg-[var(--doc-ground)] px-1 py-px font-mono text-[0.85em] text-[var(--ink)]"
          >
            {node.value}
          </code>
        );
      case "link": {
        const children = <InlineNodes nodes={node.children} />;
        // Sayfa içi çapa düz <a>: tarayıcı hashchange üretir, açılır soru açılır.
        if (node.href.startsWith("#"))
          return (
            <a key={index} href={node.href} className={LINK}>
              {children}
            </a>
          );
        if (node.href.startsWith("/"))
          return (
            <Link key={index} href={node.href} className={LINK}>
              {children}
            </Link>
          );
        return (
          <a key={index} href={node.href} className={LINK} target="_blank" rel="noopener noreferrer">
            {children}
            <span className="sr-only"> (yeni sekmede açılır)</span>
          </a>
        );
      }
    }
  });
}

const CALLOUT_LABEL: Record<CalloutKind, string> = {
  not: "Not",
  ipucu: "İpucu",
  dikkat: "Dikkat",
  onemli: "Önemli",
};

type Props = {
  /** Ham yanıt (Markdown alt kümesi; eski düz metin paragraf olarak okunur). */
  answer?: string;
  /** Önceden ayrıştırılmış bloklar (verildiyse answer yok sayılır). */
  blocks?: Block[];
  /** Yanıt içindeki ## başlığın düzeyi; altındaki ### bir alt düzey. */
  headingLevel?: 3 | 4;
  className?: string;
};

export function AnswerBody({ answer = "", blocks, headingLevel = 3, className }: Props) {
  const list = blocks ?? parseMarkdown(answer);
  if (list.length === 0) return null;

  return (
    <div className={cn("text-[1.0625rem] leading-[1.7] text-[var(--ink-soft)]", className)}>
      {list.map((block, index) => {
        const spacing = index === 0 ? "" : "mt-4";
        switch (block.type) {
          case "heading": {
            // Yanıt başlıklarına kimlik verilmez: bir sayfada birçok yanıt var.
            const Tag = (block.level === 2 ? `h${headingLevel}` : `h${headingLevel + 1}`) as "h3" | "h4" | "h5";
            return (
              <Tag
                key={index}
                className={cn(
                  "font-display leading-snug font-bold tracking-tight text-[var(--ink)]",
                  block.level === 2 ? "text-[1.0625rem]" : "text-base",
                  index === 0 ? "" : "mt-6",
                )}
              >
                <InlineNodes nodes={block.children} />
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={index} className={cn(spacing, "max-w-[68ch]")}>
                <InlineNodes nodes={block.children} />
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index} className={cn(spacing, "max-w-[68ch] space-y-2")}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="relative pl-7">
                    {block.ordered ? (
                      <span
                        aria-hidden="true"
                        className="tabular absolute top-[0.32em] left-0 font-mono text-[12px] font-semibold text-[var(--teal)]"
                      >
                        {itemIndex + 1}.
                      </span>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute top-[0.68em] left-1 h-1.5 w-1.5 rounded-[1px] bg-[var(--teal)]"
                      />
                    )}
                    <InlineNodes nodes={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote
                key={index}
                className={cn(spacing, "max-w-[68ch] border-l-2 border-[var(--teal)] pl-4 text-[var(--ink)] italic")}
              >
                {block.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className={paragraphIndex ? "mt-2" : ""}>
                    <InlineNodes nodes={paragraph} />
                  </p>
                ))}
              </blockquote>
            );
          case "callout": {
            const strong = block.kind === "dikkat" || block.kind === "onemli";
            return (
              <aside
                key={index}
                aria-label={CALLOUT_LABEL[block.kind]}
                className={cn(
                  index === 0 ? "" : "mt-5",
                  "max-w-[68ch] rounded-xl border border-[var(--line)] bg-[var(--doc-ground)] px-4 py-3.5 text-[1rem] leading-relaxed",
                  strong && "border-l-[3px] border-l-[var(--teal)]",
                )}
              >
                <p className="mb-1.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-[var(--teal)] uppercase">
                  {CALLOUT_LABEL[block.kind]}
                </p>
                {block.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className={paragraphIndex ? "mt-2" : ""}>
                    <InlineNodes nodes={paragraph} />
                  </p>
                ))}
              </aside>
            );
          }
          case "image":
            return (
              // Yanıttaki görsel yöneticinin verdiği güvenli adresten gelir.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={block.src}
                alt={block.alt}
                loading="lazy"
                decoding="async"
                className={cn(spacing, "h-auto w-full max-w-[68ch] rounded-xl border border-[var(--line)] bg-[var(--doc-ground)]")}
              />
            );
          case "table":
            return (
              <div
                key={index}
                role="region"
                aria-label="Tablo"
                tabIndex={0}
                className={cn(spacing, "-mx-1 overflow-x-auto rounded-md px-1", FOCUS)}
              >
                <table className="w-full min-w-[22rem] border-collapse text-[0.9375rem] leading-snug">
                  <thead>
                    <tr className="border-b border-[var(--ink)] text-left">
                      {block.head.map((cell, cellIndex) => (
                        <th
                          key={cellIndex}
                          scope="col"
                          className="py-2 pr-4 font-mono text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)] uppercase"
                        >
                          <InlineNodes nodes={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-[var(--line)] align-top">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={cn(
                              "tabular py-2 pr-4",
                              cellIndex === 0 ? "font-display font-bold text-[var(--ink)]" : "",
                            )}
                          >
                            <InlineNodes nodes={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "rule":
            return <hr key={index} className="my-6 max-w-[68ch] border-[var(--line)]" />;
        }
      })}
    </div>
  );
}
