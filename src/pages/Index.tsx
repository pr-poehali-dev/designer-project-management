import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import CRMLayout from "@/components/CRMLayout";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <CRMLayout onLogout={() => setIsLoggedIn(false)} />;
  }

  return <LandingPage onLogin={() => setIsLoggedIn(true)} />;
};

export default Index;
