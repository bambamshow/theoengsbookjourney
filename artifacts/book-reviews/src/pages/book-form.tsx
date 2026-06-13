import { useRoute, useLocation, Link } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBook, useCreateBookMutation, useUpdateBookMutation } from "@/hooks/use-books";
import { useSeries, useCreateSeriesMutation } from "@/hooks/use-series";
import { useAdmin } from "@/context/admin-context";
import { Layout } from "@/components/layout";
import { StarRating } from "@/components/star-rating";
import { Loader } from "@/components/ui/loader";
import { ArrowLeft, Save, Image as ImageIcon, Plus, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  coverUrl: z.string().url("Must be a valid URL"),
  review: z.string().optional().nullable(),
  rating: z.coerce.number().min(0.5).max(5).optional().nullable(),
  seriesId: z.coerce.number().optional().nullable(),
  seriesOrder: z.coerce.number().optional().nullable(),
  pages: z.coerce.number().int().min(1).optional().nullable(),
  finishedAt: z.string().optional().nullable(),
});

type BookFormData = z.infer<typeof bookSchema>;

function toDateInputValue(isoString?: string | null): string {
  if (!isoString) return "";
  return isoString.slice(0, 10);
}

export default function BookForm() {
  const [, params] = useRoute("/book/:id/edit");
  const [, setLocation] = useLocation();
  const { isAdmin } = useAdmin();
  const isEditing = !!params?.id;
  const id = isEditing ? parseInt(params.id!, 10) : 0;

  useEffect(() => {
    if (!isAdmin) setLocation("/");
  }, [isAdmin, setLocation]);

  const { data: book, isLoading: bookLoading } = useBook(id);
  const { data: seriesList, refetch: refetchSeries } = useSeries();

  const { mutate: createBook, isPending: isCreating } = useCreateBookMutation();
  const { mutate: updateBook, isPending: isUpdating } = useUpdateBookMutation(id);
  const { mutate: createSeries, isPending: isCreatingSeries } = useCreateSeriesMutation();

  const isPending = isCreating || isUpdating;

  // Inline new-series state
  const [showNewSeries, setShowNewSeries] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesError, setNewSeriesError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      coverUrl: "",
      review: "",
      rating: null,
      seriesId: null,
      seriesOrder: null,
      pages: null,
      finishedAt: null,
    }
  });

  const coverUrlPreview = watch("coverUrl");
  const selectedSeriesId = watch("seriesId");
  const hasSeries = (seriesList?.length ?? 0) > 0;
  const noSeriesAvailable = !hasSeries;

  // Auto-open inline creation form when there are no series at all
  useEffect(() => {
    if (noSeriesAvailable) setShowNewSeries(true);
  }, [noSeriesAvailable]);

  useEffect(() => {
    if (isEditing && book) {
      reset({
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        review: book.review,
        rating: book.rating,
        seriesId: book.seriesId,
        seriesOrder: book.seriesOrder,
        pages: book.pages ?? null,
        finishedAt: toDateInputValue(book.finishedAt),
      });
    }
  }, [isEditing, book, reset]);

  const onSubmit = (data: BookFormData) => {
    const payload = {
      ...data,
      seriesId: data.seriesId || null,
      seriesOrder: data.seriesOrder || null,
      pages: data.pages || null,
      rating: data.rating || null,
      finishedAt: data.finishedAt ? new Date(data.finishedAt).toISOString() : null,
    };
    if (isEditing) {
      updateBook(payload);
    } else {
      createBook(payload);
    }
  };

  function handleCreateSeries() {
    if (!newSeriesName.trim()) return setNewSeriesError("Series name is required.");
    setNewSeriesError("");
    createSeries(
      { name: newSeriesName.trim() },
      {
        onSuccess: async (created) => {
          await refetchSeries();
          setValue("seriesId", created.id);
          setNewSeriesName("");
          setShowNewSeries(false);
        },
        onError: () => setNewSeriesError("Failed to create series."),
      }
    );
  }

  if (isEditing && bookLoading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        <Link
          href={isEditing ? `/book/${id}` : "/"}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8">
            {isEditing ? "Edit Book Details" : "Add a New Book"}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-12">

            {/* Left: Preview */}
            <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-4">
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 border border-white/5 shadow-xl flex flex-col items-center justify-center relative">
                {coverUrlPreview && !errors.coverUrl ? (
                  <img
                    src={coverUrlPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="text-zinc-500 flex flex-col items-center p-6 text-center">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-sm">Enter a valid image URL to see cover preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Fields */}
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Title <span className="text-primary">*</span></label>
                  <input
                    {...register("title")}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Dune"
                  />
                  {errors.title && <p className="text-primary text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Author <span className="text-primary">*</span></label>
                  <input
                    {...register("author")}
                    className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="e.g. Frank Herbert"
                  />
                  {errors.author && <p className="text-primary text-xs mt-1">{errors.author.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Cover Image URL <span className="text-primary">*</span></label>
                <input
                  {...register("coverUrl")}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  placeholder="https://example.com/cover.jpg"
                />
                {errors.coverUrl && <p className="text-primary text-xs mt-1">{errors.coverUrl.message}</p>}
              </div>

              {/* Series + Date row */}
              <div className="p-6 rounded-xl bg-black/30 border border-white/5 space-y-5">

                {/* Series selector with inline creation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Series (Optional)</label>
                    <div className="flex gap-2">
                      <select
                        {...register("seriesId", { setValueAs: v => v === "" ? null : parseInt(v, 10) })}
                        disabled={noSeriesAvailable}
                        className="flex-1 bg-zinc-900 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Standalone</option>
                        {seriesList?.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {hasSeries && (
                        <button
                          type="button"
                          onClick={() => { setShowNewSeries(v => !v); setNewSeriesName(""); setNewSeriesError(""); }}
                          title="Create new series"
                          className="px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
                        >
                          {showNewSeries ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {noSeriesAvailable && (
                      <p className="text-xs text-zinc-500">No series yet — create one below or leave as Standalone.</p>
                    )}

                    {/* Inline new series form */}
                    {showNewSeries && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 mt-2"
                      >
                        <input
                          type="text"
                          value={newSeriesName}
                          onChange={e => { setNewSeriesName(e.target.value); setNewSeriesError(""); }}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateSeries(); } }}
                          placeholder="New series name"
                          autoFocus
                          className="flex-1 bg-zinc-900 border border-primary/40 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-primary transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleCreateSeries}
                          disabled={isCreatingSeries}
                          className="px-3 py-2 rounded-md bg-primary hover:bg-primary/90 text-white transition-all disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                    {newSeriesError && <p className="text-primary text-xs">{newSeriesError}</p>}
                  </div>

                  {selectedSeriesId ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">Order in Series</label>
                      <input
                        type="number"
                        {...register("seriesOrder", { setValueAs: v => v === "" ? null : parseInt(v, 10) })}
                        className="w-full bg-zinc-900 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="e.g. 1"
                      />
                    </div>
                  ) : (
                    <div className="hidden md:flex items-end pb-3">
                      <p className="text-xs text-zinc-600 italic">Standalone books don't need a series order.</p>
                    </div>
                  )}
                </div>

                {/* Pages + Finished reading date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Number of Pages</label>
                    <input
                      type="number"
                      min={1}
                      {...register("pages", { setValueAs: v => v === "" ? null : parseInt(v, 10) })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="e.g. 432"
                    />
                    <p className="text-xs text-zinc-600">Used to set book spine width on the shelf</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Finished Reading Date</label>
                    <input
                      type="date"
                      {...register("finishedAt")}
                      className="w-full bg-zinc-900 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-300">Your Rating</label>
                <Controller
                  name="rating"
                  control={control}
                  render={({ field }) => (
                    <div className="bg-black/30 inline-block p-3 rounded-lg border border-white/5">
                      <StarRating
                        value={field.value || 0}
                        onChange={field.onChange}
                        size="lg"
                      />
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Review</label>
                <textarea
                  {...register("review")}
                  rows={8}
                  className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none font-serif text-lg leading-relaxed"
                  placeholder="Write your thoughts about the book here..."
                />
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none shadow-lg shadow-primary/25"
                >
                  <Save className="w-5 h-5" />
                  {isPending ? "Saving..." : "Save Book"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
