import { useRoute, Link } from "wouter";
import { useBook, useDeleteBookMutation } from "@/hooks/use-books";
import { useSingleSeries } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { Loader } from "@/components/ui/loader";
import { StarRating } from "@/components/star-rating";
import { ArrowLeft, Edit3, Trash2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function BookDetail() {
  const [, params] = useRoute("/book/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: book, isLoading } = useBook(id);
  const { mutate: deleteBook, isPending: isDeleting } = useDeleteBookMutation();
  
  // Fetch series info if book belongs to one
  const { data: series } = useSingleSeries(book?.seriesId || 0);

  if (isLoading) return <Layout><Loader /></Layout>;
  if (!book) return <Layout><div className="pt-32 text-center text-white">Book not found</div></Layout>;

  return (
    <Layout>
      {/* Cinematic Hero/Backdrop */}
      <div className="relative min-h-[70vh] flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Blurred Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-2xl opacity-30 scale-110"
          style={{ backgroundImage: `url(${book.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />

        <div className="relative z-20 max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-12 items-center md:items-start">
          
          {/* Left Column: Cover */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-sm shrink-0"
          >
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 ring-1 ring-white/5 relative group">
              <img 
                src={book.coverUrl} 
                alt={book.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80";
                }}
              />
            </div>
            
            {/* Actions under cover */}
            <div className="flex gap-3 mt-6">
              <Link 
                href={`/book/${book.id}/edit`}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors border border-white/5"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </Link>
              <button 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this book?")) {
                    deleteBook(book.id);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 bg-destructive/20 hover:bg-destructive/80 text-destructive-foreground py-3 rounded-md font-medium flex items-center justify-center gap-2 transition-colors border border-destructive/30"
              >
                <Trash2 className="w-4 h-4" /> {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>

          {/* Right Column: Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex-1 text-left pt-4"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Library
            </Link>

            {book.seriesId && series && (
              <Link href={`/series`} className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold uppercase tracking-wider mb-4 hover:bg-primary/30 transition-colors">
                {series.name} {book.seriesOrder ? `#${book.seriesOrder}` : ''}
              </Link>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold text-white mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-xl md:text-2xl text-zinc-300 font-light mb-6">
              by <span className="text-white font-medium">{book.author}</span>
            </p>

            <div className="flex items-center gap-6 mb-10 pb-8 border-b border-white/10">
              {book.rating ? (
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/5">
                  <StarRating value={book.rating} readOnly size="lg" />
                  <span className="text-xl font-bold text-white">{book.rating}.0</span>
                </div>
              ) : (
                <span className="text-zinc-500 italic">No rating yet</span>
              )}
              
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Added {new Date(book.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="text-2xl font-display font-bold text-white mb-4">Review</h3>
              {book.review ? (
                <div className="text-zinc-300 leading-relaxed text-lg whitespace-pre-wrap font-serif">
                  {book.review}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-lg">No review written yet. Edit the book to add your thoughts.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
