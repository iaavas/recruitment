import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import CandidatesListPage from "./pages/CandidatesListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/candidates" element={<CandidatesListPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/candidates" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
