"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [trialMinutes, setTrialMinutes] = useState<number>(5);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [micError, setMicError] = useState(false);
  const [micPermState, setMicPermState] = useState<PermissionState | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [monthlySeconds, setMonthlySeconds] = useState(0);
  const [paymentRequestedAt, setPaymentRequestedAt] = useState<string | null>(null);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentRejectReason, setPaymentRejectReason] = useState<string | null>(null);
  const isTrialCallRef = useRef(false);
  const topicRef = useRef(topic);
  const callDurationRef = useRef(0);
  const lastSavedRef = useRef(0);
  const callStateRef = useRef<CallState>("idle");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();
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
        .select("name, level, tutor, username, session_token, trial_calls, trial_minutes, expires_at, unlimited, blocked, ko_access, payment_requested_at, payment_reject_reason")
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
      setExpiresAt(profileData.expires_at ?? null);
      setUnlimited(profileData.unlimited ?? false);
      setBlocked(profileData.blocked ?? false);
      setPaymentRequestedAt(profileData.payment_requested_at ?? null);
      setPaymentRejectReason(profileData.payment_reject_reason ?? null);

      if (!profileData.unlimited) {
        let cycleStart: Date;
        if (profileData.expires_at) {
          cycleStart = new Date(new Date(profileData.expires_at).getTime() - 30 * 24 * 60 * 60 * 1000);
        } else {
          const now = new Date();
          cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const cycleStartStr = `${cycleStart.getFullYear()}-${String(cycleStart.getMonth() + 1).padStart(2, "0")}-${String(cycleStart.getDate()).padStart(2, "0")}`;
        const summaryRes = await fetch("/api/usage/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: session.user.id, sessionToken: storedToken, sinceDate: cycleStartStr }),
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

  const saveProfile = async (p: UserProfile) => {
    if (!userId) return;
    await supabase.from("profiles").update({ name: p.name, level: p.level, tutor: p.tutor }).eq("id", userId);
    setProfile(p);
    setView("home");
  };

  const isPaid = !!expiresAt && new Date(expiresAt) > new Date();
  const isUnlimited = unlimited;
  const monthlyLimitReached = !isUnlimited && monthlySeconds >= 54000;
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
      });
      // 성공 확인 후에만 저장 완료로 표시 — 실패 시 다음 저장 시점에 다시 시도됨
      if (res.ok) lastSavedRef.current = savedBefore + unsaved;
    } catch {
      // 네트워크 실패 시 lastSavedRef를 건드리지 않아 다음 저장에서 재시도됨
    }
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

    // Generate feedback if there were at least 2 user turns
    const userTurns = capturedMessages.filter((m) => m.role === "user").length;
    if (userTurns >= 2 && capturedProfile) {
      setFeedback(null);
      setIsFetchingFeedback(true);
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: capturedMessages, topic: capturedTopic, profile: capturedProfile }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data && !data.error) setFeedback(data); })
        .finally(() => setIsFetchingFeedback(false));
    }
  }, [stopSpeaking, userId, sessionToken, topic, profile]);

  // 탭 전환/전화 착신 시 즉시 저장
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

  // 30분 자동 종료 (체험 통화)
  useEffect(() => {
    if (callState === "active" && isTrialCallRef.current && callDuration >= trialMinutes * 60) {
      endCall();
      alert(`체험 통화 ${trialMinutes}분이 종료됐습니다.`);
    }
  }, [callDuration, callState, trialMinutes, endCall]);

  // 일일 30분 한도 자동 종료 (무제한 제외)
  useEffect(() => {
    if (callState === "active" && !unlimited && monthlySeconds + callDuration >= 54000) {
      endCall();
      alert("이번달 사용 시간(900분)을 모두 사용했습니다. 다음달에 다시 이용할 수 있어요.");
    }
  }, [callDuration, callState, unlimited, monthlySeconds, endCall]);

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
        }),
      });
      const data = await res.json();
      greeting = data.greeting || `Hey ${firstName}! This is ${tutorName}. Ready to practice some English?`;
    } catch {
      greeting = `Hey ${firstName}! This is ${tutorName}. Ready to practice some English?`;
    }

    setCallState("active");
    setCallDuration(0);
    callDurationRef.current = 0;
    lastSavedRef.current = 0;
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    addMessage({ role: "assistant", content: greeting });
    speak(greeting, effectiveTutor === "rachel" ? "female" : "male");
  }, [topic, addMessage, speak, profile, unlockTTS, canMakeCall, isPaid, username]);

  const handleMicPress = useCallback(async () => {
    if (isRecording || isSpeaking) return;
    stopSpeaking();
    await startRecording();
  }, [isRecording, isSpeaking, stopSpeaking, startRecording]);

  const handleMicRelease = useCallback(async () => {
    if (!isRecording) return;

    const userText = (await stopRecording()).trim();
    if (!userText) return;

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
        if (err.error === "SESSION_EXPIRED") {
          await supabase.auth.signOut();
          router.push("/login");
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
  }, [isRecording, stopRecording, addMessage, topic, speak, profile]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isBusy = isTranscribing || isAiTyping || isSpeaking;
  const tutorDisplayName = effectiveTutor === "rachel" ? "Rachel" : "Alex";
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
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[700px]">
        {/* Header */}
        <div className="bg-gray-800 px-6 pt-14 pb-6 text-center relative">
          {callState === "idle" && view === "home" && (
            <>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setView("help")} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-xs transition-all">
                  <span>❓</span><span>도움말</span>
                </button>
                <button onClick={() => setView("settings")} className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-xs transition-all">
                  <span>⚙️</span><span>설정</span>
                </button>
              </div>
              {username === "gooster" ? (
                <div className="absolute top-4 left-4 flex flex-col gap-3">
                  <button onClick={() => setView("admin")} className="text-yellow-500 hover:text-yellow-400 text-xs">관리자</button>
                  {!isMobile && (
                    <button onClick={() => router.push("/admin/stats")} className="text-emerald-400 hover:text-emerald-300 text-xs">통계</button>
                  )}
                  <button onClick={() => router.push("/ko")} className="text-blue-400 hover:text-blue-300 text-xs">🇰🇷 한국어판</button>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 text-xs">로그아웃</button>
                </div>
              ) : username === "mh1104" ? (
                <div className="absolute top-4 left-4 flex flex-col gap-3">
                  <button onClick={() => router.push("/ko")} className="text-blue-400 hover:text-blue-300 text-xs">🇰🇷 한국어판</button>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 text-xs">로그아웃</button>
                </div>
              ) : (
                <button onClick={handleLogout} className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-xs">로그아웃</button>
              )}
            </>
          )}
          {(view === "settings" || view === "admin" || view === "help") && (
            <button onClick={() => setView("home")} className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-sm">← 뒤로</button>
          )}

          <TutorAvatar tutor={effectiveTutor} fallbackBg="bg-green-600" />
          <h1 className="text-white text-lg font-semibold">
            {effectiveTutor === "rachel" ? "Rachel" : "Alex"}
          </h1>
          <p className="text-gray-400 text-sm">
            {effectiveTutor === "rachel" ? "AI Tutor · Korean-American · From Seattle, WA" : "AI Tutor · From New York, NY"}
          </p>
          {profile && callState === "idle" && view === "home" && (
            <p className="text-green-400 text-xs mt-1">안녕하세요, {profile.name}님 👋</p>
          )}
          {callState === "active" && <p className="text-green-400 text-sm mt-1 font-mono">{formatTime(callDuration)}</p>}
          {callState === "calling" && <p className="text-yellow-400 text-sm mt-1 animate-pulse">연결 중...</p>}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {view === "help" ? (
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
              <h2 className="text-white text-sm font-bold text-center mb-2">사용 방법</h2>
              {[
                { emoji: "📞", title: "통화 시작", desc: "홈 화면에서 주제를 선택하고 '통화 시작' 버튼을 누르세요." },
                { emoji: "🎤", title: "말하기", desc: "마이크 버튼을 누르고 있는 동안 영어로 말하세요. 손을 떼면 AI가 인식합니다." },
                { emoji: "🔊", title: "AI 응답", desc: "Alex 또는 Rachel이 음성으로 답변합니다. AI가 말하는 중엔 마이크가 비활성화돼요." },
                { emoji: "✍️", title: "문법 교정", desc: "틀린 표현이 있으면 대화 말미에 'Quick tip:' 으로 부드럽게 알려줘요." },
                { emoji: "📵", title: "통화 종료", desc: "빨간 버튼을 누르면 통화가 종료됩니다." },
                { emoji: "⚙️", title: "설정", desc: "우측 상단 설정에서 이름, AI 튜터, 영어 레벨을 변경할 수 있어요.\n📱 모바일에서는 Rachel이 고정돼요. Alex 선택은 PC에서 가능해요." },
                { emoji: "🌐", title: "권장 브라우저", desc: "Chrome 또는 Samsung 브라우저를 사용하세요. 다른 브라우저는 음성 인식이 불안정할 수 있어요." },
                { emoji: "📲", title: "앱으로 설치하기", desc: "iPhone: Safari에서 접속 → 하단 공유(□↑) → 홈 화면에 추가\nAndroid: Chrome에서 접속 → 우상단 메뉴(⋮) → 홈 화면에 추가\nPC: 주소창 오른쪽 설치(+) 버튼 클릭" },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 bg-gray-800 rounded-2xl p-4">
                  <span className="text-2xl">{item.emoji}</span>
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
            <TranscriptBox messages={messages} interimTranscript="" isAiTyping={isAiTyping || isTranscribing} />
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
                  <div className="bg-gray-800 rounded-xl px-4 py-2 mb-2 text-center">
                    <p className="text-green-400 text-xs font-medium">멤버십 이용 중</p>
                    <p className="text-gray-300 text-xs mt-0.5">
                      {new Date(expiresAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}까지
                    </p>
                  </div>
                )}
                {!isUnlimited && (isPaid || trialCalls > 0) && (
                  <p className="text-gray-500 text-xs text-center mb-2">
                    이번달 {Math.floor(monthlySeconds / 60)}분 사용 · 잔여 {Math.max(0, 900 - Math.floor(monthlySeconds / 60))}분
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
                        <button onClick={startCall} className="mt-1 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold">
                          🎙️ 마이크 허용하기
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button onClick={startCall} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg">
                  📞 통화 시작
                </button>
              </div>
            ) : monthlyLimitReached ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-orange-400 text-sm font-medium">이번 결제 주기 사용량(900분)을 모두 사용했습니다</p>
                <p className="text-gray-500 text-xs">
                  {expiresAt
                    ? <>멤버십 갱신 시 초기화돼요 (이용기간 종료: {new Date(expiresAt).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })})</>
                    : "다음달 1일부터 다시 이용할 수 있어요"}
                </p>
                <p className="text-gray-400 text-xs">지금 더 이용하고 싶으면 조기 결제할 수 있어요</p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <p className="flex items-center justify-center gap-1">KB국민은행 758637-00-012739<CopyButton text="758637-00-012739" /></p>
                  <p>예금주: 송랩</p>
                  {isPaymentExempt ? null : paymentRequestedAt ? (
                    <p className="pt-1 text-emerald-400 text-xs">✅ 확인 요청됨 · 관리자 확인 후 곧 승인됩니다</p>
                  ) : (
                    <>
                      {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="ko" />}
                      <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="bankName" />
                      <button
                        onClick={requestPaymentConfirmation}
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
                <p className="text-gray-400 text-xs leading-relaxed">
                  멤버십 가입 후 이용하세요<br />월 9,900원 · 매월 900분 제공
                </p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <p className="flex items-center gap-1">KB국민은행 758637-00-012739<CopyButton text="758637-00-012739" /></p>
                  <p>예금주: 송랩</p>
                  {isPaymentExempt ? null : paymentRequestedAt ? (
                    <p className="pt-1 text-emerald-400 text-xs">✅ 확인 요청됨 · 관리자 확인 후 곧 승인됩니다</p>
                  ) : (
                    <>
                      {paymentRejectReason && <PaymentRejectNotice reason={paymentRejectReason} lang="ko" />}
                      <PaymentNoteInput value={paymentNote} onChange={setPaymentNote} variant="bankName" />
                      <button
                        onClick={requestPaymentConfirmation}
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
                    카카오톡 문의 →
                  </a>
                </div>
              </div>
            )
          )}

          {callState !== "idle" && (
            <div className="flex items-center justify-center gap-6">
              <button onClick={endCall} className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-2xl transition-all active:scale-95 shadow-lg">📵</button>
              <button
                onMouseDown={handleMicPress}
                onMouseUp={handleMicRelease}
                onTouchStart={(e) => { e.preventDefault(); handleMicPress(); }}
                onTouchEnd={(e) => { e.preventDefault(); handleMicRelease(); }}
                disabled={callState === "calling" || (isBusy && !isRecording)}
                className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-lg select-none ${
                  isRecording ? "bg-red-500 scale-110 ring-4 ring-red-400 ring-opacity-50"
                  : isBusy ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500 active:scale-95"
                }`}
              >
                {isRecording ? "🔴" : isTranscribing ? "⏳" : isSpeaking ? "🔊" : "🎤"}
              </button>
              <div className="w-16 h-16" />
            </div>
          )}

          {callState === "active" && <p className="text-gray-500 text-xs text-center mt-3">{micStatus}</p>}
        </div>

        {/* 문의하기 */}
        {callState === "idle" && view === "home" && !feedback && !isFetchingFeedback && (
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
            <button onClick={() => setShowTerms(true)} className="hover:text-gray-500">이용약관 및 개인정보처리방침</button>
          </p>
        </div>

        {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      </div>
    </main>
  );
}
