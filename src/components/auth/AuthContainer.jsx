import React, { useState } from "react";
import { Login } from "./Login";
import { SignUp } from "./SignUp";

export function AuthContainer({ onLogin }) {
  const [view, setView] = useState("login"); // 'login' | 'signup'
  const [bannerMessage, setBannerMessage] = useState("");

  const handleSignUpSuccess = (newUser) => {
    setBannerMessage(`Account created successfully for ${newUser.name}. Please sign in to continue.`);
    setView("login");
  };

  if (view === "signup") {
    return (
      <SignUp
        onSignUpSuccess={handleSignUpSuccess}
        onNavigateToLogin={() => {
          setBannerMessage("");
          setView("login");
        }}
      />
    );
  }

  return (
    <Login
      onLogin={onLogin}
      bannerMessage={bannerMessage}
      clearBannerMessage={() => setBannerMessage("")}
      onNavigateToSignUp={() => {
        setBannerMessage("");
        setView("signup");
      }}
    />
  );
}
