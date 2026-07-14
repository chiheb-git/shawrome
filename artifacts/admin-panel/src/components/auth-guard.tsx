import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getMe, setAuthTokenGetter } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("shawrome_token"));

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("shawrome_token");
    if (!token) {
      if (location !== "/login") {
        setLocation("/login");
      }
      setIsChecking(false);
      return;
    }

    getMe()
      .then(() => {
        setIsAuthenticated(true);
        if (location === "/login" || location === "/") {
          setLocation("/dashboard");
        }
      })
      .catch(() => {
        localStorage.removeItem("shawrome_token");
        setLocation("/login");
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [location, setLocation]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-sm text-muted-foreground font-mono">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  // If on login page and not authenticated, just render children (login page)
  if (!isAuthenticated && location === "/login") {
    return <>{children}</>;
  }

  return isAuthenticated ? <>{children}</> : null;
}
