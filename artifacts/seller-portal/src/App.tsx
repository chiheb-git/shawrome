import { useEffect, useState } from "react";
import { Route, Switch, Redirect } from "wouter";
import { initAuth, getCurrentUser, type SellerUser } from "@/lib/auth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MesVoitures from "@/pages/MesVoitures";
import MesVentes from "@/pages/MesVentes";
import Parametres from "@/pages/Parametres";
import Layout from "@/components/Layout";

initAuth();

function useAuthGuard() {
  const [user, setUser] = useState<SellerUser | null | "loading">("loading");

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  return user;
}

function ProtectedApp() {
  const user = useAuthGuard();

  if (user === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout user={user}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/voitures" component={MesVoitures} />
        <Route path="/ventes" component={MesVentes} />
        <Route path="/parametres" component={Parametres} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route>
        <ProtectedApp />
      </Route>
    </Switch>
  );
}
