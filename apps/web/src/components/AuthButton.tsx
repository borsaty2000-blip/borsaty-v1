"use client";

import { useAuth, UserButton, SignInButton } from "@clerk/nextjs";
import { User } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AuthButton() {
  const { isSignedIn, isLoaded } = useAuth();
  const { language } = useApp();

  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-lg ring-2 ring-emerald-500/30",
            },
          }}
        />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-600/20">
        <User className="w-3.5 h-3.5" />
        <span>{language === "ar" ? "تسجيل الدخول" : "Sign In"}</span>
      </button>
    </SignInButton>
  );
}
