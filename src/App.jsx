import "./App.css";
import { Route, Routes, Navigate } from "react-router-dom";
import React from "react";

import { LoginPage } from "./pages/LoginPage";
import { DashBoard } from "./pages/DashBoard";
import { PrivateRoute } from "./pages/PrivateRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashBoard />
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
