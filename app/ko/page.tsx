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
import { TRIAL_TOTAL_SECONDS } from "@/lib/trialCalc";

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
    cardTint: "bg-blue-500/5 border-blue-500/15",
    icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  },
  {
    id: "daily", label: "Daily Life", value: "Daily Conversation (일상대화)",
    color: "bg-orange-500/15 text-orange-400",
    cardTint: "bg-orange-500/5 border-orange-500/15",
    icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
  },
  {
    id: "food", label: "Food", value: "Food & Restaurants (음식/식당)",
    color: "bg-yellow-500/15 text-yellow-400",
    cardTint: "bg-yellow-500/5 border-yellow-500/15",
    icon: <><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" /></>,
  },
  {
    id: "shopping", label: "Shopping", value: "Shopping (쇼핑)",
    color: "bg-rose-500/15 text-rose-400",
    cardTint: "bg-rose-500/5 border-rose-500/15",
    icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  },
  {
    id: "kdrama", label: "K-Drama", value: "K-Drama & K-Pop Phrases",
    color: "bg-purple-500/15 text-purple-400",
    cardTint: "bg-purple-500/5 border-purple-500/15",
    icon: <><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /></>,
  },
  {
    id: "transport", label: "Transport", value: "Transportation in Korea (교통)",
    color: "bg-cyan-500/15 text-cyan-400",
    cardTint: "bg-cyan-500/5 border-cyan-500/15",
    icon: <><rect x="4" y="3" width="16" height="14" rx="3" /><path d="M4 11h16" /><circle cx="8.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><path d="M8 21l-2-3M16 21l2-3" /></>,
  },
  {
    id: "culture", label: "Culture", value: "Korean Culture (한국 문화)",
    color: "bg-amber-500/15 text-amber-400",
    cardTint: "bg-amber-500/5 border-amber-500/15",
    icon: <><line x1="3" y1="22" x2="21" y2="22" /><line x1="6" y1="18" x2="6" y2="11" /><line x1="10" y1="18" x2="10" y2="11" /><line x1="14" y1="18" x2="14" y2="11" /><line x1="18" y1="18" x2="18" y2="11" /><polygon points="12 2 21 8 3 8" /></>,
  },
  {
    id: "word", label: "Word Practice", value: "Word Practice",
    color: "bg-fuchsia-500/15 text-fuchsia-400",
    cardTint: "bg-fuchsia-500/5 border-fuchsia-500/15",
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
  // /ko는 배경 테마 선택 팝업이 따로 없지만, /app 설정에서 고른 값은 같은 계정이면
  // 여기서도 그대로 반영되도록 읽기만 한다
  const [bgTheme, setBgTheme] = useState<number | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [trialSecondsLeft, setTrialSecondsLeft] = useState(0);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [weeklySeconds, setWeeklySeconds] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const monthlyBg = useMonthlyBg(bgTheme);
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
  const callStartWeeklySecondsRef = useRef(0);
  const callStartTrialSecondsLeftRef = useRef(0);

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
          .select("username, name, level, ko_tutor, bg_theme, session_token, expires_at, unlimited, blocked, ko_access, payment_requested_at, payment_reject_reason, streak_count, streak_freezes, last_streak_date")
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
        setStreakCount(profileData.streak_count ?? 0);
        setStreakFreezes(profileData.streak_freezes ?? 0);
        setLastStreakDate(profileData.last_streak_date ?? null);
        setPaymentRequestedAt(profileData.payment_requested_at ?? null);
        setPaymentRejectReason(profileData.payment_reject_reason ?? null);
        setProfile({
          name: profileData.name || "Student",
          level: profileData.level || "beginner",
          tutor: profileData.ko_tutor || "minjun",
        });
        setBgTheme(profileData.bg_theme ?? undefined);

        if (!profileData.unlimited) {
          const summaryRes = await fetch("/api/usage/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id, sessionToken: storedToken }),
          });
          const summaryData = await summaryRes.json();
          setWeeklySeconds(summaryRes.ok ? summaryData.totalSeconds ?? 0 : 0);
          setTrialSecondsLeft(summaryRes.ok ? summaryData.trialRemainingSeconds ?? 0 : 0);
          setTrialExpiresAt(summaryRes.ok ? summaryData.trialExpiresAt ?? null : null);
        }

        setLoaded(true);
      } else if (event === "SIGNED_OUT") {
        router.push("/login/ko");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // streak_count는 통화 종료 시(bump_streak)에만 갱신되는 값이라, 마지막 통화 후 며칠이
  // 지나도 다음 통화 전까지는 예전 값이 그대로 남아있음 — 프리즈로 못 버틸 만큼 공백이
  // 벌어졌으면(다음 통화 시 서버가 리셋할 게 확실하면) 배지를 안 보여줌 ([[project_edueng]] 참고,
  // /app과 동일 기준)
  const isStreakAlive = (() => {
    if (!lastStreakDate) return false;
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
    const gapDays = Math.round(
      (new Date(todayStr + "T00:00:00").getTime() - new Date(lastStreakDate + "T00:00:00").getTime()) / 86400000
    );
    const missedDays = Math.max(0, gapDays - 1);
    return missedDays <= streakFreezes;
  })();

  const isPaid = !!expiresAt && new Date(expiresAt) > new Date();
  const isUnlimited = unlimited;
  const weeklyLimitReached = !isUnlimited && weeklySeconds >= 12000;
  const canMakeCall = !blocked && !weeklyLimitReached && (isUnlimited || isPaid || trialSecondsLeft > 0);

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
        keepalive: true, // 탭 숨김/앱 강제종료 직후에도 브라우저가 요청을 이어서 완료시켜줌
      });
      // 성공 확인 후에만 저장 완료로 표시 — 실패 시 다음 저장 시점에 다시 시도됨
      // weeklySeconds도 여기서 같이 올려야 함 — 안 그러면 60초 자동저장분은 서버엔
      // 쌓이는데 화면/한도판정 값엔 반영이 안 돼서 실제 사용량보다 한참 적게 보임
      if (res.ok) {
        lastSavedRef.current = savedBefore + unsaved;
        setWeeklySeconds((prev) => prev + unsaved);
        if (isTrialCallRef.current) setTrialSecondsLeft((prev) => Math.max(0, prev - unsaved));
      }
    } catch {
      // 네트워크 실패 시 lastSavedRef를 건드리지 않아 다음 저장에서 재시도됨
    }
  }, [userId, sessionToken, topic]);

  // 탭 숨김/앱 강제종료 시점 전용 저장 — fetch(keepalive)는 iOS Safari/PWA에서
  // 페이지가 죽는 타이밍과 경쟁해서 실제로는 잘 안 먹히는 경우가 확인됨.
  // sendBeacon은 브라우저가 페이지 종료 이후에도 전송을 보장해주는 표준 API라 이 시점엔 이걸 씀.
  // 응답을 기다릴 수 없는 fire-and-forget이라 성공 여부와 무관하게 낙관적으로 반영한다.
  const saveOnExit = useCallback(() => {
    if (!userId || !sessionToken || callStateRef.current !== "active") return;
    const savedBefore = lastSavedRef.current;
    const unsaved = callDurationRef.current - savedBefore;
    if (unsaved <= 0) return;
    const payload = JSON.stringify({ userId, sessionToken, seconds: unsaved, topic });
    navigator.sendBeacon("/api/call/end", new Blob([payload], { type: "application/json" }));
    lastSavedRef.current = savedBefore + unsaved;
    setWeeklySeconds((prev) => prev + unsaved);
    if (isTrialCallRef.current) setTrialSecondsLeft((prev) => Math.max(0, prev - unsaved));
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
        keepalive: true,
      })
        .then((res) => { if (!res.ok) console.error("[call/end] save failed", res.status); })
        .catch((err) => console.error("[call/end] save error", err));
      setWeeklySeconds((prev) => prev + unsaved);
      if (wasTrial) setTrialSecondsLeft((prev) => Math.max(0, prev - unsaved));
    }
  }, [stopSpeaking, userId, sessionToken, topic]);

  // 탭 전환/앱 강제종료 시 즉시 저장 — visibilitychange와 pagehide 둘 다 걸어서
  // 브라우저/OS마다 다르게 동작해도 최대한 한쪽에서라도 걸리게 함
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveOnExit();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", saveOnExit);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", saveOnExit);
    };
  }, [saveOnExit]);

  // 30초마다 주기적 저장 — 강제종료 시 visibilitychange/pagehide/sendBeacon 전부 안 걸리는
  // 환경이 실기기 테스트로 확인돼서, 종료 시점 훅에 의존하지 않고 주기를 줄여 유실량 자체를 최소화
  useEffect(() => {
    if (callState !== "active") return;
    const interval = setInterval(saveElapsed, 30000);
    return () => clearInterval(interval);
  }, [callState, saveElapsed]);

  // 체험 통화 자동 종료 (주간 10분 한도) — 통화 시작 시점의 잔여시간 스냅샷을 다 쓰면 종료
  useEffect(() => {
    if (callState === "active" && isTrialCallRef.current && callDuration >= callStartTrialSecondsLeftRef.current) {
      endCall();
      alert(`You've used all your free trial time (${TRIAL_TOTAL_SECONDS / 60} minutes). Upgrade to a membership to keep going!`);
    }
  }, [callDuration, callState, endCall]);

  // 주간 200분 한도 자동 종료 (무제한 제외)
  // weeklySeconds는 60초 자동저장 때마다도 갱신되므로(saveElapsed) 여기서 그대로 쓰면
  // 이번 통화 경과분이 weeklySeconds와 callDuration 양쪽에 겹쳐 이중 카운트된다.
  // 통화 시작 시점에 고정해둔 baseline만 더한다.
  useEffect(() => {
    if (callState === "active" && !unlimited && callStartWeeklySecondsRef.current + callDuration >= 12000) {
      endCall();
      alert("You've used all your time this week (200 minutes).\nIt resets next Monday.");
    }
  }, [callDuration, callState, unlimited, endCall]);

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
          userId,
          sessionToken,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "SESSION_EXPIRED") {
          setCallState("idle");
          await supabase.auth.signOut();
          router.push("/login/ko");
          return;
        }
        if (err.error === "QUOTA_EXCEEDED") {
          setCallState("idle");
          // 클라이언트 표시값이 낙관적 갱신 오차로 실제보다 낮게 남아있을 수 있어 서버 값으로 재동기화
          const summaryRes = await fetch("/api/usage/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sessionToken }),
          });
          const summaryData = await summaryRes.json().catch(() => ({}));
          if (summaryRes.ok) {
            setWeeklySeconds(summaryData.totalSeconds ?? 0);
            setTrialSecondsLeft(summaryData.trialRemainingSeconds ?? 0);
          }
          return;
        }
        setCallState("idle");
        alert("Could not verify your access. Please refresh and try again.");
        return;
      }
      const data = await res.json();
      greeting = data.greeting || fallbackGreeting;
    } catch {
      greeting = fallbackGreeting;
    }

    setCallState("active");
    setCallDuration(0);
    callDurationRef.current = 0;
    callStartWeeklySecondsRef.current = weeklySeconds;
    callStartTrialSecondsLeftRef.current = trialSecondsLeft;
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

    addMessage({ role: "assistant", content: greeting });
    speak(greeting, effectiveTutor === "jia" ? "female" : "male");
  }, [topic, addMessage, speak, profile, unlockTTS, effectiveTutor, canMakeCall, isPaid, isUnlimited, userId, sessionToken, router, weeklySeconds, trialSecondsLeft]);

  const handleMicPress = useCallback(async () => {
    if (isRecording || isSpeaking) return;
    stopSpeaking();
    await startRecording();
  }, [isRecording, isSpeaking, stopSpeaking, startRecording]);

  const handleMicRelease = useCallback(async () => {
    if (!isRecording) return;

    const userText = (await stopRecording(userId, sessionToken)).trim();
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
        if (err.error === "QUOTA_EXCEEDED") {
          endCall();
          const summaryRes = await fetch("/api/usage/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, sessionToken }),
          });
          const summaryData = await summaryRes.json().catch(() => ({}));
          if (summaryRes.ok) setWeeklySeconds(summaryData.totalSeconds ?? 0);
          alert("You've used all your call time for this week.\nIt resets next Monday.");
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
    if (!canSkipPayment) return;
    e.preventDefault();
    setShowMembershipAlert(true);
    if (membershipAlertTimerRef.current) clearTimeout(membershipAlertTimerRef.current);
    membershipAlertTimerRef.current = setTimeout(() => setShowMembershipAlert(false), 2800);
  }, [canSkipPayment]);

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
      <div className={`w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[700px] transition-all duration-500 ${callState !== "idle" ? "ring-2 ring-emerald-500/40 shadow-[0_0_50px_-8px_rgba(16,185,129,0.35)]" : "ring-1 ring-white/5"}`}>
        {/* Header (사진 배경이 상단 버튼 영역까지 확장, 이중 그라데이션으로 가독성 확보) */}
        <div className="bg-gray-800 px-6 pt-3 pb-6 text-center relative">
          {monthlyBg && (
            <>
              <Image
                src={`/tutors/bg/${monthlyBg.file}`}
                alt={monthlyBg.label}
                fill
                className="object-cover object-top"
                priority
              />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-35% to-gray-900/95" />
            </>
          )}
          <div className="relative z-10">
          {callState === "idle" && (
            <div className="flex items-center justify-between mb-3 min-h-[32px]">
              <button
                onClick={async () => {
                  if (showHelp) { setShowHelp(false); return; }
                  if (showSetup) { setShowSetup(false); return; }
                  if (username === "gooster") { router.push("/app"); return; }
                  await supabase.auth.signOut();
                  localStorage.removeItem("turingcall_session");
                  router.push("/login/ko");
                }}
                className="whitespace-nowrap text-gray-300 hover:text-white text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]"
              >
                {showHelp || showSetup || username === "gooster" ? "← Back" : "Logout"}
              </button>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setShowSetup(false); setShowHelp(!showHelp); }}
                  className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 backdrop-blur-sm ring-1 ring-emerald-400/20 rounded-xl text-emerald-300 text-xs font-medium transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7" />
                    <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                  <span>Help</span>
                </button>
                <button
                  onClick={() => { setShowHelp(false); setShowSetup(!showSetup); }}
                  className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 backdrop-blur-sm ring-1 ring-emerald-400/20 rounded-xl text-emerald-300 text-xs font-medium transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Setup</span>
                </button>
              </div>
            </div>
          )}
          <TutorAvatar tutor={effectiveTutor} fallbackBg="bg-blue-600" connecting={callState === "calling"} speaking={isSpeaking} />
          <h1 className="text-white text-lg font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{tutorName}</h1>
          <p className="text-gray-300 text-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">Korean Tutor</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-blue-400 text-xs font-medium bg-blue-900/40 px-2 py-0.5 rounded-full">
              🇰🇷 Korean for Foreigners
            </span>
            {callState === "idle" && streakCount > 0 && isStreakAlive && (
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
        <div className={`flex-1 flex flex-col px-4 py-4 min-h-0 relative ${callState !== "idle" ? "bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_65%)]" : ""}`}>
          {showHelp && callState === "idle" ? (
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
              <h2 className="text-white text-sm font-bold text-center mb-2">How to Use</h2>
              {[
                {
                  color: "bg-blue-500/15 text-blue-400",
                  cardTint: "bg-blue-500/5 border-blue-500/15",
                  icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />,
                  title: "Start a Call", desc: "Choose a topic on the home screen and tap 'Start Call'.",
                },
                {
                  color: "bg-indigo-500/15 text-indigo-400",
                  cardTint: "bg-indigo-500/5 border-indigo-500/15",
                  icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
                  title: "Speak", desc: "Hold the mic button and speak in Korean. Release when you're done — the AI will recognize your speech.",
                },
                {
                  color: "bg-purple-500/15 text-purple-400",
                  cardTint: "bg-purple-500/5 border-purple-500/15",
                  icon: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>,
                  title: "AI Response", desc: "MinJun or Jia will reply by voice. The mic is disabled while the AI is speaking.",
                },
                {
                  color: "bg-amber-500/15 text-amber-400",
                  cardTint: "bg-amber-500/5 border-amber-500/15",
                  icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
                  title: "Grammar Tips", desc: "If you make a mistake, the AI will gently point it out with a short tip at the end of its response.",
                },
                {
                  color: "bg-red-500/15 text-red-400",
                  cardTint: "bg-red-500/5 border-red-500/15",
                  icon: <><path d="M22.63 16.75l-3.7-.5a2 2 0 0 0-1.71.53l-1.75 1.75a15.7 15.7 0 0 1-6.8-6.8l1.75-1.75a2 2 0 0 0 .53-1.71l-.5-3.7A2 2 0 0 0 8.46 2H5.5A2 2 0 0 0 3.5 4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
                  title: "End Call", desc: "Tap the red button to end the call.\n⚠️ Force-closing the app can skip saving that call, which may break your streak — please always end the call with this button.",
                },
                {
                  color: "bg-slate-500/15 text-slate-300",
                  cardTint: "bg-slate-500/5 border-slate-500/15",
                  icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
                  title: "Setup", desc: "Change your name, tutor, or Korean level from Setup in the top right.\n📱 On mobile, Jia is fixed as your tutor. MinJun is available on PC.",
                },
                {
                  color: "bg-cyan-500/15 text-cyan-400",
                  cardTint: "bg-cyan-500/5 border-cyan-500/15",
                  icon: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
                  title: "Recommended Browser", desc: "Use Chrome or Samsung Internet. Other browsers may have unstable speech recognition.",
                },
                {
                  color: "bg-emerald-500/15 text-emerald-400",
                  cardTint: "bg-emerald-500/5 border-emerald-500/15",
                  icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
                  title: "Install as an App", desc: "iPhone: Open in Safari → Share (□↑) → Add to Home Screen\nAndroid: Open in Chrome → Menu (⋮) → Add to Home Screen\nPC: Click the install (+) button in the address bar",
                },
              ].map((item) => (
                <div key={item.title} className={`flex gap-3 border rounded-2xl p-4 ${item.cardTint}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed whitespace-pre-line">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : showSetup && callState === "idle" ? (
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
                  className="w-full bg-gray-800 border border-white/5 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Korean Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setProfile((p) => ({ ...p, level: lvl }))}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        profile.level === lvl
                          ? "bg-gradient-to-r from-blue-600 to-indigo-500 border-transparent text-white shadow-md shadow-blue-900/30"
                          : "bg-blue-500/5 border-blue-500/10 text-gray-400 hover:bg-blue-500/10"
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
                  <div className="bg-gray-800 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-400">
                    Tutor selection is available on PC. On mobile, you'll chat with Jia.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {(["minjun", "jia"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setProfile((p) => ({ ...p, tutor: t }))}
                        className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                          profile.tutor === t
                            ? "bg-gradient-to-r from-blue-600 to-indigo-500 border-transparent text-white shadow-md shadow-blue-900/30"
                            : "bg-blue-500/5 border-blue-500/10 text-gray-400 hover:bg-blue-500/10"
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
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-900/30"
              >
                Save
              </button>

              {canSkipPayment || isPaymentExempt ? (
                <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 flex items-center justify-between gap-2">
                  <p className="text-blue-400 text-xs font-medium">
                    ✅ Active membership{expiresAt && !unlimited ? ` — until ${new Date(expiresAt).toLocaleDateString("en-US")}` : ""}
                  </p>
                  <a
                    href="https://open.kakao.com/o/sPanl0Ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-yellow-400 text-xs hover:text-yellow-300"
                  >
                    💬 Contact
                  </a>
                </div>
              ) : (
                <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-2">
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
                    className="inline-block w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-xs font-semibold rounded-xl text-center mt-1 shadow-md shadow-blue-900/30"
                  >
                    💳 Pay with PayPal
                  </a>
                  <p className="text-gray-600 text-xs text-center">or bank transfer</p>
                  <p className="text-gray-500 text-xs flex items-center gap-1">KB Kookmin Bank 758637-00-012739<CopyButton text="758637-00-012739" label="Copy" copiedLabel="Copied!" /></p>
                  <p className="text-gray-500 text-xs">예금주: 송랩</p>
                  {paymentRequestedAt ? (
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
              )}

              {userId && sessionToken && <UsageHistory userId={userId} sessionToken={sessionToken} lang="en" />}
              {userId && sessionToken && <ChangePassword userId={userId} sessionToken={sessionToken} lang="en" />}

              <div className="mt-4">
                <button
                  onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem("turingcall_session"); router.push("/login/ko"); }}
                  className="w-full py-3 bg-gray-800 border border-white/5 hover:bg-gray-700 text-gray-400 rounded-2xl text-sm"
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
                      className={`p-3 rounded-xl border text-left transition-all ${
                        topic === t.value
                          ? "bg-gradient-to-br from-blue-600 to-indigo-500 border-transparent text-white shadow-lg shadow-blue-900/30"
                          : `${t.cardTint} text-gray-300 hover:bg-white/5`
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
                  {Math.ceil(trialSecondsLeft / 60)} free trial min left
                  {trialExpiresAt && (
                    <span className="text-yellow-400/60">
                      {" "}· until {new Date(trialExpiresAt).toLocaleString("en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </p>
              )}
              {hasActiveMembership && (
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-2 mb-2 text-center">
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
                      <button onClick={startCall} className="mt-1 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-900/30">
                        🎙️ Allow Microphone
                      </button>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={startCall}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-blue-900/40"
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
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-gray-300 space-y-1">
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
                <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-gray-300 space-y-1">
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
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onClick={endCall}
                  aria-label="End call"
                  className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                </button>
                <span className="text-gray-500 text-[10px]">End call</span>
              </div>
              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
                disabled={callState === "calling" || (isBusy && !isRecording)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg select-none ${
                  isRecording ? "bg-red-500 scale-110 ring-4 ring-red-400 ring-opacity-50"
                  : isBusy ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-br from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 shadow-blue-900/40 active:scale-95"
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

        {/* Business Info — hidden during calls to keep the call screen clean */}
        {callState === "idle" && (
          <div className="px-4 pb-4 text-center space-y-0.5">
            <p className="text-gray-700 text-xs">SongLab · Business Reg. No.: 857-28-01961</p>
            <p className="text-gray-700 text-xs">
              <button onClick={() => setShowTerms(true)} className="hover:text-gray-500">Terms &amp; Privacy Policy</button>
            </p>
          </div>
        )}

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
