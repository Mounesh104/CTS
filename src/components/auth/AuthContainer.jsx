import React, { useState } from "react";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import { OtpVerification } from "./OtpVerification";

export function AuthContainer({ onLogin }) {
  const [view, setView] = useState("login"); // 'login' | 'signup' | 'otp'
  const [bannerMessage, setBannerMessage] = useState("");
  const [pendingAuth, setPendingAuth] = useState(null);

  // Initiated from Login screen
  const handleInitiateLogin = (userData) => {
    setPendingAuth({
      flow: "login",
      userDetails: userData
    });
    setView("otp");
  };

  // Initiated from SignUp screen
  const handleInitiateSignUp = (userData) => {
    setPendingAuth({
      flow: "signup",
      userDetails: userData
    });
    setView("otp");
  };

  // OTP Verified Successfully
  const handleOtpVerified = (otpCode) => {
    if (!pendingAuth) return;

    if (pendingAuth.flow === "login") {
      onLogin(pendingAuth.userDetails);
    } else if (pendingAuth.flow === "signup") {
      setBannerMessage(`Account created & OTP verified successfully for ${pendingAuth.userDetails.name}. Please sign in.`);
      setView("login");
      setPendingAuth(null);
    }
  };

  if (view === "otp" && pendingAuth) {
    return (
      <OtpVerification
        email={pendingAuth.userDetails.email}
        flowType={pendingAuth.flow}
        onVerifySuccess={handleOtpVerified}
        onBack={() => {
          setView(pendingAuth.flow);
        }}
      />
    );
  }

  if (view === "signup") {
    return (
      <SignUp
        onSignUpSuccess={handleInitiateSignUp}
        onNavigateToLogin={() => {
          setBannerMessage("");
          setView("login");
        }}
      />
    );
  }

  return (
    <Login
      onLogin={handleInitiateLogin}
      bannerMessage={bannerMessage}
      clearBannerMessage={() => setBannerMessage("")}
      onNavigateToSignUp={() => {
        setBannerMessage("");
        setView("signup");
      }}
    />
  );
}
