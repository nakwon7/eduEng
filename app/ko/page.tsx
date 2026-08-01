"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import CopyButton from "@/components/CopyButton";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useMonthlyBg } from "@/hooks/useMonthlyBg";
import { useAudioRecorderKo } from "@/hooks/useAudioRecorderKo";
import { useKoreanSpeech } from "@/hooks/useKoreanSpeech";
import TranscriptBox, { Message } from "@/components/TranscriptBox";
import TermsModalEn from "@/components/TermsModalEn";
import TutorAvatar from "@/components/TutorAvatar";
import UsageHistory from "@/components/UsageHistory";
import ChangePassword from "@/components/ChangePassword";
import PaymentNoteInput from "@/components/PaymentNoteInput";
import PaymentRejectNotice from "@/components/PaymentRejectNotice";

type CallState = "idle" | "calling" | "active";

type KoProfile = {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  tutor: "minjun" | "jia";
};

const KO_TOPICS = [
  {
    id: "greetings", label: "Greetings", value: "Greetings & Introductions (인사)",
    color: "bg-blue-500/15 text-blue-400",
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    id: "daily", label: "Daily Life", value: "Daily Conversation (일상대화)",
    color: "bg-orange-500/15 text-orange-400",
    icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
  },
  {
    id: "food", label: "Food", value: "Food & Restaurants (음식/식당)",
    color: "bg-yellow-500/15 text-yellow-400",
    icon: <><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></>,
  },
  {
    id: "shopping", label: "Shopping", value: "Shopping (쇼핑)",
    color: "bg-rose-500/15 text-rose-400",
    icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  },
  {
    id: "kdrama", label: "K-Drama", value: "K-Drama & K-Pop Phrases",
    color: "bg-purple-500/15 text-purple-400",
    icon: <><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>,
  },
  {
    id: "transport", label: "Transport", value: "Transportation in Korea (교통)",
    color: "bg-cyan-500/15 text-cyan-400",
    icon: <><rect x="4" y="3" width="16" height="14" rx="3" /><path d="M4 11h16" /><circle cx="8.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><path d="M8 21l-2-3M16 21l2-3" /></>,
  },
  {
    id: "culture", label: "Culture", value: "Korean Culture (한국 문화)",
    color: "bg-amber-500/15 text-amber-400",
    icon: <><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 21 8 3 8" /></>,
  },
  {
    id: "word", label: "Word Practice", value: "Word Practice",
    color: "bg-fuchsia-500/15 text-fuchsia-400",
    icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  },
];

export default function KoPage() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>("idle");
  const [topic, setTopic] = useState(KO_TOPICS[0].value);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [profile, setProfile] = useState<KoProfile>({ name: "Student", level: "beginner", tutor: "minjun" });
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [trialCalls, setTrialCalls] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [trialMinutes, setTrialMinutes] = useState(5);
  const [weeklySeconds, setWeeklySeconds] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const monthlyBg = useMonthlyBg();
  const [micError, setMicError] = useState(false);
  const [micPermState, setMicPermState] = useState<PermissionState | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showMembershipAlert, setShowMembershipAlert] = useState(false);
  const [paymentRequestedAt, setPaymentRequestedAt] = useState<string | null>(null);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRejectReason, setPaymentRejectReason] = useState<string | null>(null);

  const callDurationRef = useRef(0);
  const callStateRef = useRef<CallState>("idle");
  const messagesRef = useRef<Message[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const membershipAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTrialCallRef = useRef(false);
  const lastSavedRef = useRef(0);

  const { isRecording, isTranscribing, startRecording, stopRecording, consumeRateLimited } = useAudioRecorderKo();
  const { speak, stop: stopSpeaking, unlock: unlockTTS, isSpeaking } = useKoreanSpeech();

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const effectiveTutor = isMobile ? "jia" : profile.tutor;
  const isPaymentExempt = username === "gooster" || username === "mh1104";

  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!session) { router.push("/login/ko"); return; }

        const storedToken = localStorage.getItem("turingcall_session");
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, name, level, ko_tutor, session_token, expires_at, unlimited, blocked, trial_calls, trial_minutes, ko_access, payment_requested_at, payment_reject_reason, streak_count")
          .eq("id", session.user.id)
          .single();

        if (!profileData || profileData.session_token !== storedToken || (!profileData.ko_access && profileData.username !== "gooster")) {
          router.push("/app");
          return;
        }

        setUserId(session.user.id);
        setSessionToken(storedToken);
        setUsername(profileData.username);
        setExpiresAt(profileData.expires_at ?? null);
        setUnlimited(profileData.unlimited ?? false);
        setBlocked(profileData.blocked ?? false);
        setTrialCalls(profileData.trial_calls ?? 0);
        setTrialMinutes(profileData.trial_minutes ?? 5);
        setStreakCount(profileData.streak_count ?? 0);
        setPaymentRequestedAt(profileData.payment_requested_at ?? null);
        setPaymentRejectReason(profileData.payment_reject_reason ?? null);
        setProfile({
          name: profileData.name || "Student",
          level: profileData.level || "beginner",
          tutor: profileData.ko_tutor || "minjun",
        });

        if (!profileData.unlimited) {
          let cycleStart: Date;
          if (profileData.expires_at) {
            cycleStart = new Date(new Date(profileData.expires_at).getTime() - 7 * 24 * 60 * 60 * 1000);
          } else {
            const now = new Date();
            const day = now.getDay();
            const diffToMonday = (day + 6) % 7;
            cycleStart = new Date(now);
            cycleStart.setDate(now.getDate() - diffToMonday);
          }
          const cycleStartStr = `${cycleStart.getFullYear()}-${String(cycleStart.getMonth() + 1).padStart(2, "0")}-${String(cycleStart.getDate()).padStart(2, "0")}`;
          const summaryRes = await fetch("/api/usage/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id, sessionToken: storedToken, sinceDate: cycleStartStr }),
          });
          const summaryData = await summaryRes.json();
          setWeeklySeconds(summaryRes.ok ? summaryData.totalSeconds ?? 0 : 0);
        }

        setLoaded(true);
      } else if (event === "SIGNED_OUT") {
        router.push("/login/ko");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const isPaid = !!expiresAt && new Date(expiresAt) > new Date();
  const isUnlimited = unlimited;
  const weeklyLimitReached = !isUnlimited && weeklySeconds >= 12000;
  const canMakeCall = !blocked && !weeklyLimitReached && (isUnlimited || isPaid || trialCalls > 0);

  const requestPaymentConfirmation = async () => {
    if (!userId || !sessionToken || requestingPayment || !paymentNote.trim()) return;
    setRequestingPayment(true);
    const res = await fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, note: paymentNote }),
    });
    if (res.ok) {
      setPaymentRequestedAt(new Date().toISOString());
      setPaymentRejectReason(null);
    }
    setRequestingPayment(false);
  };

  const saveElapsed = useCallback(async () => {
    if (!userId || !sessionToken || callStateRef.current !== "active") return;
    const savedBefore = lastSavedRef.current;
    const unsaved = callDurationRef.current - savedBefore;
    if (unsaved <= 0) return;
    try {
      const res = await fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken, seconds: unsaved, topic }),
      });
      // 성공 확인 후에만 저장 완료로 표시 — 실패 시 다음 저장 시점에 다시 시도됨
      if (res.ok) lastSavedRef.current = savedBefore + unsaved;
    } catch {
      // 네트워크 실패 시 lastSavedRef를 건드리지 않아 다음 저장에서 재시도됨
    }
  }, [userId, sessionToken, topic]);

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    const wasTrial = isTrialCallRef.current;
    isTrialCallRef.current = false;

    const unsaved = callDurationRef.current - lastSavedRef.current;
    lastSavedRef.current = 0;

    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);
    callDurationRef.current = 0;

    if (userId && sessionToken && unsaved > 0) {
      fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken, seconds: unsaved, topic }),
      })
        .then((res) => { if (!res.ok) console.error("[call/end] save failed", res.status); })
        .catch((err) => console.error("[call/end] save error", err));
      setWeeklySeconds((prev) => prev + unsaved);
    }

    if (wasTrial && userId && sessionToken) {
      const res = await fetch("/api/trial/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrialCalls(data.trial_calls);
      }
    }
  }, [stopSpeaking, userId, sessionToken, topic]);

  // 탭 전환 시 즉시 저장
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveElapsed();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveElapsed]);

  // 60초마다 주기적 저장
  useEffect(() => {
    if (callState !== "active") return;
    const interval = setInterval(saveElapsed, 60000);
    return () => clearInterval(interval);
  }, [callState, saveElapsed]);

  // 체험 통화 자동 종료
  useEffect(() => {
    if (callState === "active" && isTrialCallRef.current && callDuration >= trialMinutes * 60) {
      endCall();
      alert(`Your trial call ended after ${trialMinutes} minutes.`);
    }
  }, [callDuration, callState, trialMinutes, endCall]);

  // 주간 200분 한도 자동 종료 (무제한 제외)
  useEffect(() => {
    if (callState === "active" && !unlimited && weeklySeconds + callDuration >= 12000) {
      endCall();
      alert("You've used all your time this week (200 minutes). It resets next Monday.");
    }
  }, [callDuration, callState, unlimited, weeklySeconds, endCall]);

  const startCall = useCallback(async () => {
    if (!canMakeCall) return;
    isTrialCallRef.current = !isPaid && !isUnlimited;
    setMicError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      setMicError(true);
      if (navigator.permissions) {
        navigator.permissions.query({ name: "microphone" as PermissionName }).then((r) => setMicPermState(r.state));
      }
      return;
    }
    unlockTTS();
    setCallState("calling");

    const tutorName = effectiveTutor === "jia" ? "지아" : "민준";
    const tutorCopula = effectiveTutor === "jia" ? "지아예요" : "민준이에요";
    const fallbackGreeting = `안녕하세요, ${profile.name}! 저는 ${tutorCopula}. 오늘도 한국어 연습 해봐요!`;

    await new Promise((r) => setTimeout(r, 1500));

    let greeting: string;
    try {
      const res = await fetch("/api/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          firstName: profile.name,
          tutorName,
          tutor: effectiveTutor,
          level: profile.level,
        }),
      });
      const data = await res.json();
      greeting = data.greeting || fallbackGreeting;
    } catch {
      greeting = fallbackGreeting;
    }

    setCallState("active");
    setCallDuration(0);
    callDurationRef.current = 0;
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

    addMessage({ role: "assistant", content: greeting });
    speak(greeting, effectiveTutor === "jia" ? "female" : "male");
  }, [topic, addMessage, speak, profile, unlockTTS, effectiveTutor, canMakeCall, isPaid, isUnlimited]);

  const handleMicPress = useCallback(async () => {
    if (isRecording || isSpeaking) return;
    stopSpeaking();
    await startRecording();
  }, [isRecording, isSpeaking, stopSpeaking, startRecording]);

  const handleMicRelease = useCallback(async () => {
    if (!isRecording) return;

    const userText = (await stopRecording()).trim();
    if (!userText) {
      if (consumeRateLimited()) {
        addMessage({ role: "assistant", content: "죄송해요, 지금 서버가 많이 바빠요. 잠시 후 다시 시도해 주세요." });
      }
      return;
    }

    addMessage({ role: "user", content: userText });
    setIsAiTyping(true);

    const history = messagesRef.current.slice(0, -1);
    const apiMessages = [...history, { role: "user" as const, content: userText }];

    try {
      const res = await fetch("/api/chat-ko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic, profile: { ...profile, tutor: effectiveTutor }, userId, sessionToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "SUBSCRIPTION_EXPIRED") {
          endCall();
          alert("Your membership has expired. Please contact the admin.");
          return;
        }
        if (err.error === "SESSION_EXPIRED") {
          await supabase.auth.signOut();
          router.push("/login/ko");
          return;
        }
        if (err.error === "RATE_LIMIT") {
          setIsAiTyping(false);
          addMessage({ role: "assistant", content: "죄송해요, 지금 서버가 많이 바빠요. 잠시 후 다시 시도해 주세요." });
          return;
        }
        throw new Error("API error");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      const aiMsgIndex = messagesRef.current.length;
      addMessage({ role: "assistant", content: "" });
      setIsAiTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiText += decoder.decode(value, { stream: true });
        messagesRef.current[aiMsgIndex] = { role: "assistant", content: aiText };
        setMessages([...messagesRef.current]);
      }

      speak(aiText, effectiveTutor === "jia" ? "female" : "male");
    } catch {
      setIsAiTyping(false);
      addMessage({ role: "assistant", content: "죄송해요, 다시 말씀해 주세요." });
    }
  }, [isRecording, stopRecording, addMessage, topic, speak, profile, userId, sessionToken, endCall, router]);

  useEffect(() => {
    return () => { if (membershipAlertTimerRef.current) clearTimeout(membershipAlertTimerRef.current); };
  }, []);

  const hasActiveMembership = !blocked && !unlimited && !weeklyLimitReached && !!expiresAt && new Date(expiresAt) > new Date();
  const canSkipPayment = unlimited || hasActiveMembership;

  const handlePaypalClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasActiveMembership) return;
    e.preventDefault();
    setShowMembershipAlert(true);
    if (membershipAlertTimerRef.current) clearTimeout(membershipAlertTimerRef.current);
    membershipAlertTimerRef.current = setTimeout(() => setShowMembershipAlert(false), 2800);
  }, [hasActiveMembership]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isBusy = isTranscribing || isAiTyping || isSpeaking;
  const tutorName = effectiveTutor === "jia" ? "Jia" : "MinJun";

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
        {/* Header (사진 배경이 상단 버튼 영역까지 확장, 이중 그라데이션으로 가독성 확보) */}
        <div className="bg-gray-800 px-6 pt-3 pb-6 text-center relative">
          {monthlyBg && (
            <>
              <Image
                src={`/tutors/bg/${monthlyBg.file}`}
                alt={monthlyBg.label}
                fill
                className="object-cover object-[center_25%]"
                priority
              />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-45% to-gray-900/95" />
            </>
          )}
          <div className="relative z-10">
          {callState === "idle" && (
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={async () => {
                  if (showSetup) { setShowSetup(false); return; }
                  if (username === "gooster") { router.push("/app"); return; }
                  await supabase.auth.signOut();
                  localStorage.removeItem("turingcall_session");
                  router.push("/login/ko");
                }}
                className="text-gray-300 hover:text-white text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]"
              >
                {showSetup || username === "gooster" ? "← Back" : "Logout"}
              </button>
              <button
                onClick={() => setShowSetup(!showSetup)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700/80 hover:bg-gray-600/80 backdrop-blur-sm rounded-xl text-gray-200 text-xs"
              >
                ⚙️ Setup
              </button>
            </div>
          )}
          <TutorAvatar tutor={effectiveTutor} fallbackBg="bg-blue-600" />
          <h1 className="text-white text-lg font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{tutorName}</h1>
          <p className="text-gray-300 text-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">Korean Tutor</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-blue-400 text-xs font-medium bg-blue-900/40 px-2 py-0.5 rounded-full">
              🇰🇷 Korean for Foreigners
            </span>
            {callState === "idle" && streakCount > 0 && (
              <span className="text-orange-400 text-xs font-medium [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">🔥 {streakCount} day streak</span>
            )}
          </div>
          {callState === "active" && (
            <p className="text-green-400 text-sm mt-1 font-mono [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{formatTime(callDuration)}</p>
          )}
          {callState === "calling" && (
            <p className="text-yellow-400 text-sm mt-1 animate-pulse [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">Connecting...</p>
          )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {showSetup && callState === "idle" ? (
            <div className="flex-1 space-y-4">
              <h2 className="text-white text-sm font-bold">Setup</h2>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-400 text-xs">Your Name</label>
                  <span className="text-gray-600 text-xs">{profile.name.length}/20</span>
                </div>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  maxLength={20}
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Korean Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setProfile((p) => ({ ...p, level: lvl }))}
                      className={`py-2 rounded-xl text-xs font-medium transition-all ${
                        profile.level === lvl
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {lvl === "beginner" ? "Beginner" : lvl === "intermediate" ? "Intermediate" : "Advanced"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Tutor</label>
                {isMobile ? (
                  <div className="bg-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
                    Tutor selection is available on PC. On mobile, you'll chat with Jia.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(["minjun", "jia"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setProfile((p) => ({ ...p, tutor: t }))}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
                          profile.tutor === t
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {t === "jia" ? "🌸 Jia" : "🎓 MinJun"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={async () => {
                  if (userId) {
                    await supabase.from("profiles").update({
                      name: profile.name,
                      level: profile.level,
                      ko_tutor: profile.tutor,
                    }).eq("id", userId);
                  }
                  setShowSetup(false);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm"
              >
                Save
              </button>

              <div className="mt-4 bg-gray-900 rounded-xl p-4 space-y-2">
                <p className="text-gray-400 text-xs font-medium">Membership</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-lg font-bold">$3</span>
                  <span className="text-gray-500 text-xs">/ week</span>
                </div>
                <p className="text-gray-500 text-xs">2 free trial sessions (up to 5 min each)</p>
                <a
                  href="https://www.paypal.com/ncp/payment/DC7LDXNCBE4NY"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handlePaypalClick}
                  className="inline-block w-full py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl text-center mt-1"
                >
                  💳 Pay with PayPal
                </a>
                <p className="text-gray-600 text-xs text-center">or bank transfer</p>
                <p className="text-gray-500 text-xs flex items-center gap-1">KB Kookmin Bank 758637-00-012739<CopyButton text="758637-00-012739" label="Copy" copiedLabel="Copied!" /></p>
                <p className="text-gray-500 text-xs">예금주: 송랩</p>
                {isPaymentExempt ? null : canSkipPayment ? (
                  <p className="mt-1 text-green-400 text-xs">
                    ✅ Active membership{expiresAt ? ` — until ${new Date(expiresAt).toLocaleDateString("en-US")}` : ""}
                  </p>
                ) : paymentRequestedAt ? (
                  <p className="mt-1 text-emerald-400 text-xs">✅ Confirmation requested — admin will review shortly</p>
                ) : (
                  <>
                    {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="en" />}
                    <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="email" />
                    <button
                      onClick={requestPaymentConfirmation}
                      disabled={requestingPayment || !paymentNote.trim()}
                      className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                    >
                      {requestingPayment ? "Requesting..." : "✅ I've paid, request confirmation"}
                    </button>
                  </>
                )}
                <a
                  href="https://open.kakao.com/o/sPanl0Ci"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-yellow-400 text-xs hover:text-yellow-300"
                >
                  💬 Contact us (KakaoTalk)
                </a>
              </div>

              {userId && sessionToken && <UsageHistory userId={userId} sessionToken={sessionToken} lang="en" />}
              {userId && sessionToken && <ChangePassword userId={userId} sessionToken={sessionToken} lang="en" />}

              <div className="mt-4">
                <button
                  onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem("turingcall_session"); router.push("/login/ko"); }}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl text-sm"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : callState === "idle" ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Topic selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-sm">Choose a topic</p>
                  <button
                    onClick={() => {
                      const others = KO_TOPICS.filter((t) => t.value !== topic);
                      const pick = others[Math.floor(Math.random() * others.length)];
                      setTopic(pick.value);
                    }}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg"
                  >
                    🎲 Random
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {KO_TOPICS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTopic(t.value)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        topic === t.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${topic === t.value ? "bg-white/15 text-white" : t.color}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                          {t.icon}
                        </svg>
                      </div>
                      <p className="text-sm font-medium mt-1">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs mb-1">
                  Hello, {profile.name} · Level: {profile.level}
                </p>
                {username === "gooster" && !isMobile && (
                  <button
                    onClick={() => router.push("/admin/stats")}
                    className="mt-1 text-emerald-400 hover:text-emerald-300 text-xs"
                  >
                    Stats →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <TranscriptBox messages={messages} interimTranscript="" isAiTyping={isAiTyping || isTranscribing} tutorLabel={`${tutorName} (AI Tutor)`} />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-8 pt-4">
          {callState === "idle" && !showSetup && (
            blocked ? (
              <div className="text-center space-y-2 py-4">
                <p className="text-red-400 text-sm font-medium">Your account has been restricted</p>
                <p className="text-gray-500 text-xs">Please contact the admin</p>
                <a href="https://open.kakao.com/o/sPanl0Ci" target="_blank" rel="noopener noreferrer" className="block text-yellow-400 hover:text-yellow-300 text-xs">
                  Contact us (KakaoTalk) →
                </a>
              </div>
            ) : canMakeCall ? (
            <>
              {!isPaid && !isUnlimited && (
                <p className="text-yellow-400 text-xs text-center mb-2">
                  {trialCalls} trial session{trialCalls === 1 ? "" : "s"} left · up to {trialMinutes} min each
                </p>
              )}
              {hasActiveMembership && (
                <div className="bg-gray-800 rounded-xl px-4 py-2 mb-2 text-center">
                  <p className="text-blue-400 text-xs font-medium">Active membership</p>
                  <p className="text-gray-300 text-xs mt-0.5">
                    Until {new Date(expiresAt!).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
              {!isUnlimited && isPaid && (
                <p className="text-gray-500 text-xs text-center mb-2">
                  {Math.floor(weeklySeconds / 60)} min used this week · {Math.max(0, 200 - Math.floor(weeklySeconds / 60))} min left
                </p>
              )}
              {micError && (
                <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-3 text-center space-y-2">
                  <p className="text-red-400 text-sm">🎙️ Microphone permission required</p>
                  {micPermState === "denied" ? (
                    <>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        Microphone is blocked.<br />
                        {isMobile
                          ? <>Chrome → Menu(⋮) → Settings →<br />Site settings → Microphone → Allow</>
                          : <>Click the lock(🔒) in the address bar → Microphone → Allow</>
                        }
                      </p>
                      <p className="text-gray-600 text-xs">After changing settings, tap the button below</p>
                      <button onClick={startCall} className="mt-1 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-medium">
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 text-xs">Tap the button below to allow microphone access</p>
                      <button onClick={startCall} className="mt-1 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">
                        🎙️ Allow Microphone
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={startCall}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg"
              >
                📞 Start Call
              </button>
            </>
            ) : weeklyLimitReached ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-orange-400 text-sm font-medium">You&apos;ve used all your time for this billing period (200 min)</p>
                <p className="text-gray-500 text-xs">
                  {expiresAt
                    ? <>It normally resets when your membership renews (current period ends {new Date(expiresAt).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })})</>
                    : "It resets next Monday"}
                </p>
                <p className="text-gray-400 text-xs">Want more time now? Pay early for extra minutes.</p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <a
                    href="https://www.paypal.com/ncp/payment/DC7LDXNCBE4NY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg text-center mb-1"
                  >
                    💳 Pay with PayPal
                  </a>
                  <p className="flex items-center justify-center gap-1">KB Kookmin Bank 758637-00-012739<CopyButton text="758637-00-012739" label="Copy" copiedLabel="Copied!" /></p>
                  <p>예금주: 송랩</p>
                  {isPaymentExempt ? null : paymentRequestedAt ? (
                    <p className="pt-1 text-emerald-400 text-xs">✅ Confirmation requested — admin will review shortly</p>
                  ) : (
                    <>
                      {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="en" />}
                      <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="email" />
                      <button
                        onClick={requestPaymentConfirmation}
                        disabled={requestingPayment || !paymentNote.trim()}
                        className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                      >
                        {requestingPayment ? "Requesting..." : "✅ I've paid, request confirmation"}
                      </button>
                    </>
                  )}
                  <a
                    href="https://open.kakao.com/o/sPanl0Ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-yellow-400 hover:text-yellow-300 pt-1"
                  >
                    Contact us after payment (KakaoTalk) →
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-white text-sm font-medium">You&apos;ve used all your trial sessions</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Subscribe to continue<br />$3 / week
                </p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <a
                    href="https://www.paypal.com/ncp/payment/DC7LDXNCBE4NY"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg text-center mb-1"
                  >
                    💳 Pay with PayPal
                  </a>
                  <p className="flex items-center justify-center gap-1">KB Kookmin Bank 758637-00-012739<CopyButton text="758637-00-012739" label="Copy" copiedLabel="Copied!" /></p>
                  <p>예금주: 송랩</p>
                  {isPaymentExempt ? null : paymentRequestedAt ? (
                    <p className="pt-1 text-emerald-400 text-xs">✅ Confirmation requested — admin will review shortly</p>
                  ) : (
                    <>
                      {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="en" />}
                      <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="email" />
                      <button
                        onClick={requestPaymentConfirmation}
                        disabled={requestingPayment || !paymentNote.trim()}
                        className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                      >
                        {requestingPayment ? "Requesting..." : "✅ I've paid, request confirmation"}
                      </button>
                    </>
                  )}
                  <a
                    href="https://open.kakao.com/o/sPanl0Ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-yellow-400 hover:text-yellow-300 pt-1"
                  >
                    Contact us after payment (KakaoTalk) →
                  </a>
                </div>
              </div>
            )
          )}

          {callState !== "idle" && (
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 shadow-lg"
              >
                📵
              </button>
              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
                disabled={callState === "calling" || (isBusy && !isRecording)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg select-none ${
                  isRecording ? "bg-red-500 scale-110 ring-4 ring-red-400 ring-opacity-50"
                  : isBusy ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 active:scale-95"
                }`}
              >
                {isRecording ? "🔴" : isTranscribing ? "⏳" : isSpeaking ? "🔊" : "🎤"}
              </button>
              <div className="w-16 h-16" />
            </div>
          )}

          {callState === "active" && (
            <p className="text-gray-500 text-xs text-center mt-3">
              {isRecording ? "Listening... release to send"
                : isTranscribing ? "Recognizing Korean..."
                : isAiTyping ? `${tutorName} is thinking...`
                : isSpeaking ? `${tutorName} is speaking...`
                : "Hold the mic button and speak in Korean"}
            </p>
          )}
        </div>

        {/* Business Info */}
        <div className="px-4 pb-4 text-center space-y-0.5">
          <p className="text-gray-700 text-xs">SongLab · Business Reg. No.: 857-28-01961</p>
          <p className="text-gray-700 text-xs">
            <button onClick={() => setShowTerms(true)} className="hover:text-gray-500">Terms &amp; Privacy Policy</button>
          </p>
        </div>

        {showTerms && <TermsModalEn onClose={() => setShowTerms(false)} />}

        <div
          className={`fixed left-1/2 bottom-24 z-50 -translate-x-1/2 transition-all duration-300 ease-out ${
            showMembershipAlert ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="bg-gray-800 border border-blue-700 text-white text-xs px-4 py-3 rounded-xl shadow-xl max-w-[260px] text-center">
            You already have an active membership.<br />No need to pay again yet.
          </div>
        </div>
      </div>
    </main>
  );
}
