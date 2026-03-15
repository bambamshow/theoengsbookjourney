import { useBooks } from "@/hooks/use-books";
import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { SeriesRow } from "@/components/series-row";
import { BookCard } from "@/components/book-card";
import { Loader } from "@/components/ui/loader";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data: books, isLoading: booksLoading } = useBooks();
  const { data: seriesList, isLoading: seriesLoading } = useSeries();

  if (booksLoading || seriesLoading) {
    return <Layout><Loader /></Layout>;
  }

  // Group books by series
  const booksBySeries = new Map<number, typeof books>();
  const standaloneBooks = books?.filter(b => !b.seriesId) || [];

  if (books && seriesList) {
    seriesList.forEach(series => {
      const seriesBooks = books.filter(b => b.seriesId === series.id);
      if (seriesBooks.length > 0) {
        booksBySeries.set(series.id, seriesBooks);
      }
    });
  }

  const hasContent = books && books.length > 0;

  return (
    <Layout>
      {/* Hero Header Section */}
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
          
          <div className="mt-8 flex items-center gap-4">
            <Link 
              href="/book/new"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md font-semibold flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add a Book
            </Link>
            <Link 
              href="/series/new"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-3 rounded-md font-semibold flex items-center gap-2 transition-all"
            >
              Create Series
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
            {/* Render Series Rows */}
            {seriesList?.map(series => {
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

            {/* Standalone Books or All Books if no series */}
            {(standaloneBooks.length > 0 || seriesList?.length === 0) && (
              <div className="px-4 sm:px-6 lg:px-8 mt-12">
                <h2 className="text-xl md:text-2xl font-display font-bold text-white tracking-tight mb-6">
                  {seriesList && seriesList.length > 0 ? "Standalone Books" : "All Books"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 gap-y-8">
                  {standaloneBooks.map((book, i) => (
                    <BookCard key={book.id} book={book} delay={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
// Placeholder import for empty state
import { BookOpen } from "lucide-react";
