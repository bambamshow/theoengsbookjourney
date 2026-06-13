import { Link } from "wouter";
import type { Book } from "@/lib/local-store";
import { motion } from "framer-motion";

interface BookCardProps {
  book: Book;
  delay?: number;
}

function HalfStarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {[1, 2, 3, 4, 5].map((pos) => {
        const filled = rating >= pos;
        const half = !filled && rating >= pos - 0.5;
        return (
          <span key={pos} className="relative inline-block w-3 h-3">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-zinc-700 text-zinc-700 absolute inset-0">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : "50%" }}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-primary text-primary">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
      <span className="text-xs text-white font-medium ml-1 drop-shadow-md">{rating}</span>
    </div>
  );
}

export function BookCard({ book, delay = 0 }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className="relative group w-full aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 cursor-pointer shadow-lg transition-all duration-300 z-10 hover:z-20 hover:ring-2 hover:ring-white/60 hover:shadow-[0_0_24px_rgba(255,255,255,0.15)]"
    >
      <Link href={`/book/${book.id}`} className="absolute inset-0 z-20">
        <span className="sr-only">View {book.title}</span>
      </Link>

      <img
        src={book.coverUrl}
        alt={`Cover of ${book.title}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80";
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-3">
        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">
          {book.title}
        </h3>
        <p className="text-zinc-300 text-xs mt-0.5 drop-shadow-md line-clamp-1">{book.author}</p>
        {book.rating != null && <HalfStarDisplay rating={book.rating} />}
      </div>
    </motion.div>
  );
}
