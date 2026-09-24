import Link from "next/link";
import { CircleAlert, Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Block, CalloutKind, Inline } from "@/lib/blog-markdown";

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.value;
      case "strong":
        return (
          <strong key={index} className="font-semibold text-blog-ink">
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
          <mark key={index} className="blog-mark">
            <InlineNodes nodes={node.children} />
          </mark>
        );
      case "code":
        return (
          <code key={index} className="rounded-[3px] bg-blog-sheet px-1.5 py-0.5 font-mono text-[0.85em] text-blog-ink">
            {node.value}
          </code>
        );
      case "link": {
        const internal = node.href.startsWith("/") || node.href.startsWith("#");
        const children = <InlineNodes nodes={node.children} />;
        return internal ? (
          <Link key={index} href={node.href} className="blog-link text-blog-ink">
            {children}
          </Link>
        ) : (
          <a key={index} href={node.href} className="blog-link text-blog-ink" target="_blank" rel="noopener noreferrer">
            {children}
            <span className="sr-only"> (yeni sekmede açılır)</span>
          </a>
        );
      }
    }
  });
}

const callouts: Record<CalloutKind, { label: string; icon: LucideIcon; box: string; icon_: string }> = {
  not: { label: "Not", icon: Info, box: "bg-blog-sheet text-blog-ink-soft", icon_: "text-blog-ink" },
  ipucu: { label: "İpucu", icon: Lightbulb, box: "bg-blog-sheet text-blog-ink-soft", icon_: "text-blog-ink" },
  dikkat: { label: "Dikkat", icon: TriangleAlert, box: "bg-blog-lemon text-blog-ink", icon_: "text-blog-ink" },
  onemli: { label: "Önemli", icon: CircleAlert, box: "bg-blog-ink text-white/90", icon_: "text-blog-lemon" },
};

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="text-[1.125rem] leading-[1.75] text-blog-ink-soft sm:text-[1.1875rem]">
      {blocks.map((block, index) => {
        const first = index === 0;
        switch (block.type) {
          case "heading":
            return block.level === 2 ? (
              <h2
                key={index}
                id={block.id}
                className={cn(
                  "scroll-mt-28 border-t border-blog-ink pt-5 font-blog-display text-[1.625rem] leading-tight font-bold tracking-[-0.02em] text-balance text-blog-ink sm:text-[1.875rem]",
                  first ? "mt-0" : "mt-14",
                  "mb-5",
                )}
              >
                <InlineNodes nodes={block.children} />
              </h2>
            ) : (
              <h3
                key={index}
                id={block.id}
                className="mt-10 mb-3 scroll-mt-28 font-blog-display text-[1.25rem] leading-snug font-bold tracking-[-0.015em] text-blog-ink"
              >
                <InlineNodes nodes={block.children} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className={cn("mb-6", first && "text-[1.25rem] leading-[1.7] text-blog-ink sm:text-[1.3125rem]")}>
                <InlineNodes nodes={block.children} />
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag key={index} className="mb-7 space-y-3">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="relative pl-10">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 font-blog-display text-blog-ink",
                        block.ordered
                          ? "top-[0.3em] flex h-6 w-6 items-center justify-center rounded-[3px] bg-blog-lemon text-[0.8125rem] font-bold tabular-nums"
                          : "top-[0.82em] h-[2px] w-4 bg-blog-ink",
                      )}
                    >
                      {block.ordered ? itemIndex + 1 : null}
                    </span>
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
                className="relative my-10 pl-10 font-blog-reading text-[1.3125rem] leading-[1.6] text-blog-ink italic sm:text-[1.4375rem]"
              >
                <span aria-hidden="true" className="absolute top-[-0.2em] left-0 font-blog-display text-[3.25rem] leading-none font-extrabold text-blog-ink not-italic">
                  “
                </span>
                {block.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="mb-3 last:mb-0">
                    <InlineNodes nodes={paragraph} />
                  </p>
                ))}
              </blockquote>
            );
          case "callout": {
            const callout = callouts[block.kind];
            const Icon = callout.icon;
            return (
              <aside
                key={index}
                aria-label={callout.label}
                className={cn("my-9 rounded-[4px] px-5 py-5 text-[1.0625rem] leading-[1.7] sm:px-7 sm:py-6", callout.box)}
              >
                <p className="mb-2 flex items-center gap-2 font-blog-display text-[0.8125rem] font-bold tracking-[0.06em] uppercase">
                  <Icon aria-hidden="true" className={cn("h-4 w-4", callout.icon_)} strokeWidth={2.25} />
                  {callout.label}
                </p>
                {block.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="mb-3 last:mb-0">
                    <InlineNodes nodes={paragraph} />
                  </p>
                ))}
              </aside>
            );
          }
          case "image":
            return (
              // Yazı içi görseller yazarın verdiği adresten, olduğu gibi gelir.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index}
                src={block.src}
                alt={block.alt}
                loading="lazy"
                decoding="async"
                className="my-10 h-auto w-full rounded-[4px] bg-blog-sheet"
              />
            );
          case "table":
            return (
              <div key={index} className="blog-scroll my-9 overflow-x-auto" role="region" aria-label="Tablo" tabIndex={0}>
                <table className="w-full min-w-[28rem] border-collapse font-blog-display text-[0.9375rem] leading-snug">
                  <thead>
                    <tr className="border-b-2 border-blog-ink text-left">
                      {block.head.map((cell, cellIndex) => (
                        <th key={cellIndex} scope="col" className="py-3 pr-5 font-bold text-blog-ink">
                          <InlineNodes nodes={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-blog-line align-top">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className={cn("py-3 pr-5 tabular-nums", cellIndex === 0 ? "font-semibold text-blog-ink" : "text-blog-ink-soft")}
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
            return (
              <div key={index} className="my-12 flex justify-center gap-2" aria-hidden="true">
                {[0, 1, 2].map((dot) => (
                  <span key={dot} className="h-1.5 w-1.5 rounded-full bg-blog-ink" />
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}
