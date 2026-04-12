import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import CRMLayout from "@/components/CRMLayout";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("logged_in") === "true");

  const handleLogin = () => {
    localStorage.setItem("logged_in", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("logged_in");
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return <CRMLayout onLogout={handleLogout} />;
  }

  return <LandingPage onLogin={handleLogin} />;
};

export default Index;