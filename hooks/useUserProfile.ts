"use client";

import { useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  tutor: "alex" | "rachel";
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("turingcall_profile");
    if (saved) setProfile(JSON.parse(saved));
    setLoaded(true);
  }, []);

  const saveProfile = (p: UserProfile) => {
    localStorage.setItem("turingcall_profile", JSON.stringify(p));
    setProfile(p);
  };

  const clearProfile = () => {
    localStorage.removeItem("turingcall_profile");
    setProfile(null);
  };

  return { profile, saveProfile, clearProfile, loaded };
}
