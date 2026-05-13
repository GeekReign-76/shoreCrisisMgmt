import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/layout/Navbar";
import Breadcrumbs from "./components/layout/Breadcrumbs";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import InsurancePage from "./pages/InsurancePage";
import CrisisPage from "./pages/CrisisPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import BookingPage from "./pages/BookingPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import ClientsPage from "./pages/ClientsPage";
import "./styles/variables.css";
import "./styles/responsive.css";
import "./styles/darkmode.css";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Navbar />
          <Breadcrumbs />
          <main>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/insurance" element={<InsurancePage />} />
              <Route path="/crisis" element={<CrisisPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Owner */}
              <Route path="/dashboard" element={
                <ProtectedRoute role="owner"><OwnerDashboard /></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute role="owner"><SettingsPage /></ProtectedRoute>
              } />
              <Route path="/clients" element={
                <ProtectedRoute role="owner"><ClientsPage /></ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute role="owner"><ReportsPage /></ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute role="owner"><ProfilePage /></ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute role="admin"><AdminPage /></ProtectedRoute>
              } />

              {/* Client */}
              <Route path="/client" element={
                <ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>
              } />
              <Route path="/my-profile" element={
                <ProtectedRoute role="client"><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/booking" element={
                <ProtectedRoute><BookingPage /></ProtectedRoute>
              } />

              {/* Shared auth */}
              <Route path="/messages" element={
                <ProtectedRoute><MessagesPage /></ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </SocketProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
