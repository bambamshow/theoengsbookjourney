import { useState, useEffect } from "react";
import { useBooks } from "@/hooks/use-books";
import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { SeriesRow } from "@/components/series-row";
import { BookCard } from "@/components/book-card";
import { Loader } from "@/components/ui/loader";
import { useAdmin } from "@/context/admin-context";
import { Plus, BookOpen, LayoutGrid, Layers, ArrowDownWideNarrow } from "lucide-react";
import { Link } from "wouter";
import type { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ViewMode = "series" | "all";
type SortBy = "custom" | "title" | "author" | "rating" | "series" | "finished";

const SORT_LABELS: Record<SortBy, string> = {
  custom: "Custom Order",
  title: "Title (A-Z)",
  author: "Author (A-Z)",
  rating: "Rating (High-Low)",
  series: "Series Name",
  finished: "Finish Date (Recent)",
};

const ORDER_KEY = "bookshelf-order";
const VIEW_KEY = "bookshelf-view";
const SORT_KEY = "bookshelf-sort";

function loadOrder(): number[] | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveOrder(ids: number[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
}

function applyOrder(books: Book[], order: number[] | null): Book[] {
  if (!order) return books;
  const byId = new Map(books.map((b) => [b.id, b]));
  const ordered: Book[] = [];
  for (const id of order) {
    const b = byId.get(id);
    if (b) ordered.push(b);
    byId.delete(id);
  }
  for (const b of byId.values()) ordered.push(b);
  return ordered;
}

function sortBooks(
  books: Book[],
  sort: SortBy,
  order: number[] | null,
  seriesNameMap: Map<number, string>
): Book[] {
  if (sort === "custom") return applyOrder(books, order);
  const sorted = [...books];
  switch (sort) {
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "author":
      return sorted.sort((a, b) => a.author.localeCompare(b.author));
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "series":
      return sorted.sort((a, b) => {
        const sa = seriesNameMap.get(a.seriesId ?? -1) ?? "zzz";
        const sb = seriesNameMap.get(b.seriesId ?? -1) ?? "zzz";
        if (sa !== sb) return sa.localeCompare(sb);
        if ((a.seriesOrder ?? 999) !== (b.seriesOrder ?? 999))
          return (a.seriesOrder ?? 999) - (b.seriesOrder ?? 999);
        return a.title.localeCompare(b.title);
      });
    case "finished":
      return sorted.sort((a, b) => {
        const ta = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const tb = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        if (ta !== tb) return tb - ta;
        return a.title.localeCompare(b.title);
      });
    default:
      return sorted;
  }
}

function SortableBookCard({ book, index }: { book: Book; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: book.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <BookCard book={book} delay={index} />
    </div>
  );
}

const GRID = "grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 gap-y-6";

export default function Home() {
  const { data: books, isLoading: booksLoading } = useBooks();
  const { data: seriesList, isLoading: seriesLoading } = useSeries();
  const { isAdmin } = useAdmin();

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [sortBy, setSortBy] = useState<SortBy>("custom");
  const [displayOrder, setDisplayOrder] = useState<number[] | null>(null);

  useEffect(() => {
    setDisplayOrder(loadOrder());
    setViewMode((localStorage.getItem(VIEW_KEY) as ViewMode) || "all");
    setSortBy((localStorage.getItem(SORT_KEY) as SortBy) || "custom");
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (booksLoading || seriesLoading) {
    return <Layout><Loader /></Layout>;
  }

  const seriesNameMap = new Map<number, string>(
    seriesList?.map((s) => [s.id, s.name]) ?? []
  );

  const booksBySeries = new Map<number, Book[]>();
  const standaloneBooks = books?.filter((b) => !b.seriesId) || [];

  seriesList?.forEach((series) => {
    const seriesBooks = books?.filter((b) => b.seriesId === series.id) ?? [];
    if (seriesBooks.length > 0) booksBySeries.set(series.id, seriesBooks);
  });

  const hasContent = books && books.length > 0;
  const allBooks = books ?? [];

  const isDnDActive = viewMode === "all" && sortBy === "custom";
  const sortedAllBooks = sortBooks(allBooks, sortBy, displayOrder, seriesNameMap);
  const sortedStandalone = sortBooks(standaloneBooks, sortBy, displayOrder, seriesNameMap);

  function handleViewMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_KEY, mode);
  }

  function handleSort(sort: SortBy) {
    setSortBy(sort);
    localStorage.setItem(SORT_KEY, sort);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const source = viewMode === "all" ? sortedAllBooks : sortedStandalone;
    const oldIndex = source.findIndex((b) => b.id === active.id);
    const newIndex = source.findIndex((b) => b.id === over.id);
    const newOrder = arrayMove(source, oldIndex, newIndex);
    const ids = newOrder.map((b) => b.id);
    setDisplayOrder(ids);
    saveOrder(ids);
  }

  const displayBooks = viewMode === "all" ? sortedAllBooks : sortedStandalone;
  const displayIds = displayBooks.map((b) => b.id);

  return (
    <Layout>
      <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/cinematic-bg.png)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="relative z-20 max-w-[1600px] mx-auto">
          <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white mb-3">
            Keep <span className="text-primary">Reading!</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-2xl">
            Keep track of your reading journey. Rate, review, and organize your favorite books and series in one cinematic place.
          </p>
          {isAdmin && (
            <div className="mt-6">
              <Link
                href="/book/new"
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-md font-semibold inline-flex items-center gap-2 transition-all hover:scale-105 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add a Book
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto pb-24">
        {!hasContent ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your shelf is empty</h2>
            <p className="text-zinc-400 max-w-md mx-auto">
              Start building your collection by adding your first book. You can group them into series later.
            </p>
          </div>
        ) : (
          <>
            {/* Controls bar */}
            <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => handleViewMode("series")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "series"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  By Series
                </button>
                <button
                  onClick={() => handleViewMode("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === "all"
                      ? "bg-white/15 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  All Books
                </button>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Sort by:</span>
                <div className="relative">
                  <ArrowDownWideNarrow className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value as SortBy)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-md pl-8 pr-8 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-primary appearance-none cursor-pointer transition-all"
                  >
                    {(Object.keys(SORT_LABELS) as SortBy[]).map((value) => (
                      <option key={value} value={value} className="bg-zinc-900 text-white">
                        {SORT_LABELS[value]}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">▾</span>
                </div>
                {isDnDActive && (
                  <span className="text-xs text-zinc-600 hidden sm:inline">Drag to reorder</span>
                )}
              </div>
            </div>

            {/* Content */}
            {viewMode === "series" ? (
              <div className="flex flex-col gap-8 mt-6">
                {seriesList?.map((series) => {
                  const seriesBooks = booksBySeries.get(series.id);
                  if (!seriesBooks) return null;
                  return (
                    <SeriesRow
                      key={series.id}
                      title={series.name}
                      books={seriesBooks}
                      seriesId={series.id}
                    />
                  );
                })}

                {standaloneBooks.length > 0 && (
                  <div className="px-4 sm:px-6 lg:px-8 mt-4">
                    <h2 className="text-xl font-display font-bold text-white tracking-tight mb-4">
                      {seriesList && seriesList.length > 0 ? "Standalone Books" : "All Books"}
                    </h2>
                    <div className={GRID}>
                      {sortedStandalone.map((book, i) => (
                        <BookCard key={book.id} book={book} delay={i} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 sm:px-6 lg:px-8 mt-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={displayIds} strategy={rectSortingStrategy}>
                    <div className={GRID}>
                      {displayBooks.map((book, i) =>
                        isDnDActive ? (
                          <SortableBookCard key={book.id} book={book} index={i} />
                        ) : (
                          <BookCard key={book.id} book={book} delay={i} />
                        )
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
