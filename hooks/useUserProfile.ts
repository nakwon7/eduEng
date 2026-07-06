"use client";

import { useState, useEffect } from "react";

export interface UserProfile {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("edueng_profile");
    if (saved) setProfile(JSON.parse(saved));
    setLoaded(true);
  }, []);

  const saveProfile = (p: UserProfile) => {
    localStorage.setItem("edueng_profile", JSON.stringify(p));
    setProfile(p);
  };

  const clearProfile = () => {
    localStorage.removeItem("edueng_profile");
    setProfile(null);
  };

  return { profile, saveProfile, clearProfile, loaded };
}
