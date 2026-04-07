import { BrowserRouter } from "react-router-dom";
import { AuthSessionProvider } from "@/auth/auth-session";
import { AppRoutes } from "@/routes/AppRoutes";

export function App() {
  return (
    <AuthSessionProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthSessionProvider>
  );
}
