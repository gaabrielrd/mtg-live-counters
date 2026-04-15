import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthSessionProvider } from "@/auth/auth-session";
import { AppRoutes } from "@/routes/AppRoutes";

export function App() {
  return (
    <AuthSessionProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthSessionProvider>
  );
}
