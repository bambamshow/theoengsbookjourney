import { BookCard } from "./book-card";
import type { Book } from "@/lib/local-store";
import { Link } from "wouter";

interface SeriesRowProps {
  title: string;
  books: Book[];
  seriesId?: number;
}

export function SeriesRow({ title, books, seriesId }: SeriesRowProps) {
  if (books.length === 0) return null;

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

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
          {sortedBooks.map((book, i) => (
            <BookCard key={book.id} book={book} delay={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
