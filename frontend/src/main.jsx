import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import RegistrationPage from "./Components/RegistrationPage";
import AdminLogin from "./Components/AdminLogin";
import AdminLayout from "./Components/AdminLayout";
import AdminDashboard from "./Pages/AdminDashboard";
import CreateEvent from "./Pages/CreateEvent";
import Events from "./Pages/Events";
import Registrations from "./Pages/Registrations";
import Analytics from "./Pages/Analytics";
import Settings from "./Pages/Settings";
import EditEvent from "./Pages/EditEvent";

import ProtectedRoute from "./ProtectedRoute";
import ScrollToTop from "./Components/ScrollToTop";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="events" element={<Events />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="edit-event/:id" element={<EditEvent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
