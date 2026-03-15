import { Loader2 } from "lucide-react";

export function Loader() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-400">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="font-medium animate-pulse">Loading content...</p>
    </div>
  );
}
