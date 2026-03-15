import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BookCard } from "./book-card";
import type { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";

interface SeriesRowProps {
  title: string;
  books: Book[];
  seriesId?: number;
}

export function SeriesRow({ title, books, seriesId }: SeriesRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (books.length === 0) return null;

  // Sort books by seriesOrder if available
  const sortedBooks = [...books].sort((a, b) => {
    if (a.seriesOrder !== null && b.seriesOrder !== null) {
      return (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0);
    }
    return 0;
  });

  return (
    <div className="relative group/row py-4">
      <div className="flex items-end justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
          {title}
        </h2>
        {seriesId && (
          <Link 
            href={`/series/${seriesId}/edit`}
            className="text-sm text-zinc-400 hover:text-white transition-colors opacity-0 group-hover/row:opacity-100"
          >
            Edit Series
          </Link>
        )}
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-black/50 hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center disabled:opacity-0"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory py-4 px-1"
        >
          {sortedBooks.map((book, i) => (
            <div key={book.id} className="w-[140px] sm:w-[160px] md:w-[200px] lg:w-[240px] flex-none snap-start">
              <BookCard book={book} delay={i} />
            </div>
          ))}
        </div>

        <button 
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-black/50 hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover/row:opacity-100 transition-all flex items-center justify-center"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  );
}
