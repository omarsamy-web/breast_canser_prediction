import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Analysis from "./pages/Analysis.jsx";
import Prediction from "./pages/Prediction.jsx";
import Evaluation from "./pages/Evaluation.jsx";
import History from "./pages/History.jsx";
import Billing from "./pages/Billing.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Protected({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="prediction" element={<Prediction />} />
        <Route path="evaluation" element={<Evaluation />} />
        <Route path="history" element={<History />} />
        <Route path="billing" element={<Billing />} />
        <Route path="admin" element={<AdminPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
