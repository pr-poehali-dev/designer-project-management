import { useState, useEffect } from "react";
import LandingPage from "@/components/LandingPage";
import CRMLayout from "@/components/CRMLayout";
import { getSession, clearSession, verifySession } from "@/lib/designerAuth";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) { setChecking(false); return; }
    verifySession().then(valid => {
      if (valid) {
        setIsLoggedIn(true);
      } else {
        clearSession();
      }
      setChecking(false);
    });
  }, []);

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    clearSession();
    setIsLoggedIn(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-snow">
        <div className="w-6 h-6 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoggedIn) {
    return <CRMLayout onLogout={handleLogout} />;
  }

  return <LandingPage onLogin={handleLogin} />;
};

export default Index;
