import { useRoute, Link } from "wouter";
import { useBook, useDeleteBookMutation } from "@/hooks/use-books";
import { useSingleSeries } from "@/hooks/use-series";
import { useAdmin } from "@/context/admin-context";
import { Layout } from "@/components/layout";
import { Loader } from "@/components/ui/loader";
import { StarRating } from "@/components/star-rating";
import { CommentSection } from "@/components/comment-section";
import { ArrowLeft, Edit3, Trash2, Calendar, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function BookDetail() {
  const [, params] = useRoute("/book/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: book, isLoading } = useBook(id);
  const { mutate: deleteBook, isPending: isDeleting } = useDeleteBookMutation();
  const { data: series } = useSingleSeries(book?.seriesId || 0);
  const { isAdmin } = useAdmin();

  if (isLoading) return <Layout><Loader /></Layout>;
  if (!book) return <Layout><div className="pt-24 text-center text-white">Book not found</div></Layout>;

  return (
    <Layout>
      <div className="relative min-h-[52vh] flex items-center justify-center pt-18 pb-9 px-4 sm:px-6 lg:px-8">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-2xl opacity-30 scale-110"
          style={{ backgroundImage: `url(${book.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />

        <div className="relative z-20 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-9 items-center md:items-start pt-16">
          
          {/* Left Column: Cover */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[220px] shrink-0"
          >
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5">
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80";
                }}
              />
            </div>
            
            {isAdmin && (
              <div className="flex gap-2 mt-4">
                <Link 
                  href={`/book/${book.id}/edit`}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/5"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Link>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this book?")) {
                      deleteBook(book.id);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 bg-destructive/20 hover:bg-destructive/80 text-destructive-foreground py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors border border-destructive/30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Column: Details */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="flex-1 text-left pt-3"
          >
            <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors mb-4 text-sm font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
            </Link>

            {book.seriesId && series && (
              <Link href={`/series`} className="inline-block px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider mb-3 hover:bg-primary/30 transition-colors">
                {series.name} {book.seriesOrder ? `#${book.seriesOrder}` : ''}
              </Link>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white mb-1.5 leading-tight">
              {book.title}
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 font-light mb-5">
              by <span className="text-white font-medium">{book.author}</span>
            </p>

            <div className="flex items-center gap-5 mb-7 pb-6 border-b border-white/10">
              {book.rating ? (
                <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                  <StarRating value={book.rating} readOnly size="md" />
                  <span className="text-lg font-bold text-white">{book.rating}</span>
                </div>
              ) : (
                <span className="text-zinc-500 italic text-sm">No rating yet</span>
              )}
              
              {book.pages && (
                <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{book.pages.toLocaleString()} pages</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                {book.finishedAt ? (
                  <span>Finished {new Date(book.finishedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                ) : (
                  <span>Added {new Date(book.createdAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-display font-bold text-white mb-3">Review</h3>
              {book.review ? (
                <div className="text-zinc-300 leading-relaxed text-base whitespace-pre-wrap font-serif">
                  {book.review}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-base">No review written yet. Edit the book to add your thoughts.</p>
              )}
            </div>

            <CommentSection bookId={id} />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
