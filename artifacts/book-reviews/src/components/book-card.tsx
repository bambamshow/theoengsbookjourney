import { Link } from "wouter";
import { Star } from "lucide-react";
import type { Book } from "@workspace/api-client-react/src/generated/api.schemas";
import { motion } from "framer-motion";

interface BookCardProps {
  book: Book;
  delay?: number;
}

export function BookCard({ book, delay = 0 }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className="relative group w-full aspect-[2/3] rounded-md overflow-hidden bg-zinc-900 cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all duration-300 z-10 hover:z-20 hover:scale-105 origin-bottom"
    >
      <Link href={`/book/${book.id}`} className="absolute inset-0 z-20">
        <span className="sr-only">View {book.title}</span>
      </Link>
      
      <img 
        src={book.coverUrl} 
        alt={`Cover of ${book.title}`} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80"; // fallback
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end p-4">
        <h3 className="text-white font-display font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">
          {book.title}
        </h3>
        <p className="text-zinc-300 text-sm mt-1 drop-shadow-md line-clamp-1">{book.author}</p>
        
        {book.rating && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < book.rating! ? 'fill-primary text-primary' : 'fill-zinc-700 text-zinc-700'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-white font-medium drop-shadow-md ml-1">{book.rating}.0</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
