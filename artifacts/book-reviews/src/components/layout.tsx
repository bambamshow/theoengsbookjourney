import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BookOpen, Plus, LogIn, LogOut, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/context/admin-context";
import { LoginModal } from "@/components/login-modal";
import { EntryModal } from "@/components/entry-modal";

export function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const [showLogin, setShowLogin] = useState(false);
  const { isAdmin, logout, showEntry, reopenEntry } = useAdmin();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Dynamic Navigation Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/90 backdrop-blur-md shadow-lg shadow-black/50 py-3" 
            : "bg-gradient-to-b from-black/80 to-transparent py-5"
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => { navigate("/"); reopenEntry(); }}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,9,20,0.5)] transition-transform group-hover:scale-110">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-xl tracking-wider text-white">
                MY<span className="text-primary">SHELF</span>
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link 
                href="/" 
                className={`transition-colors hover:text-white ${location === '/' ? 'text-white' : 'text-zinc-400'}`}
              >
                Home
              </Link>
              <Link 
                href="/series" 
                className={`transition-colors hover:text-white ${location === '/series' ? 'text-white' : 'text-zinc-400'}`}
              >
                Series
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  <span className="hidden sm:inline">Admin</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    reopenEntry();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-zinc-400 hover:text-white border border-white/5 hover:border-white/15 transition-all text-sm"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-zinc-500 hover:text-zinc-300 border border-white/5 hover:border-white/10 transition-all text-sm"
                title="Admin login"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <footer className="mt-24 py-12 border-t border-white/5 bg-black">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} MyShelf. Designed for cinephile readers.</p>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showEntry && <EntryModal />}
    </div>
  );
}
