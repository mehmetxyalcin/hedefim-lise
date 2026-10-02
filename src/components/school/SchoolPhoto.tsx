"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";
import { FOCUS } from "./doc-styles";

// Okulun fotoğrafı sayfada küçük, çerçeveli bir künye resmi olarak durur;
// tıklanınca tam ekran görüntüleyici açılır. Görüntüleyicide dokunma/tık ile
// yakınlaştırma, tekerlek ve iki parmakla ölçekleme, sürükleyerek kaydırma
// ve klavye (+, −, 0, oklar) çalışır.

type Props = {
  images: string[];
  name: string;
};

const MIN = 1;
const MAX = 4;
const TAP_ZOOM = 2.5;
/** Küçük kaynak görüntü sahneye sığdırılırken en fazla bu kadar büyütülür. */
const MAX_UPSCALE = 2;

type View = { s: number; x: number; y: number };
const RESET: View = { s: 1, x: 0, y: 0 };

export function SchoolPhoto({ images, name }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>(RESET);
  const [gesture, setGesture] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // Dokunuşun başladığı öğe: pointer yakalandıktan sonra pointerup hedefi
  // hep sahne olur, o yüzden basılan yer burada saklanır.
  const start = useRef<{
    view: View;
    dist: number;
    mid: { x: number; y: number };
    moved: boolean;
    onImage: boolean;
  } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null);
  const many = images.length > 1;
  const src = images[index];

  // Görüntü sahneye sığacak boyutta çizilir; küçük fotoğraflar da ekranı
  // doldursun diye (en fazla iki katına kadar) büyütülür.
  const fit =
    natural && stageSize && stageSize.w > 0
      ? (() => {
          const gutter = stageSize.w < 640 ? 16 : 56;
          const scale = Math.min(
            (stageSize.w - gutter * 2) / natural.w,
            stageSize.h / natural.h,
            MAX_UPSCALE,
          );
          return { w: Math.round(natural.w * scale), h: Math.round(natural.h * scale) };
        })()
      : null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ w: width, h: height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Görüntü sahneden taşmadıkça kaydırılamaz; taşan kısım kadar kayar.
  const clamp = useCallback((next: View): View => {
    const stage = stageRef.current;
    const img = imgRef.current;
    const s = Math.min(MAX, Math.max(MIN, next.s));
    if (!stage || !img || s === 1) return { s, x: 0, y: 0 };
    const maxX = Math.max(0, (img.offsetWidth * s - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * s - stage.clientHeight) / 2);
    return {
      s,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }, []);

  // İmlecin altındaki nokta ölçek değişince yerinde kalır.
  const zoomAt = useCallback(
    (from: View, s: number, clientX?: number, clientY?: number): View => {
      const stage = stageRef.current;
      if (!stage) return clamp({ ...from, s });
      const rect = stage.getBoundingClientRect();
      const px = clientX == null ? 0 : clientX - (rect.left + rect.width / 2);
      const py = clientY == null ? 0 : clientY - (rect.top + rect.height / 2);
      const ns = Math.min(MAX, Math.max(MIN, s));
      const ux = (px - from.x) / from.s;
      const uy = (py - from.y) / from.s;
      return clamp({ s: ns, x: px - ux * ns, y: py - uy * ns });
    },
    [clamp],
  );

  const open = () => {
    setView(RESET);
    // Görüntü hidrasyondan önce yüklendiyse onLoad kaçmış olabilir.
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) {
      setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    }
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };

  const close = () => dialogRef.current?.close();

  const go = (step: number) => {
    setView(RESET);
    setNatural(null);
    setIndex((i) => (i + step + images.length) % images.length);
  };

  // React'in wheel dinleyicisi pasif; sayfa kaydırmasını durdurmak için elle bağlanır.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0025));
      setView((v) => zoomAt(v, v.s * factor, event.clientX, event.clientY));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Sahnedeki önceki/sonraki düğmeleri kendi tıklamalarını alır.
    if (event.button !== 0 || (event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pts = [...pointers.current.values()];
    const mid =
      pts.length >= 2
        ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
        : { x: event.clientX, y: event.clientY };
    const dist = pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    start.current = {
      view,
      dist,
      mid,
      moved: pts.length >= 2,
      onImage: event.target === imgRef.current,
    };
    setGesture(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !start.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pts = [...pointers.current.values()];
    const s0 = start.current;
    if (pts.length >= 2 && s0.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const scaled = zoomAt(s0.view, s0.view.s * (dist / s0.dist), s0.mid.x, s0.mid.y);
      setView(clamp({ ...scaled, x: scaled.x + mid.x - s0.mid.x, y: scaled.y + mid.y - s0.mid.y }));
      return;
    }
    const dx = event.clientX - s0.mid.x;
    const dy = event.clientY - s0.mid.y;
    if (!s0.moved && Math.hypot(dx, dy) > 4) s0.moved = true;
    if (s0.moved && s0.view.s > 1) {
      setView(clamp({ ...s0.view, x: s0.view.x + dx, y: s0.view.y + dy }));
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    const s0 = start.current;
    if (pointers.current.size === 0) {
      setGesture(false);
      start.current = null;
      // Sürüklemeden bırakılan tek dokunuş: yakınlaştır ya da sığdır.
      if (s0 && !s0.moved && s0.onImage) {
        setView((v) => (v.s > 1 ? RESET : zoomAt(v, TAP_ZOOM, event.clientX, event.clientY)));
      } else if (s0 && !s0.moved) {
        // Görüntünün dışına dokunmak görüntüleyiciyi kapatır.
        close();
      }
    } else {
      // İki parmaktan biri kalktı: kalan parmakla kaydırma yeni noktadan sürer.
      const [rest] = [...pointers.current.values()];
      start.current = { view, dist: 0, mid: rest, moved: true, onImage: false };
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    const step = 60;
    switch (event.key) {
      case "+":
      case "=":
        setView((v) => zoomAt(v, v.s * 1.5));
        break;
      case "-":
      case "_":
        setView((v) => zoomAt(v, v.s / 1.5));
        break;
      case "0":
        setView(RESET);
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (view.s === 1 && many) go(event.key === "ArrowLeft" ? -1 : 1);
        else setView((v) => clamp({ ...v, x: v.x + (event.key === "ArrowLeft" ? step : -step) }));
        break;
      case "ArrowUp":
      case "ArrowDown":
        setView((v) => clamp({ ...v, y: v.y + (event.key === "ArrowUp" ? step : -step) }));
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const percent = Math.round(view.s * 100);
  const toolButton = cn(
    "flex h-11 w-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/15 disabled:opacity-35 disabled:hover:bg-transparent",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30",
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`Fotoğrafı büyüt: ${name}`}
        aria-haspopup="dialog"
        className={cn(
          "group relative block w-24 shrink-0 rounded-xl border border-[var(--line)] bg-[var(--doc-panel)] p-1 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-[var(--teal)]/40 hover:shadow-md sm:w-32 lg:w-36",
          FOCUS,
        )}
      >
        <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[var(--doc-ground)]">
          <Image
            src={images[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 144px, (min-width: 640px) 128px, 96px"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
            loading="eager"
          />
        </span>
        <span
          aria-hidden
          className="absolute right-2 bottom-2 flex h-6 w-6 items-center justify-center rounded-md bg-[var(--doc-panel)]/95 text-[var(--ink)] shadow-sm transition-colors group-hover:bg-[var(--teal)] group-hover:text-white"
        >
          <ZoomIn className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={`${name} fotoğrafı`}
        onClose={() => {
          document.documentElement.style.overflow = "";
          setView(RESET);
        }}
        onKeyDown={onKeyDown}
        className="photo-viewer m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-white"
      >
        <div className="photo-viewer-frame flex h-full flex-col">
          <div className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
            <p className="min-w-0 pt-2.5 font-display text-[15px] leading-snug font-bold text-balance sm:text-base">
              {name}
              {many && (
                <span className="ml-3 font-mono text-[11px] font-medium tracking-[0.14em] text-white/60 tabular">
                  {index + 1} / {images.length}
                </span>
              )}
            </p>
            <button type="button" onClick={close} aria-label="Kapat" className={toolButton}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={cn(
              "relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden select-none",
              view.s > 1 ? (gesture ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={src}
              src={src}
              alt={name}
              draggable={false}
              decoding="async"
              onLoad={(event) =>
                setNatural({
                  w: event.currentTarget.naturalWidth,
                  h: event.currentTarget.naturalHeight,
                })
              }
              className={cn(
                "rounded-lg object-contain will-change-transform",
                fit ? "max-w-none" : "max-h-full max-w-[calc(100%-2rem)]",
                !gesture && "transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
              )}
              style={{
                width: fit?.w,
                height: fit?.h,
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
              }}
            />
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Önceki fotoğraf"
                  className={cn(toolButton, "absolute top-1/2 left-2 -translate-y-1/2 bg-black/30")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Sonraki fotoğraf"
                  className={cn(toolButton, "absolute top-1/2 right-2 -translate-y-1/2 bg-black/30")}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5">
            <div
              role="group"
              aria-label="Yakınlaştırma"
              className="flex items-center gap-1 rounded-2xl border border-white/15 bg-black/35 p-1"
            >
              <button
                type="button"
                onClick={() => setView((v) => zoomAt(v, v.s / 1.5))}
                disabled={view.s <= MIN}
                aria-label="Uzaklaştır"
                className={toolButton}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span
                aria-live="polite"
                className="w-14 text-center font-mono text-xs font-medium tracking-[0.08em] tabular"
              >
                %{percent}
              </span>
              <button
                type="button"
                onClick={() => setView((v) => zoomAt(v, v.s * 1.5))}
                disabled={view.s >= MAX}
                aria-label="Yakınlaştır"
                className={toolButton}
              >
                <Plus className="h-5 w-5" />
              </button>
              <span aria-hidden className="mx-1 h-6 w-px bg-white/15" />
              <button
                type="button"
                onClick={() => setView(RESET)}
                disabled={view.s === 1}
                aria-label="Sığdır"
                className={toolButton}
              >
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            </div>
            <p className="text-center font-mono text-[10px] font-medium tracking-[0.14em] text-white/55 uppercase">
              <span className="sm:hidden">Dokunun ya da iki parmakla büyütün</span>
              <span className="hidden sm:inline">Tıklayın ya da tekerlekle büyütün · sürükleyerek gezinin</span>
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
