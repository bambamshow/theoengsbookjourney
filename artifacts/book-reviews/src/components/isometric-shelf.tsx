import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { Book } from "@/lib/local-store";
import { Search, X } from "lucide-react";

const PALETTES = [
  { bg: "#8b2525", side: "#5a1818", top: "#c04040", text: "#ffe0e0" },
  { bg: "#1a3a7a", side: "#112550", top: "#3060b0", text: "#d0daff" },
  { bg: "#1a5e35", side: "#103d22", top: "#2e8a4e", text: "#c8ffd8" },
  { bg: "#5e3a12", side: "#3c250b", top: "#8a5820", text: "#ffe4c0" },
  { bg: "#4a1a6e", side: "#301248", top: "#6e2ea0", text: "#e8d0ff" },
  { bg: "#5c5c10", side: "#3a3a09", top: "#888814", text: "#faffd0" },
  { bg: "#12535e", side: "#0b363c", top: "#1a7888", text: "#d0fafa" },
  { bg: "#6e1a3a", side: "#481224", top: "#9e2e5a", text: "#ffd0e0" },
  { bg: "#2c2c2c", side: "#1a1a1a", top: "#484848", text: "#f0f0f0" },
  { bg: "#4e2a10", side: "#321b0a", top: "#724020", text: "#ffe0d0" },
  { bg: "#1a4e4e", side: "#0b3232", top: "#227272", text: "#d0ffff" },
  { bg: "#6e4a1a", side: "#483010", top: "#9e6e28", text: "#fff0d0" },
];

function getPalette(id: number) {
  return PALETTES[id % PALETTES.length];
}

type BookWithPages = Book & { pages?: number | null };

function getThickness(book: BookWithPages): number {
  const pages = book.pages;
  if (pages && pages > 0) {
    // 100 pages → ~22px, 350 pages → ~31px, 700 pages → ~44px, 1200+ pages → ~75px
    const w = Math.round(18 + pages * 0.046);
    return Math.min(Math.max(w, 22), 80);
  }
  // Fallback: vary by id so books look different
  return 28 + (book.id * 11) % 28; // 28–55px
}

function getBookHeight(book: Book): number {
  // 25% larger than before: range 194–244px
  const hash = (book.id * 19) % 50;
  return 194 + hash;
}

function StarRow({ rating }: { rating: number | null | undefined }) {
  if (!rating) return <span style={{ color: "#666", fontSize: 11 }}>No rating</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        return (
          <span key={i} style={{ position: "relative", fontSize: 13, lineHeight: 1 }}>
            <span style={{ color: "#3a3a3a" }}>★</span>
            <span style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", width: `${fill * 100}%`, color: "#e8a020" }}>★</span>
          </span>
        );
      })}
      <span style={{ color: "#888", fontSize: 11, marginLeft: 3 }}>{rating}/5</span>
    </span>
  );
}

interface TooltipData { book: BookWithPages; x: number; y: number; }

const SIDE_W = 6; // width of the right-side depth strip
const BOOKS_PER_ROW = 8;
const MIN_ROWS = 4;

interface BookItemProps {
  book: BookWithPages;
  dimmed: boolean;
  highlighted: boolean;
  onHoverChange: (data: TooltipData | null) => void;
}

function BookItem({ book, dimmed, highlighted, onHoverChange }: BookItemProps) {
  const [, setLocation] = useLocation();
  const palette = getPalette(book.id);
  const thickness = getThickness(book);
  const height = getBookHeight(book);
  const fontSize = Math.max(8, Math.min(12, thickness * 0.32));

  const handleEnter = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onHoverChange({ book, x: rect.left + rect.width / 2, y: rect.top });
  }, [book, onHoverChange]);

  const handleLeave = useCallback(() => {
    onHoverChange(null);
  }, [onHoverChange]);

  return (
    <motion.div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => setLocation(`/book/${book.id}`)}
      whileHover={{ y: -22 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        cursor: "pointer",
        flexShrink: 0,
        display: "flex",
        alignItems: "stretch",
        height,
        opacity: dimmed ? 0.18 : 1,
        transition: "opacity 0.3s",
        filter: highlighted ? `drop-shadow(0 0 10px ${palette.bg}cc) drop-shadow(0 0 22px ${palette.bg}66)` : undefined,
      }}
    >
      {/* Spine face */}
      <div
        style={{
          width: thickness,
          height: "100%",
          background: `linear-gradient(175deg, ${palette.top} 0%, ${palette.bg} 35%, ${palette.side} 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          borderRadius: "2px 0 0 2px",
          boxShadow: "inset -1px 0 0 rgba(0,0,0,0.3)",
        }}
      >
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `${palette.top}cc` }} />
        {/* Bottom accent line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.4)" }} />
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: palette.text,
            fontSize,
            fontWeight: 700,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textAlign: "center",
            maxHeight: height - 16,
            overflow: "hidden",
            padding: "0 3px",
            letterSpacing: "0.04em",
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            lineHeight: 1.15,
            userSelect: "none",
          }}
        >
          {book.title}
        </span>
      </div>

      {/* Right-side depth strip */}
      <div
        style={{
          width: SIDE_W,
          height: "100%",
          background: `linear-gradient(180deg, ${palette.side} 0%, #080808 100%)`,
          borderRadius: "0 2px 2px 0",
          flexShrink: 0,
          boxShadow: "2px 0 6px rgba(0,0,0,0.4)",
        }}
      />
    </motion.div>
  );
}

interface IsometricShelfProps {
  books: BookWithPages[];
}

export function IsometricShelf({ books }: IsometricShelfProps) {
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const term = search.trim().toLowerCase();
  function matches(b: BookWithPages) {
    if (!term) return false;
    return b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term);
  }
  const anyMatch = term && books.some(matches);

  // Split into rows, always at least MIN_ROWS rows shown
  const rows: (BookWithPages | null)[][] = [];
  for (let i = 0; i < books.length; i += BOOKS_PER_ROW) {
    rows.push(books.slice(i, i + BOOKS_PER_ROW));
  }
  while (rows.length < MIN_ROWS) rows.push([]);

  const handleHoverChange = useCallback((data: TooltipData | null) => {
    setTooltip(data);
  }, []);

  return (
    <div style={{ padding: "28px 0 48px", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Search bar */}
      <div style={{ width: "100%", maxWidth: 800, marginBottom: 36, padding: "0 16px", boxSizing: "border-box" }}>
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#555", width: 16, height: 16, pointerEvents: "none" }} />
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
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(220,50,50,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#666", lineHeight: 0, padding: 0 }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Fixed tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, scale: 0.93, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "fixed",
              left: tooltip.x,
              top: tooltip.y - 10,
              transform: "translateX(-50%) translateY(-100%)",
              zIndex: 9999,
              width: 220,
              background: "rgba(8,8,12,0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: "12px 14px",
              pointerEvents: "none",
              boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
            }}
          >
            {tooltip.book.coverUrl && (
              <img src={tooltip.book.coverUrl} alt={tooltip.book.title}
                style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 10 }} />
            )}
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.35, marginBottom: 3 }}>{tooltip.book.title}</div>
            <div style={{ color: "#888", fontSize: 11, marginBottom: 8 }}>{tooltip.book.author}</div>
            <StarRow rating={tooltip.book.rating} />
            {tooltip.book.pages && (
              <div style={{ color: "#666", fontSize: 10, marginTop: 5 }}>{tooltip.book.pages.toLocaleString()} pages</div>
            )}
            {tooltip.book.finishedAt && (
              <div style={{ color: "#555", fontSize: 10, marginTop: 2 }}>
                Finished {new Date(tooltip.book.finishedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </div>
            )}
            {/* Arrow */}
            <div style={{
              position: "absolute", bottom: -5, left: "50%",
              width: 10, height: 10,
              background: "rgba(8,8,12,0.98)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderTop: "none", borderLeft: "none",
              transform: "translateX(-50%) rotate(45deg)",
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookshelf */}
      <div style={{ width: "100%", maxWidth: 800 }}>
        {books.length === 0 && (
          <div style={{ textAlign: "center", color: "#444", padding: "60px 0", fontSize: 14 }}>
            The shelf is empty — add some books!
          </div>
        )}

        {rows.map((row, rowIdx) => {
          const maxHeight = row.length > 0
            ? Math.max(...row.filter(Boolean).map((b) => getBookHeight(b as BookWithPages)))
            : 220;

          return (
            <div key={rowIdx}>
              {/* Books sitting on the shelf */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  minHeight: maxHeight + 6,
                  padding: "0 20px",
                  background: "linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.18) 100%)",
                }}
              >
                {row.map((book) =>
                  book ? (
                    <BookItem
                      key={book.id}
                      book={book}
                      dimmed={!!(anyMatch && !matches(book))}
                      highlighted={!!(anyMatch && matches(book))}
                      onHoverChange={handleHoverChange}
                    />
                  ) : null
                )}
                {/* Empty slot visual hint when row has no books */}
                {row.length === 0 && (
                  <div style={{ height: maxHeight, width: "100%", opacity: 0 }} />
                )}
              </div>

              {/* Shelf plank */}
              <div style={{ padding: "0 0" }}>
                {/* Top surface */}
                <div style={{
                  height: 18,
                  background: "linear-gradient(180deg, #7a5628 0%, #5a3c18 50%, #3e2810 100%)",
                  boxShadow: "0 -1px 0 rgba(255,255,255,0.08), 0 2px 0 #2a1a08",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Wood grain */}
                  {[20, 80, 155, 240, 340, 455, 580, 720].map((x) => (
                    <div key={x} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.15)" }} />
                  ))}
                  {[5, 11].map((y) => (
                    <div key={y} style={{ position: "absolute", top: y, left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.04)" }} />
                  ))}
                </div>
                {/* Front edge of plank */}
                <div style={{
                  height: 10,
                  background: "linear-gradient(180deg, #2e1c0a 0%, #180e04 100%)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
                  marginBottom: 20,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
