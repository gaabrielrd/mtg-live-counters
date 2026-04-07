import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthPage } from "@/routes/AuthPage";
import { HomePage } from "@/routes/HomePage";
import { PlaceholderPage } from "@/routes/PlaceholderPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="/auth"
          element={<AuthPage />}
        />
        <Route
          path="/matches"
          element={
            <PlaceholderPage
              title="Match experience"
              description="Match creation, join-by-code, and life total management will grow from this module."
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
