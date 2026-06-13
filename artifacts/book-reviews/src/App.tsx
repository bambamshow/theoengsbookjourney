import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminProvider } from "@/context/admin-context";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import BookDetail from "@/pages/book-detail";
import BookForm from "@/pages/book-form";
import SeriesForm from "@/pages/series-form";
import SeriesList from "@/pages/series-list";

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
    <AdminProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AdminProvider>
  );
}

export default App;
