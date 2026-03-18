import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminProvider } from "@/context/admin-context";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import BookDetail from "@/pages/book-detail";
import BookForm from "@/pages/book-form";
import SeriesForm from "@/pages/series-form";
import SeriesList from "@/pages/series-list";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/book/new" component={BookForm} />
      <Route path="/book/:id" component={BookDetail} />
      <Route path="/book/:id/edit" component={BookForm} />
      
      <Route path="/series" component={SeriesList} />
      <Route path="/series/new" component={SeriesForm} />
      <Route path="/series/:id/edit" component={SeriesForm} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;
