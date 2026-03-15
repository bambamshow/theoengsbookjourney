import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSingleSeries, useCreateSeriesMutation, useUpdateSeriesMutation } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { Loader } from "@/components/ui/loader";
import { ArrowLeft, Save, FolderPlus } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";

const seriesSchema = z.object({
  name: z.string().min(1, "Series name is required"),
  description: z.string().optional().nullable(),
});

type SeriesFormData = z.infer<typeof seriesSchema>;

export default function SeriesForm() {
  const [, params] = useRoute("/series/:id/edit");
  const [, setLocation] = useLocation();
  const isEditing = !!params?.id;
  const id = isEditing ? parseInt(params.id!, 10) : 0;

  const { data: series, isLoading: seriesLoading } = useSingleSeries(id);
  const { mutate: createSeries, isPending: isCreating } = useCreateSeriesMutation();
  const { mutate: updateSeries, isPending: isUpdating } = useUpdateSeriesMutation(id);

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  useEffect(() => {
    if (isEditing && series) {
      reset({
        name: series.name,
        description: series.description,
      });
    }
  }, [isEditing, series, reset]);

  const onSubmit = (data: SeriesFormData) => {
    if (isEditing) {
      updateSeries(data);
    } else {
      createSeries(data);
    }
  };

  if (isEditing && seriesLoading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_20px_rgba(229,9,20,0.2)]">
              <FolderPlus className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">
                {isEditing ? "Edit Series" : "Create New Series"}
              </h1>
              <p className="text-zinc-400 mt-1">Group your books together for a unified display.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Series Name <span className="text-primary">*</span></label>
              <input 
                {...register("name")}
                className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-4 text-white text-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-display"
                placeholder="e.g. The Lord of the Rings"
              />
              {errors.name && <p className="text-primary text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <textarea 
                {...register("description")}
                rows={4}
                className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                placeholder="Optional description of the series..."
              />
            </div>

            <div className="pt-8 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-md font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none shadow-lg shadow-primary/25"
              >
                <Save className="w-5 h-5" />
                {isPending ? "Saving..." : "Save Series"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
