import { useState } from "react";
import { BookOpen, Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import { useAdmin } from "@/context/admin-context";
import { motion, AnimatePresence } from "framer-motion";

export function EntryModal() {
  const { dismissEntry, login } = useAdmin();
  const [mode, setMode] = useState<"choose" | "login">("choose");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (!ok) {
      setError("Incorrect password.");
      setPassword("");
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 backdrop-blur-md bg-black/60" />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_24px_rgba(229,9,20,0.3)]">
                <BookOpen className="w-7 h-7 text-primary" />
              </div>
            </div>
            <h1 className="font-display font-bold text-2xl text-white tracking-wide">
              MY<span className="text-primary">SHELF</span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1">THEOENG's Book Journey</p>
          </div>

          {/* Body */}
          <div className="px-8 py-7">
            <AnimatePresence mode="wait">
              {mode === "choose" ? (
                <motion.div
                  key="choose"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-zinc-400 text-sm text-center mb-2">How would you like to continue?</p>

                  <button
                    onClick={dismissEntry}
                    className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 transition-all text-left"
                  >
                    <div>
                      <div className="text-white font-semibold text-sm">Browse as Visitor</div>
                      <div className="text-zinc-500 text-xs mt-0.5">Read reviews and leave comments</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => setMode("login")}
                    className="group w-full flex items-center justify-between px-5 py-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 transition-all text-left"
                  >
                    <div>
                      <div className="text-primary font-semibold text-sm">Admin Login</div>
                      <div className="text-primary/60 text-xs mt-0.5">Manage and add books to your shelf</div>
                    </div>
                    <Lock className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => { setMode("choose"); setError(""); setPassword(""); }}
                    className="text-zinc-500 hover:text-zinc-300 text-xs mb-4 transition-colors flex items-center gap-1"
                  >
                    ← Back
                  </button>

                  <p className="text-white font-semibold text-sm mb-4">Enter your admin password</p>

                  <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoFocus
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {error && <p className="text-primary text-xs">{error}</p>}

                    <button
                      type="submit"
                      disabled={loading || !password}
                      className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {loading ? "Verifying..." : "Log In as Admin"}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
