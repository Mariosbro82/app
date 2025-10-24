import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/CookieBanner";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Home from "@/pages/home";
import Questions from "@/pages/questions";
import DebugImages from "@/pages/debug-images";
import TaxCalculatorPage from "@/pages/TaxCalculatorPage";
import NotFound from "@/pages/not-found";
import OnboardingContainer from "@/components/onboarding/OnboardingContainer";

// Lazy load legal pages for better performance
const Impressum = lazy(() => import("@/pages/impressum"));
const Datenschutz = lazy(() => import("@/pages/datenschutz"));
const AGB = lazy(() => import("@/pages/agb"));

// Loading component for legal pages
const LegalPageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8">
    <div className="container mx-auto px-4 max-w-4xl">
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Seite wird geladen...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Home} /> {/* Onboarding is handled by OnboardingContainer */}
      <Route path="/questions" component={Questions} />
      <Route path="/debug" component={DebugImages} />
      <Route path="/tax-calculator" component={TaxCalculatorPage} />
      <Route path="/impressum">
        <Suspense fallback={<LegalPageLoader />}>
          <Impressum />
        </Suspense>
      </Route>
      <Route path="/datenschutz">
        <Suspense fallback={<LegalPageLoader />}>
          <Datenschutz />
        </Suspense>
      </Route>
      <Route path="/agb">
        <Suspense fallback={<LegalPageLoader />}>
          <AGB />
        </Suspense>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OnboardingContainer>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <main className="flex-1">
              <AppRouter />
            </main>
            <Footer />
          </div>
          <CookieBanner />
        </OnboardingContainer>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App;
