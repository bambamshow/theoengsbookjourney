import { useSeries } from "@/hooks/use-series";
import { Layout } from "@/components/layout";
import { Loader } from "@/components/ui/loader";
import { Link } from "wouter";
import { FolderOpen, Edit, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { useDeleteSeriesMutation } from "@/hooks/use-series";
import { useAdmin } from "@/context/admin-context";

export default function SeriesList() {
  const { data: seriesList, isLoading } = useSeries();
  const { mutate: deleteSeries, isPending: isDeleting } = useDeleteSeriesMutation();
  const { isAdmin } = useAdmin();

  if (isLoading) return <Layout><Loader /></Layout>;

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-display font-bold text-white">Series</h1>
          {isAdmin && (
            <Link 
              href="/series/new"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              Create Series
            </Link>
          )}
        </div>

        {(!seriesList || seriesList.length === 0) ? (
          <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
            <FolderOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No series created yet</h2>
            <p className="text-zinc-400">Group your books into series to display them in rows on your homepage.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {seriesList.map((series, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={series.id}
                className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-900 transition-colors group"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{series.name}</h3>
                  {series.description && (
                    <p className="text-zinc-400 text-sm line-clamp-2">{series.description}</p>
                  )}
                  <div className="text-xs text-zinc-500 mt-2">
                    Created {new Date(series.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center gap-3 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      href={`/series/${series.id}/edit`}
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete series "${series.name}"? Books in this series will not be deleted, but will become standalone.`)) {
                          deleteSeries(series.id);
                        }
                      }}
                      disabled={isDeleting}
                      className="p-3 rounded-full bg-destructive/10 hover:bg-destructive/80 text-destructive border border-transparent hover:border-destructive/50 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
