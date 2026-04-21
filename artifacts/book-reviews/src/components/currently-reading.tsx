import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Image as ImageIcon, X, CheckCircle2, Clock } from "lucide-react";
import { useCreateBookMutation } from "@/hooks/use-books";
import { useAdmin } from "@/context/admin-context";
import type { Book } from "@workspace/api-client-react/src/generated/api.schemas";

function StartReadingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const { mutate: createBook, isPending } = useCreateBookMutation();

  function reset() {
    setTitle(""); setAuthor(""); setCoverUrl("");
    setStartedAt(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !author.trim() || !coverUrl.trim()) {
      return setError("Title, author, and cover URL are required.");
    }
    try { new URL(coverUrl); } catch { return setError("Cover URL must be a valid URL."); }

    createBook(
      {
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim(),
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: null,
        review: null,
        rating: null,
        seriesId: null,
        seriesOrder: null,
      },
      {
        onSuccess: () => { reset(); onClose(); },
        onError: () => setError("Failed to start reading. Please try again."),
      }
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-display font-bold text-white">Start a New Book</h2>
              </div>
              <button onClick={onClose} className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Title</label>
                <input
                  value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Project Hail Mary"
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Author</label>
                <input
                  value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Andy Weir"
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Cover Image URL</label>
                <input
                  value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 mb-1 block">Date Started</label>
                <input
                  type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary [color-scheme:dark]"
                />
              </div>

              {error && <p className="text-primary text-xs">{error}</p>}

              <button
                type="submit" disabled={isPending}
                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-md font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                <BookOpen className="w-4 h-4" />
                {isPending ? "Starting..." : "Start Reading"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CurrentlyReadingSection({ book }: { book: Book | null }) {
  const { isAdmin } = useAdmin();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!book && !isAdmin) return null;

  return (
    <section className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8 border-b border-white/5">
      <div
        className="absolute inset-0 z-0 opacity-30 bg-cover bg-center"
        style={{ backgroundImage: book ? `url(${book.coverUrl})` : undefined, filter: "blur(40px) saturate(1.2)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background z-10" />

      <div className="relative z-20 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-semibold">Currently Reading</h2>
        </div>

        {book ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-6 items-start sm:items-end"
          >
            <Link href={`/book/${book.id}`} className="shrink-0 group">
              <div className="w-32 sm:w-40 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-white/10 group-hover:ring-primary/40 transition-all">
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            </Link>

            <div className="flex-1 pb-2">
              <h3 className="text-2xl md:text-4xl font-display font-extrabold text-white mb-1.5 leading-tight">
                {book.title}
              </h3>
              <p className="text-zinc-300 text-base md:text-lg mb-3">{book.author}</p>
              {book.startedAt && (
                <p className="text-xs text-zinc-500 mb-4">
                  Started {new Date(book.startedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}

              {isAdmin && (
                <Link
                  href={`/book/${book.id}/edit`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-primary/25"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark as Finished &amp; Add Review
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          // Admin only — empty state
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/15 hover:border-primary/40 rounded-xl p-5 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-lg bg-primary/10 group-hover:bg-primary/20 border border-primary/20 flex items-center justify-center transition-all">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">Start a new book</p>
              <p className="text-zinc-400 text-sm">Track what you're reading right now</p>
            </div>
          </button>
        )}
      </div>

      <StartReadingDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </section>
  );
}
