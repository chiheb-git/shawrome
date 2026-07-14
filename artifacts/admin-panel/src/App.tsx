import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from './components/theme-provider';
import { AuthGuard } from './components/auth-guard';
import { Shell } from './components/layout';

import Login from './pages/login';
import Dashboard from './pages/dashboard';
import CarsList from './pages/cars/list';
import CarNew from './pages/cars/new';
import CarDetail from './pages/cars/detail';
import PriceHistory from './pages/price-history';
import SalesList from './pages/sales';
import SellersList from './pages/sellers';
import Settings from './pages/settings';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Shell>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/cars" component={CarsList} />
            <Route path="/cars/new" component={CarNew} />
            <Route path="/cars/:id" component={CarDetail} />
            <Route path="/price-history" component={PriceHistory} />
            <Route path="/sales" component={SalesList} />
            <Route path="/sellers" component={SellersList} />
            <Route path="/settings" component={Settings} />
            <Route component={Dashboard} />
          </Switch>
        </Shell>
      </Route>
      {/* Fallback to shell structure so unmatched routes also get shell if authed */}
      <Route>
        <Shell>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/cars" component={CarsList} />
            <Route path="/cars/new" component={CarNew} />
            <Route path="/cars/:id" component={CarDetail} />
            <Route path="/price-history" component={PriceHistory} />
            <Route path="/sales" component={SalesList} />
            <Route path="/sellers" component={SellersList} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AuthGuard>
              <Router />
            </AuthGuard>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
