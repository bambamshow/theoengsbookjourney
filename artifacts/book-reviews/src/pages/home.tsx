import { useState, useEffect } from "react";
import { useBooks } from "@/hooks/use-books";
import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { SeriesRow } from "@/components/series-row";
import { BookCard } from "@/components/book-card";
import { Loader } from "@/components/ui/loader";
import { Plus, BookOpen } from "lucide-react";
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

const ORDER_KEY = "bookshelf-order";

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

function SortableBookCard({ book, index }: { book: Book; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });
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

export default function Home() {
  const { data: books, isLoading: booksLoading } = useBooks();
  const { data: seriesList, isLoading: seriesLoading } = useSeries();
  const [displayOrder, setDisplayOrder] = useState<number[] | null>(null);

  useEffect(() => {
    setDisplayOrder(loadOrder());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (booksLoading || seriesLoading) {
    return <Layout><Loader /></Layout>;
  }

  const booksBySeries = new Map<number, Book[]>();
  const standaloneBooks = books?.filter((b) => !b.seriesId) || [];

  if (books && seriesList) {
    seriesList.forEach((series) => {
      const seriesBooks = books.filter((b) => b.seriesId === series.id);
      if (seriesBooks.length > 0) booksBySeries.set(series.id, seriesBooks);
    });
  }

  const orderedStandalone = applyOrder(standaloneBooks, displayOrder);
  const hasContent = books && books.length > 0;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedStandalone.findIndex((b) => b.id === active.id);
    const newIndex = orderedStandalone.findIndex((b) => b.id === over.id);
    const newOrder = arrayMove(orderedStandalone, oldIndex, newIndex);
    const ids = newOrder.map((b) => b.id);
    setDisplayOrder(ids);
    saveOrder(ids);
  }

  return (
    <Layout>
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/cinematic-bg.png)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />

        <div className="relative z-20 max-w-[1600px] mx-auto">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-4">
            Your Digital <span className="text-primary">Library</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl">
            Keep track of your reading journey. Rate, review, and organize your favorite books and series in one cinematic place.
          </p>

          <div className="mt-8">
            <Link
              href="/book/new"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md font-semibold inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add a Book
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto pb-24">
        {!hasContent ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-zinc-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Your shelf is empty</h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
              Start building your collection by adding your first book. You can group them into series later.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 -mt-8">
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

            {(orderedStandalone.length > 0 || seriesList?.length === 0) && (
              <div className="px-4 sm:px-6 lg:px-8 mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
                    {seriesList && seriesList.length > 0 ? "Standalone Books" : "All Books"}
                  </h2>
                  {orderedStandalone.length > 1 && (
                    <span className="text-xs text-zinc-500 select-none">Drag to reorder</span>
                  )}
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext
                    items={orderedStandalone.map((b) => b.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
                      {orderedStandalone.map((book, i) => (
                        <SortableBookCard key={book.id} book={book} index={i} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
