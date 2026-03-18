import { useState } from "react";
import { Heart, MessageCircle, Send, User } from "lucide-react";
import { useComments, useCreateComment, useLikes, useAddLike } from "@/hooks/use-comments";

const LIKED_KEY = (bookId: number) => `liked-book-${bookId}`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CommentSectionProps {
  bookId: number;
}

export function CommentSection({ bookId }: CommentSectionProps) {
  const { data: comments = [], isLoading: commentsLoading } = useComments(bookId);
  const { data: likesData } = useLikes(bookId);
  const createComment = useCreateComment(bookId);
  const addLike = useAddLike(bookId);

  const [hasLiked, setHasLiked] = useState(() => {
    try {
      return localStorage.getItem(LIKED_KEY(bookId)) === "1";
    } catch {
      return false;
    }
  });

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleLike() {
    if (hasLiked) return;
    addLike.mutate(undefined, {
      onSuccess: () => {
        setHasLiked(true);
        try { localStorage.setItem(LIKED_KEY(bookId), "1"); } catch {}
      },
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!comment.trim()) return setError("Please write a comment.");
    createComment.mutate(
      { name: name.trim(), comment: comment.trim() },
      {
        onSuccess: () => {
          setName("");
          setComment("");
        },
        onError: () => setError("Failed to post comment. Please try again."),
      }
    );
  }

  const likeCount = likesData?.count ?? 0;

  return (
    <div className="border-t border-white/10 pt-8 mt-8">
      {/* Like section */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={handleLike}
          disabled={hasLiked || addLike.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-sm font-medium
            ${hasLiked
              ? "bg-primary/20 border-primary/40 text-primary cursor-default"
              : "border-white/10 text-zinc-400 hover:border-primary/50 hover:text-primary hover:bg-primary/10 cursor-pointer"
            }`}
        >
          <Heart className={`w-4 h-4 ${hasLiked ? "fill-primary" : ""}`} />
          {hasLiked ? "You liked this" : "Like this review"}
        </button>
        {likeCount > 0 && (
          <span className="text-zinc-500 text-sm">
            {likeCount} {likeCount === 1 ? "person" : "people"} liked this review
          </span>
        )}
      </div>

      {/* Comments heading */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-zinc-400" />
        <h3 className="text-lg font-bold text-white">
          Comments {comments.length > 0 && <span className="text-zinc-500 font-normal text-base">({comments.length})</span>}
        </h3>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/8 rounded-xl p-5 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this book..."
          rows={3}
          maxLength={1000}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors resize-none mb-3"
        />
        {error && <p className="text-primary text-xs mb-2">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createComment.isPending}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {createComment.isPending ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {commentsLoading ? (
        <div className="text-zinc-600 text-sm">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-zinc-600 text-sm italic">No comments yet. Be the first to share your thoughts!</div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...comments].reverse().map((c) => (
            <div key={c.id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <span className="text-white text-sm font-semibold">{c.name}</span>
                <span className="text-zinc-600 text-xs ml-auto">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap pl-9">{c.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
