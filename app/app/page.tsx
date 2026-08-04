"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMonthlyBg } from "@/hooks/useMonthlyBg";
import TopicSelector from "@/components/TopicSelector";
import CopyButton from "@/components/CopyButton";
import TranscriptBox, { Message } from "@/components/TranscriptBox";
import UserSetup from "@/components/UserSetup";
import CallFeedback, { FeedbackData } from "@/components/CallFeedback";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/hooks/useUserProfile";
import AdminPanel from "@/components/AdminPanel";
import TermsModal from "@/components/TermsModal";
import TutorAvatar from "@/components/TutorAvatar";
import PaymentNoteInput from "@/components/PaymentNoteInput";
import PaymentRejectNotice from "@/components/PaymentRejectNotice";
import MembershipOffer from "@/components/MembershipOffer";
import { PLANS, PlanId, planOf } from "@/lib/plans";

type CallState = "idle" | "calling" | "active";
type View = "home" | "settings" | "admin" | "help";

export default function Home() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>("idle");
  const [topic, setTopic] = useState("Daily Conversation");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [view, setView] = useState<View>("home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [trialCalls, setTrialCalls] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [trialMinutes, setTrialMinutes] = useState<number>(5);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [micError, setMicError] = useState(false);
  const [micPermState, setMicPermState] = useState<PermissionState | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const monthlyBg = useMonthlyBg();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [monthlySeconds, setMonthlySeconds] = useState(0);
  const [plan, setPlan] = useState<PlanId>("standard");
  const [liteEligible, setLiteEligible] = useState(false);
  const [earlyRenewPlan, setEarlyRenewPlan] = useState<PlanId>("lite");
  const [paymentRequestedAt, setPaymentRequestedAt] = useState<string | null>(null);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRejectReason, setPaymentRejectReason] = useState<string | null>(null);
  const [showCallEndedNotice, setShowCallEndedNotice] = useState(false);
  const callEndedNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTrialCallRef = useRef(false);
  const topicRef = useRef(topic);
  const callDurationRef = useRef(0);
  const lastSavedRef = useRef(0);
  const callStateRef = useRef<CallState>("idle");
  const callStartMonthlySecondsRef = useRef(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const { isRecording, isTranscribing, startRecording, stopRecording, consumeRateLimited } = useAudioRecorder();
  const { speak, stop: stopSpeaking, unlock: unlockTTS, isSpeaking } = useSpeechSynthesis();

  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { topicRef.current = topic; }, [topic]);

  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const effectiveTutor = isMobile ? "rachel" : (profile?.tutor ?? "alex");
  const isPaymentExempt = username === "gooster" || username === "mh1104";

  useEffect(() => {
    const loadProfile = async (session: { user: { id: string } }) => {
      const storedToken = localStorage.getItem("turingcall_session");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, level, tutor, username, session_token, trial_calls, trial_minutes, expires_at, unlimited, blocked, ko_access, payment_requested_at, payment_reject_reason, streak_count, plan")
        .eq("id", session.user.id)
        .single();

      if (!profileData || profileData.session_token !== storedToken) {
        await supabase.auth.signOut();
        localStorage.removeItem("turingcall_session");
        router.push("/login");
        return;
      }

      if (profileData.ko_access && profileData.username !== "gooster" && profileData.username !== "mh1104") {
        router.push("/ko");
        return;
      }

      setUserId(session.user.id);
      setSessionToken(storedToken);
      setUsername(profileData.username);
      setProfile({ name: profileData.name, level: profileData.level, tutor: profileData.tutor || "alex" });
      setTrialCalls(profileData.trial_calls ?? 0);
      setTrialMinutes(profileData.trial_minutes ?? 5);
      setStreakCount(profileData.streak_count ?? 0);
      setExpiresAt(profileData.expires_at ?? null);
      setUnlimited(profileData.unlimited ?? false);
      setBlocked(profileData.blocked ?? false);
      setPaymentRequestedAt(profileData.payment_requested_at ?? null);
      setPaymentRejectReason(profileData.payment_reject_reason ?? null);
      setPlan((profileData.plan as PlanId) ?? "standard");

      const eligibilityRes = await fetch("/api/user/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, sessionToken: storedToken }),
      });
      const eligibilityData = await eligibilityRes.json();
      setLiteEligible(eligibilityRes.ok && (eligibilityData.paymentCount ?? 0) === 0);

      if (!profileData.unlimited) {
        const summaryRes = await fetch("/api/usage/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, sessionToken: storedToken }),
        });
        const summaryData = await summaryRes.json();
        setMonthlySeconds(summaryRes.ok ? summaryData.totalSeconds ?? 0 : 0);
      }

      setLoaded(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!session) {
          router.push("/login");
        } else {
          loadProfile(session);
        }
      } else if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem("turingcall_session");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const requestPaymentConfirmation = async (requestedPlan: PlanId) => {
    if (!userId || !sessionToken || requestingPayment || !paymentNote.trim()) return;
    setRequestingPayment(true);
    const res = await fetch("/api/payment/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, sessionToken, note: paymentNote, requestedPlan }),
    });
    if (res.ok) {
      setPaymentRequestedAt(new Date().toISOString());
      setPaymentRejectReason(null);
    }
    setRequestingPayment(false);
  };

  const saveProfile = async (p: UserProfile) => {
    if (!userId) return;
    await supabase.from("profiles").update({ name: p.name, level: p.level, tutor: p.tutor }).eq("id", userId);
    setProfile(p);
    setView("home");
  };

  const isPaid = !!expiresAt && new Date(expiresAt) > new Date();
  const isUnlimited = unlimited;
  const periodNoun = planOf(plan).periodLabel === "주" ? "주" : "달";
  const monthlyLimitReached = !isUnlimited && monthlySeconds >= planOf(plan).seconds;
  const canMakeCall = !monthlyLimitReached && (isUnlimited || isPaid || trialCalls > 0);

  const saveElapsed = useCallback(async () => {
    if (!userId || !sessionToken || callStateRef.current !== "active") return;
    const savedBefore = lastSavedRef.current;
    const unsaved = callDurationRef.current - savedBefore;
    if (unsaved <= 0) return;
    try {
      const res = await fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken, seconds: unsaved, topic: topicRef.current }),
        keepalive: true, // 탭 숨김/앱 강제종료 직후에도 브라우저가 요청을 이어서 완료시켜줌
      });
      // 성공 확인 후에만 저장 완료로 표시 — 실패 시 다음 저장 시점에 다시 시도됨
      // monthlySeconds도 여기서 같이 올려야 함 — 안 그러면 60초 자동저장분은 서버엔
      // 쌓이는데 화면/한도판정 값엔 반영이 안 돼서 실제 사용량보다 한참 적게 보임
      if (res.ok) {
        lastSavedRef.current = savedBefore + unsaved;
        setMonthlySeconds((prev) => prev + unsaved);
      }
    } catch {
      // 네트워크 실패 시 lastSavedRef를 건드리지 않아 다음 저장에서 재시도됨
    }
  }, [userId, sessionToken]);

  // 탭 숨김/앱 강제종료 시점 전용 저장 — fetch(keepalive)는 iOS Safari/PWA에서
  // 페이지가 죽는 타이밍과 경쟁해서 실제로는 잘 안 먹히는 경우가 확인됨.
  // sendBeacon은 브라우저가 페이지 종료 이후에도 전송을 보장해주는 표준 API라 이 시점엔 이걸 씀.
  // 응답을 기다릴 수 없는 fire-and-forget이라 성공 여부와 무관하게 낙관적으로 반영한다.
  const saveOnExit = useCallback(() => {
    if (!userId || !sessionToken || callStateRef.current !== "active") return;
    const savedBefore = lastSavedRef.current;
    const unsaved = callDurationRef.current - savedBefore;
    if (unsaved <= 0) return;
    const payload = JSON.stringify({ userId, sessionToken, seconds: unsaved, topic: topicRef.current });
    navigator.sendBeacon("/api/call/end", new Blob([payload], { type: "application/json" }));
    lastSavedRef.current = savedBefore + unsaved;
    setMonthlySeconds((prev) => prev + unsaved);
  }, [userId, sessionToken]);

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    const wasTrial = isTrialCallRef.current;
    isTrialCallRef.current = false;

    // Capture messages before clearing
    const capturedMessages = [...messagesRef.current];
    const capturedTopic = topic;
    const capturedProfile = profile;

    const unsaved = callDurationRef.current - lastSavedRef.current;
    lastSavedRef.current = 0;

    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);

    if (userId && sessionToken && unsaved > 0) {
      fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken, seconds: unsaved, topic: capturedTopic }),
        keepalive: true,
      })
        .then((res) => { if (!res.ok) console.error("[call/end] save failed", res.status); })
        .catch((err) => console.error("[call/end] save error", err));
      setMonthlySeconds((prev) => prev + unsaved);
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

    // Generate feedback if there were at least FEEDBACK_MIN_TURNS user turns
    const userTurns = capturedMessages.filter((m) => m.role === "user").length;
    if (userTurns >= FEEDBACK_MIN_TURNS && capturedProfile) {
      setFeedback(null);
      setIsFetchingFeedback(true);
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: capturedMessages, topic: capturedTopic, profile: capturedProfile, userId, sessionToken }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data && !data.error) setFeedback(data); })
        .finally(() => setIsFetchingFeedback(false));
    } else {
      // 대화가 짧아 피드백이 생성되지 않는 경우, 홈으로 조용히 돌아가면
      // 통화가 실제로 종료된 건지 앱이 그냥 닫힌 건지 헷갈릴 수 있어 안내를 띄움
      setShowCallEndedNotice(true);
      if (callEndedNoticeTimerRef.current) clearTimeout(callEndedNoticeTimerRef.current);
      callEndedNoticeTimerRef.current = setTimeout(() => setShowCallEndedNotice(false), 3200);
    }
  }, [stopSpeaking, userId, sessionToken, topic, profile]);

  useEffect(() => {
    return () => { if (callEndedNoticeTimerRef.current) clearTimeout(callEndedNoticeTimerRef.current); };
  }, []);

  // 탭 전환/전화 착신/앱 강제종료 시 즉시 저장 — visibilitychange와 pagehide 둘 다 걸어서
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

  // 30분 자동 종료 (체험 통화)
  useEffect(() => {
    if (callState === "active" && isTrialCallRef.current && callDuration >= trialMinutes * 60) {
      endCall();
      alert(`체험 통화 ${trialMinutes}분이 종료됐습니다.`);
    }
  }, [callDuration, callState, trialMinutes, endCall]);

  // 일일 30분 한도 자동 종료 (무제한 제외)
  // monthlySeconds는 60초 자동저장 때마다도 갱신되기 때문에(saveElapsed) 여기서 그대로 쓰면
  // 이번 통화 경과분이 monthlySeconds와 callDuration 양쪽에 겹쳐 들어가 이중으로 카운트된다.
  // 통화 시작 시점에 고정해둔 baseline(콜스타트 시점의 monthlySeconds)만 더한다.
  useEffect(() => {
    if (callState === "active" && !unlimited && callStartMonthlySecondsRef.current + callDuration >= planOf(plan).seconds) {
      endCall();
      alert(`이번${periodNoun} 사용 시간(${planOf(plan).minutes}분)을 모두 사용했습니다.\n다음${periodNoun}에 다시 이용할 수 있어요.`);
    }
  }, [callDuration, callState, unlimited, plan, periodNoun, endCall]);

  const startCall = useCallback(async () => {
    if (!canMakeCall) return;
    setMicError(false);
    isTrialCallRef.current = !isPaid && !isUnlimited;
    unlockTTS();
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

    setCallState("calling");

    const firstName = profile?.name || "there";
    const tutorName = effectiveTutor === "rachel" ? "Rachel" : "Alex";

    await new Promise((r) => setTimeout(r, 1500));

    let greeting: string;
    try {
      const res = await fetch("/api/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          firstName,
          tutorName,
          tutor: effectiveTutor,
          level: profile?.level || "intermediate",
          userId,
          sessionToken,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === "SESSION_EXPIRED") {
          setCallState("idle");
          await supabase.auth.signOut();
          router.push("/login");
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
          if (summaryRes.ok) setMonthlySeconds(summaryData.totalSeconds ?? 0);
          return;
        }
        // 화면이 새로고침 안 된 채 멤버십/체험 상태가 바뀐 경우(관리자가 만료시킴 등) —
        // 실제로는 권한이 없으니 가짜 인사말로 통화를 이어가지 않고 여기서 멈춘다
        setCallState("idle");
        alert("이용 권한을 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.");
        return;
      }
      const data = await res.json();
      greeting = data.greeting || `Hey ${firstName}! This is ${tutorName}. Ready to practice some English?`;
    } catch {
      greeting = `Hey ${firstName}! This is ${tutorName}. Ready to practice some English?`;
    }

    setCallState("active");
    setCallDuration(0);
    callDurationRef.current = 0;
    lastSavedRef.current = 0;
    callStartMonthlySecondsRef.current = monthlySeconds;
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    addMessage({ role: "assistant", content: greeting });
    speak(greeting, effectiveTutor === "rachel" ? "female" : "male");
  }, [topic, addMessage, speak, profile, unlockTTS, canMakeCall, isPaid, username, userId, sessionToken, router, monthlySeconds]);

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
        addMessage({ role: "assistant", content: "Sorry, our tutors are quite busy right now. Please try again in a moment." });
      }
      return;
    }

    addMessage({ role: "user", content: userText });
    setIsAiTyping(true);

    const history = messagesRef.current.slice(0, -1);
    const apiMessages = [...history, { role: "user" as const, content: userText }];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic, profile, userId, sessionToken }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === "SUBSCRIPTION_EXPIRED") {
          endCall();
          alert("이용 기간이 만료됐습니다. 관리자에게 문의해 주세요.");
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
          if (summaryRes.ok) setMonthlySeconds(summaryData.totalSeconds ?? 0);
          alert(`이번${periodNoun} 사용 시간(${planOf(plan).minutes}분)을 모두 사용했습니다.\n다음${periodNoun}에 다시 이용할 수 있어요.`);
          return;
        }
        if (err.error === "SESSION_EXPIRED") {
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
        if (err.error === "RATE_LIMIT") {
          setIsAiTyping(false);
          addMessage({ role: "assistant", content: "Sorry, our tutors are quite busy right now. Please try again in a moment." });
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

      speak(aiText, effectiveTutor === "rachel" ? "female" : "male");
    } catch {
      setIsAiTyping(false);
      addMessage({ role: "assistant", content: "Sorry, I had a little trouble there. Could you say that again?" });
    }
  }, [isRecording, stopRecording, addMessage, topic, speak, profile, userId, sessionToken, plan, periodNoun, endCall]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isBusy = isTranscribing || isAiTyping || isSpeaking;
  const tutorDisplayName = effectiveTutor === "rachel" ? "Rachel" : "Alex";
  const userTurnCount = messages.filter((m) => m.role === "user").length;
  const FEEDBACK_MIN_TURNS = 2;
  const micStatus = isRecording ? "듣는 중... 손을 떼면 전송"
    : isTranscribing ? "인식 중..."
    : isAiTyping ? `${tutorDisplayName}가 생각 중...`
    : isSpeaking ? `${tutorDisplayName}가 말하는 중...`
    : "마이크 버튼을 누르고 말하세요";

  if (!loaded) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-sm">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden flex flex-col min-h-[700px]">
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
          <div className="flex items-start justify-between mb-3 min-h-[32px]">
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
              {(view === "settings" || view === "admin" || view === "help") ? (
                <button onClick={() => setView("home")} className="whitespace-nowrap text-gray-300 hover:text-white text-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">← 뒤로</button>
              ) : callState === "idle" && view === "home" ? (
                username === "gooster" ? (
                  <>
                    <button onClick={() => setView("admin")} className="whitespace-nowrap text-yellow-400 hover:text-yellow-300 text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">관리자</button>
                    {!isMobile && (
                      <button onClick={() => router.push("/admin/stats")} className="whitespace-nowrap text-emerald-400 hover:text-emerald-300 text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">통계</button>
                    )}
                    <button onClick={() => router.push("/ko")} className="whitespace-nowrap text-blue-400 hover:text-blue-300 text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">🇰🇷 한국어판</button>
                    <button onClick={handleLogout} className="whitespace-nowrap text-gray-300 hover:text-white text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">로그아웃</button>
                  </>
                ) : username === "mh1104" ? (
                  <>
                    <button onClick={() => router.push("/ko")} className="whitespace-nowrap text-blue-400 hover:text-blue-300 text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">🇰🇷 한국어판</button>
                    <button onClick={handleLogout} className="whitespace-nowrap text-gray-300 hover:text-white text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">로그아웃</button>
                  </>
                ) : (
                  <button onClick={handleLogout} className="whitespace-nowrap text-gray-300 hover:text-white text-xs [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">로그아웃</button>
                )
              ) : null}
            </div>
            {callState === "idle" && view === "home" && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setView("help")} className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-gray-700/80 hover:bg-gray-600/80 active:scale-95 backdrop-blur-sm ring-1 ring-white/10 rounded-xl text-gray-200 text-xs font-medium transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2-2.4 3.7" />
                    <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
                  </svg>
                  <span>도움말</span>
                </button>
                <button onClick={() => setView("settings")} className="whitespace-nowrap flex items-center gap-1 px-2.5 py-1.5 bg-gray-700/80 hover:bg-gray-600/80 active:scale-95 backdrop-blur-sm ring-1 ring-white/10 rounded-xl text-gray-200 text-xs font-medium transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>설정</span>
                </button>
              </div>
            )}
          </div>
          <TutorAvatar tutor={effectiveTutor} fallbackBg="bg-green-600" />
          <h1 className="text-white text-lg font-semibold [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
            {effectiveTutor === "rachel" ? "Rachel" : "Alex"}
          </h1>
          <p className="text-gray-300 text-sm [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
            {effectiveTutor === "rachel" ? "AI Tutor · Korean-American · From Seattle, WA" : "AI Tutor · From New York, NY"}
          </p>
          {profile && callState === "idle" && (
            <div className="text-green-400 text-xs mt-1 relative inline-block [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
              <p>
                안녕하세요, {profile.name}님 👋
                {streakCount > 0 && (
                  <button
                    onClick={() => setShowStreakInfo((v) => !v)}
                    className="ml-2 text-orange-400"
                  >
                    🔥 {streakCount}일 연속 통화중 <span className="text-gray-400">ⓘ</span>
                  </button>
                )}
              </p>
              {showStreakInfo && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-left shadow-lg z-10">
                  짧게라도 하루 한 번 통화하면 연속일수가 올라가요.
                </div>
              )}
            </div>
          )}
          {callState === "active" && <p className="text-green-400 text-sm mt-1 font-mono [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">{formatTime(callDuration)}</p>}
          {callState === "active" && (
            <p className="text-xs mt-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
              {userTurnCount >= FEEDBACK_MIN_TURNS ? (
                <span className="text-emerald-400">✅ 피드백 받을 준비 완료</span>
              ) : (
                <span className="text-gray-300">대화 {FEEDBACK_MIN_TURNS - userTurnCount}번 더 하면 피드백을 받을 수 있어요</span>
              )}
            </p>
          )}
          {callState === "calling" && <p className="text-yellow-400 text-sm mt-1 animate-pulse [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">연결 중...</p>}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {view === "help" ? (
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
              <h2 className="text-white text-sm font-bold text-center mb-2">사용 방법</h2>
              {[
                {
                  color: "bg-green-500/15 text-green-400",
                  cardTint: "bg-green-500/5 border-green-500/15",
                  icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />,
                  title: "통화 시작", desc: "홈 화면에서 주제를 선택하고 '통화 시작' 버튼을 누르세요.",
                },
                {
                  color: "bg-blue-500/15 text-blue-400",
                  cardTint: "bg-blue-500/5 border-blue-500/15",
                  icon: <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></>,
                  title: "말하기", desc: "마이크 버튼을 누르고 있는 동안 영어로 말하세요. 손을 떼면 AI가 인식합니다.",
                },
                {
                  color: "bg-purple-500/15 text-purple-400",
                  cardTint: "bg-purple-500/5 border-purple-500/15",
                  icon: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>,
                  title: "AI 응답", desc: "Alex 또는 Rachel이 음성으로 답변합니다. AI가 말하는 중엔 마이크가 비활성화돼요.",
                },
                {
                  color: "bg-amber-500/15 text-amber-400",
                  cardTint: "bg-amber-500/5 border-amber-500/15",
                  icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
                  title: "문법 교정", desc: "틀린 표현이 있으면 AI가 응답할 때마다 끝에 부드럽게 짚어줘요.",
                },
                {
                  color: "bg-red-500/15 text-red-400",
                  cardTint: "bg-red-500/5 border-red-500/15",
                  icon: <><path d="M22.63 16.75l-3.7-.5a2 2 0 0 0-1.71.53l-1.75 1.75a15.7 15.7 0 0 1-6.8-6.8l1.75-1.75a2 2 0 0 0 .53-1.71l-.5-3.7A2 2 0 0 0 8.46 2H5.5A2 2 0 0 0 3.5 4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
                  title: "통화 종료", desc: "빨간 버튼을 누르면 통화가 종료됩니다.\n📋 앱을 강제로 끄면 대화가 저장되지 않아 AI 피드백 리포트를 받을 수 없고 연속 통화 기록도 끊길 수 있어요 — 꼭 이 버튼으로 종료해주세요.",
                },
                {
                  color: "bg-emerald-500/15 text-emerald-400",
                  cardTint: "bg-emerald-500/5 border-emerald-500/15",
                  icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
                  title: "통화 후 AI 피드백", desc: "대화를 어느 정도 나누고 통화를 종료하면 종합평가·표현 교정·잘한 표현·추천 표현·오늘의 팁이 담긴 리포트를 받아볼 수 있어요. 추천 표현은 공유하기 버튼으로 바로 공유할 수 있어요.",
                },
                {
                  color: "bg-slate-500/15 text-slate-300",
                  cardTint: "bg-slate-500/5 border-slate-500/15",
                  icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
                  title: "설정", desc: "우측 상단 설정에서 이름, AI 튜터, 영어 레벨을 변경할 수 있어요.\n📱 모바일에서는 Rachel이 고정돼요. Alex 선택은 PC에서 가능해요.",
                },
                {
                  color: "bg-cyan-500/15 text-cyan-400",
                  cardTint: "bg-cyan-500/5 border-cyan-500/15",
                  icon: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
                  title: "권장 브라우저", desc: "Chrome 또는 Samsung 브라우저를 사용하세요. 다른 브라우저는 음성 인식이 불안정할 수 있어요.",
                },
                {
                  color: "bg-indigo-500/15 text-indigo-400",
                  cardTint: "bg-indigo-500/5 border-indigo-500/15",
                  icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
                  title: "앱으로 설치하기", desc: "iPhone: Safari에서 접속 → 하단 공유(□↑) → 홈 화면에 추가\nAndroid: Chrome에서 접속 → 우상단 메뉴(⋮) → 홈 화면에 추가\nPC: 주소창 오른쪽 설치(+) 버튼 클릭",
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
          ) : view === "admin" && userId && sessionToken ? (
            <AdminPanel userId={userId} sessionToken={sessionToken} />
          ) : view === "settings" ? (
            <UserSetup
              existing={profile || undefined}
              onComplete={saveProfile}
              paymentRequestedAt={paymentRequestedAt}
              requestingPayment={requestingPayment}
              onRequestPayment={isPaymentExempt ? undefined : requestPaymentConfirmation}
              paymentNote={paymentNote}
              onPaymentNoteChange={setPaymentNote}
              paymentRejectReason={paymentRejectReason}
              hasActiveMembership={isPaid || isUnlimited}
              expiresAt={expiresAt}
              userId={userId}
              sessionToken={sessionToken}
              liteEligible={liteEligible}
            />
          ) : callState === "idle" && (isFetchingFeedback || feedback) ? (
            <CallFeedback
              feedback={feedback}
              isLoading={isFetchingFeedback}
              onDismiss={() => { setFeedback(null); setIsFetchingFeedback(false); }}
            />
          ) : callState === "idle" ? (
            <div className="flex-1 flex flex-col justify-between">
              <TopicSelector selected={topic} onSelect={setTopic} />
            </div>
          ) : (
            <TranscriptBox messages={messages} interimTranscript="" isAiTyping={isAiTyping || isTranscribing} tutorLabel={`${tutorDisplayName} (AI Tutor)`} />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-8 pt-4">
          {callState === "idle" && view === "home" && !feedback && !isFetchingFeedback && (
            blocked ? (
              <div className="text-center space-y-2 py-4">
                <p className="text-red-400 text-sm font-medium">이용이 제한된 계정입니다</p>
                <p className="text-gray-500 text-xs">관리자에게 문의해 주세요</p>
                <a href="https://open.kakao.com/o/sPanl0Ci" target="_blank" rel="noopener noreferrer" className="block text-yellow-400 hover:text-yellow-300 text-xs">
                  카카오톡 문의 →
                </a>
              </div>
            ) : canMakeCall ? (
              <div>
                {!isPaid && !isUnlimited && (
                  <p className="text-yellow-400 text-xs text-center mb-2">
                    체험 통화 {trialCalls}회 남음 · 회당 {trialMinutes}분
                  </p>
                )}
                {isPaid && expiresAt && (
                  <div className="bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-2 mb-2 text-center">
                    <p className="text-green-400 text-xs font-medium">멤버십 이용 중</p>
                    <p className="text-gray-300 text-xs mt-0.5">
                      {new Date(expiresAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}까지
                    </p>
                  </div>
                )}
                {!isUnlimited && isPaid && (
                  <p className="text-gray-500 text-xs text-center mb-2">
                    이번{periodNoun} {Math.floor(monthlySeconds / 60)}분 사용 · 잔여 {Math.max(0, planOf(plan).minutes - Math.floor(monthlySeconds / 60))}분
                  </p>
                )}
                {micError && (
                  <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-3 text-center space-y-2">
                    <p className="text-red-400 text-sm">🎙️ 마이크 권한이 필요해요</p>
                    {micPermState === "denied" ? (
                      <>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          마이크가 차단되어 있어요.<br />
                          {isAndroid
                            ? <>Chrome 앱 → 메뉴(⋮) → 설정 →<br />사이트 설정 → 마이크 → 이 사이트 허용</>
                            : <>주소창 자물쇠(🔒) → 마이크 → 허용</>
                          }
                        </p>
                        <p className="text-gray-600 text-xs">설정 변경 후 아래 버튼을 눌러주세요</p>
                        <button onClick={startCall} className="mt-1 px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-medium">
                          다시 시도
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-400 text-xs">아래 버튼을 눌러 마이크를 허용해 주세요</p>
                        <button onClick={startCall} className="mt-1 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-xl text-sm font-semibold shadow-md shadow-green-900/30">
                          🎙️ 마이크 허용하기
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button onClick={startCall} className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg shadow-green-900/40">
                  📞 통화 시작
                </button>
              </div>
            ) : monthlyLimitReached ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-orange-400 text-sm font-medium">이번{periodNoun} 사용 시간({planOf(plan).minutes}분)을 모두 사용했습니다</p>
                <p className="text-gray-500 text-xs">
                  {expiresAt
                    ? <>멤버십 갱신 시 초기화돼요 (이용기간 종료: {new Date(expiresAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })})</>
                    : `다음${periodNoun}에 다시 이용할 수 있어요`}
                </p>
                <p className="text-gray-400 text-xs">
                  {plan === "lite"
                    ? "지금 더 이용하려면 조기 결제할 수 있어요 · 라이트를 이어가거나 스탠다드로 바꿀 수 있어요"
                    : "지금 더 이용하고 싶으면 조기 결제할 수 있어요"}
                </p>
                {plan === "lite" && !isPaymentExempt && !paymentRequestedAt && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PLANS).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setEarlyRenewPlan(p.id)}
                        className={`px-3 py-2 rounded-xl border text-left transition-all ${
                          earlyRenewPlan === p.id
                            ? "bg-gradient-to-r from-green-600 to-emerald-500 border-transparent text-white shadow-md shadow-green-900/30"
                            : "bg-green-500/5 border-green-500/10 text-gray-300 hover:bg-green-500/10"
                        }`}
                      >
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs opacity-80">{p.priceWon.toLocaleString()}원 · {p.periodLabel} {p.minutes}분</div>
                      </button>
                    ))}
                  </div>
                )}
                <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <p className="flex items-center justify-center gap-1">KB국민은행 758637-00-012739<CopyButton text="758637-00-012739" /></p>
                  <p>예금주: 송랩</p>
                  {isPaymentExempt ? null : paymentRequestedAt ? (
                    <p className="pt-1 text-emerald-400 text-xs">✅ 확인 요청됨 · 관리자 확인 후 곧 승인됩니다</p>
                  ) : (
                    <>
                      {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="ko" />}
                      <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="bankName" />
                      <button
                        onClick={() => requestPaymentConfirmation(plan === "lite" ? earlyRenewPlan : "standard")}
                        disabled={requestingPayment || !paymentNote.trim()}
                        className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg"
                      >
                        {requestingPayment ? "요청 중..." : "✅ 입금 완료, 확인 요청하기"}
                      </button>
                    </>
                  )}
                  <a
                    href="https://open.kakao.com/o/sPanl0Ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-yellow-400 hover:text-yellow-300 pt-1"
                  >
                    💬 가입 문의 (카카오톡)
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-white text-sm font-medium">체험 횟수를 모두 사용했습니다</p>
                <p className="text-gray-400 text-xs leading-relaxed">멤버십 가입 후 이용하세요</p>
                <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <MembershipOffer
                    liteEligible={liteEligible}
                    paymentRequestedAt={paymentRequestedAt}
                    requestingPayment={requestingPayment}
                    onRequestPayment={isPaymentExempt ? undefined : requestPaymentConfirmation}
                    paymentExempt={isPaymentExempt}
                    paymentNote={paymentNote}
                    onPaymentNoteChange={setPaymentNote}
                    paymentRejectReason={paymentRejectReason}
                    kakaoLabel="카카오톡 문의 →"
                  />
                </div>
              </div>
            )
          )}

          {callState !== "idle" && (
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={endCall} aria-label="통화 종료" className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                </button>
                <span className="text-gray-500 text-[10px]">통화 종료</span>
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
                  : "bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 shadow-green-900/40 active:scale-95"
                }`}
              >
                {isRecording ? "🔴" : isTranscribing ? "⏳" : isSpeaking ? "🔊" : "🎤"}
              </button>
              <div className="w-16 h-16" />
            </div>
          )}

          {callState === "active" && <p className="text-gray-500 text-xs text-center mt-3">{micStatus}</p>}
        </div>

        {/* 문의하기 — 차단/한도초과/체험소진 화면엔 이미 자체 문의 링크가 있어 중복 노출 방지 */}
        {callState === "idle" && view === "home" && !feedback && !isFetchingFeedback && !blocked && canMakeCall && (
          <div className="flex justify-center pb-5">
            <a
              href="https://open.kakao.com/o/sPanl0Ci"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 text-xs font-medium rounded-xl transition-all"
            >
              💬 카카오톡 문의하기
            </a>
          </div>
        )}

        {/* 사업자 정보 */}
        <div className="px-4 pb-4 text-center space-y-0.5">
          <p className="text-gray-700 text-xs">송랩 · 사업자등록번호: 857-28-01961</p>
          <p className="text-gray-700 text-xs">
            <button onClick={() => setShowTerms(true)} className="underline hover:text-gray-500">이용약관 및 개인정보처리방침</button>
          </p>
        </div>

        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}

        <div
          className={`fixed left-1/2 bottom-24 z-50 -translate-x-1/2 transition-all duration-300 ease-out ${
            showCallEndedNotice ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="bg-gray-800 border border-green-700 text-white text-xs px-4 py-3 rounded-xl shadow-xl max-w-[260px] text-center">
            통화가 종료되었어요.<br />대화를 조금 더 나누면 피드백을 받을 수 있어요.
          </div>
        </div>
      </div>
    </main>
  );
}
