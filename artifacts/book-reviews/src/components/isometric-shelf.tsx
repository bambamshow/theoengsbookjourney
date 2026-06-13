import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import { Search, X } from "lucide-react";

const PALETTES = [
  { bg: "#8b2525", side: "#5a1818", top: "#b03535", text: "#ffe0e0" },
  { bg: "#1a3a7a", side: "#112550", top: "#2a4e9e", text: "#d0daff" },
  { bg: "#1a5e35", side: "#103d22", top: "#247a46", text: "#c8ffd8" },
  { bg: "#5e3a12", side: "#3c250b", top: "#7a4c18", text: "#ffe4c0" },
  { bg: "#4a1a6e", side: "#301248", top: "#60228e", text: "#e8d0ff" },
  { bg: "#5c5c10", side: "#3a3a09", top: "#787814", text: "#faffd0" },
  { bg: "#12535e", side: "#0b363c", top: "#186a78", text: "#d0fafa" },
  { bg: "#6e1a3a", side: "#481224", top: "#8e2248", text: "#ffd0e0" },
  { bg: "#2c2c2c", side: "#1a1a1a", top: "#424242", text: "#f0f0f0" },
  { bg: "#4e2a10", side: "#321b0a", top: "#663818", text: "#ffe0d0" },
  { bg: "#1a4e4e", side: "#0b3232", top: "#226666", text: "#d0ffff" },
  { bg: "#6e4a1a", side: "#483010", top: "#8e6022", text: "#fff0d0" },
];

function getPalette(id: number) {
  return PALETTES[id % PALETTES.length];
}

function getThickness(book: Book): number {
  const reviewLen = book.review?.length ?? 0;
  const hash = ((book.id * 37 + reviewLen * 3) % 36);
  return 28 + hash; // 28–63 px
}

function getBookHeight(book: Book): number {
  const hash = (book.id * 19) % 40;
  return 155 + hash; // 155–195 px
}

function StarRow({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span style={{ color: "#666", fontSize: 11 }}>No rating</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        return (
          <span key={i} style={{ position: "relative", fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "#444" }}>★</span>
            <span
              style={{
                position: "absolute", left: 0, top: 0,
                overflow: "hidden", width: `${fill * 100}%`,
                color: "#e8a020",
              }}
            >★</span>
          </span>
        );
      })}
      <span style={{ color: "#999", fontSize: 11, marginLeft: 3 }}>{rating}/5</span>
    </span>
  );
}

interface TooltipData {
  book: Book;
  x: number;
  y: number;
}

const SIDE_DEPTH = 20;

interface BookItemProps {
  book: Book;
  dimmed: boolean;
  highlighted: boolean;
  onHoverChange: (data: TooltipData | null) => void;
}

function BookItem({ book, dimmed, highlighted, onHoverChange }: BookItemProps) {
  const spineRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const palette = getPalette(book.id);
  const thickness = getThickness(book);
  const height = getBookHeight(book);

  const handleEnter = useCallback(() => {
    if (!spineRef.current) return;
    const rect = spineRef.current.getBoundingClientRect();
    onHoverChange({
      book,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, [book, onHoverChange]);

  const handleLeave = useCallback(() => {
    onHoverChange(null);
  }, [onHoverChange]);

  const opacity = dimmed ? 0.22 : 1;
  const glowColor = highlighted ? palette.bg : "transparent";

  return (
    <motion.div
      ref={spineRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => setLocation(`/book/${book.id}`)}
      whileHover={{ z: 38, y: -20 }}
      initial={{ z: 0, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        cursor: "pointer",
        flexShrink: 0,
        width: thickness,
        height,
        position: "relative",
        transformStyle: "preserve-3d",
        opacity,
        filter: highlighted ? `drop-shadow(0 0 14px ${palette.bg}cc)` : undefined,
        transition: "opacity 0.3s, filter 0.3s",
      }}
    >
      {/* Spine */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(165deg, ${palette.top} 0%, ${palette.bg} 40%, ${palette.side} 100%)`,
          borderRadius: "2px 0 0 2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          boxShadow: "inset -3px 0 8px rgba(0,0,0,0.45), inset 1px 0 4px rgba(255,255,255,0.06)",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Decorative top line */}
        <div style={{
          position: "absolute", top: 8, left: 4, right: 4,
          height: 1, background: `${palette.text}30`,
        }} />
        <div style={{
          position: "absolute", bottom: 8, left: 4, right: 4,
          height: 1, background: `${palette.text}30`,
        }} />
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: palette.text,
            fontSize: Math.max(8, Math.min(11, thickness * 0.38)),
            fontWeight: 700,
            fontFamily: "'Georgia', serif",
            textAlign: "center",
            maxHeight: height - 20,
            overflow: "hidden",
            padding: "0 4px",
            letterSpacing: "0.04em",
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            lineHeight: 1.1,
          }}
        >
          {book.title}
        </span>
      </div>

      {/* Top face */}
      <div
        style={{
          position: "absolute",
          width: thickness,
          height: SIDE_DEPTH,
          top: 0, left: 0,
          transformOrigin: "top center",
          transform: "rotateX(-90deg)",
          background: `linear-gradient(180deg, ${palette.top} 0%, ${palette.bg} 100%)`,
          opacity: 0.85,
          backfaceVisibility: "hidden",
        }}
      />

      {/* Right side face */}
      <div
        style={{
          position: "absolute",
          width: SIDE_DEPTH,
          height,
          top: 0,
          right: -SIDE_DEPTH,
          transformOrigin: "left center",
          transform: "rotateY(90deg)",
          background: `linear-gradient(180deg, ${palette.side} 0%, #0a0a0a 100%)`,
          backfaceVisibility: "hidden",
        }}
      />

      {/* Highlight ring when searching */}
      {highlighted && (
        <div style={{
          position: "absolute", inset: -2,
          border: `2px solid ${palette.top}`,
          borderRadius: 3,
          boxShadow: `0 0 20px ${palette.bg}88`,
          pointerEvents: "none",
        }} />
      )}
    </motion.div>
  );
}

const BOOKS_PER_ROW = 12;

interface IsometricShelfProps {
  books: Book[];
}

export function IsometricShelf({ books }: IsometricShelfProps) {
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const term = search.trim().toLowerCase();

  function matches(b: Book) {
    if (!term) return false;
    return b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term);
  }

  const anyMatch = term && books.some(matches);
  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += BOOKS_PER_ROW) {
    rows.push(books.slice(i, i + BOOKS_PER_ROW));
  }

  const handleHoverChange = useCallback((data: TooltipData | null) => {
    setTooltip(data);
  }, []);

  return (
    <div style={{ padding: "32px 24px 48px", position: "relative" }}>

      {/* Search bar */}
      <div style={{ maxWidth: 440, margin: "0 auto 44px", position: "relative" }}>
        <Search
          style={{
            position: "absolute", left: 14, top: "50%",
            transform: "translateY(-50%)", color: "#666",
            width: 16, height: 16, pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Spotlight a book by title or author…"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 40px",
            color: "#fff",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(220,50,50,0.5)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none",
              cursor: "pointer", color: "#666",
              padding: 0, lineHeight: 0,
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {/* Fixed tooltip (outside 3D context to avoid transform issues) */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.92, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y - 12,
              transform: "translateX(-50%) translateY(-100%)",
              zIndex: 9999,
              width: 220,
              background: "rgba(10,10,14,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "12px 14px",
              pointerEvents: "none",
              boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
            }}
          >
            {tooltip.book.coverUrl && (
              <img
                src={tooltip.book.coverUrl}
                alt={tooltip.book.title}
                style={{
                  width: "100%", height: 90,
                  objectFit: "cover",
                  borderRadius: 6, marginBottom: 10,
                }}
              />
            )}
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.35, marginBottom: 3 }}>
              {tooltip.book.title}
            </div>
            <div style={{ color: "#999", fontSize: 11, marginBottom: 8 }}>
              {tooltip.book.author}
            </div>
            <StarRow rating={tooltip.book.rating} />
            {tooltip.book.finishedAt && (
              <div style={{ color: "#666", fontSize: 10, marginTop: 6 }}>
                Finished {new Date(tooltip.book.finishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </div>
            )}
            {/* Pointer arrow */}
            <div style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              width: 10, height: 10,
              background: "rgba(10,10,14,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderTop: "none", borderLeft: "none",
              transform: "translateX(-50%) rotate(45deg)",
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Shelf scene */}
      {books.length === 0 ? (
        <div style={{ textAlign: "center", color: "#555", padding: 80, fontSize: 15 }}>
          The shelf is empty. Add some books!
        </div>
      ) : (
        <div
          style={{
            perspective: "1100px",
            perspectiveOrigin: "50% 15%",
            width: "100%",
          }}
        >
          <div
            style={{
              transform: "rotateX(14deg) rotateY(-10deg)",
              transformStyle: "preserve-3d",
              display: "inline-block",
              minWidth: "100%",
            }}
          >
            {rows.map((row, rowIdx) => {
              const maxHeight = Math.max(...row.map(getBookHeight));

              return (
                <div key={rowIdx} style={{ marginBottom: 8 }}>
                  {/* Books row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: 4,
                      paddingLeft: 24,
                      paddingRight: 24,
                      transformStyle: "preserve-3d",
                      height: maxHeight + 8,
                    }}
                  >
                    {/* Shelf back wall */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0, right: 0,
                        bottom: 0, height: maxHeight + 8,
                        background: "linear-gradient(180deg, #0e0e0e 0%, #1a1410 100%)",
                        transform: "translateZ(-2px)",
                        zIndex: 0,
                      }}
                    />
                    {row.map((book) => (
                      <BookItem
                        key={book.id}
                        book={book}
                        dimmed={!!(anyMatch && !matches(book))}
                        highlighted={!!(anyMatch && matches(book))}
                        onHoverChange={handleHoverChange}
                      />
                    ))}
                  </div>

                  {/* Shelf plank */}
                  <div style={{ position: "relative", transformStyle: "preserve-3d" }}>
                    {/* Top surface of plank */}
                    <div
                      style={{
                        height: 14,
                        background: "linear-gradient(180deg, #6b4a20 0%, #4a3010 50%, #3a2008 100%)",
                        boxShadow: "0 2px 0 #2a1608, 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Wood grain lines */}
                      {[0, 60, 130, 210, 300, 400, 520].map((x) => (
                        <div
                          key={x}
                          style={{
                            position: "absolute",
                            left: x, top: 0, bottom: 0,
                            width: 1,
                            background: "rgba(0,0,0,0.2)",
                          }}
                        />
                      ))}
                    </div>
                    {/* Front edge of plank */}
                    <div
                      style={{
                        height: 8,
                        background: "linear-gradient(180deg, #3a2008 0%, #1e1004 100%)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Bottom shelf support decorations */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 48px 0",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 18, height: 22,
                  background: "linear-gradient(180deg, #4a3010 0%, #2a1808 100%)",
                  borderRadius: "0 0 4px 4px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
