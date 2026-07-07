"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopicSelector from "@/components/TopicSelector";
import TranscriptBox, { Message } from "@/components/TranscriptBox";
import UserSetup from "@/components/UserSetup";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/hooks/useUserProfile";
import AdminPanel from "@/components/AdminPanel";

type CallState = "idle" | "calling" | "active";
type View = "home" | "settings" | "admin";

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
  const [trialMinutes, setTrialMinutes] = useState<number>(30);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const isTrialCallRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorder();
  const { speak, stop: stopSpeaking, unlock: unlockTTS, isSpeaking } = useSpeechSynthesis();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const storedToken = localStorage.getItem("edueng_session");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, level, tutor, username, session_token, trial_calls, trial_minutes, expires_at, unlimited, blocked")
        .eq("id", session.user.id)
        .single();

      if (!profileData || profileData.session_token !== storedToken) {
        await supabase.auth.signOut();
        localStorage.removeItem("edueng_session");
        router.push("/login");
        return;
      }

      setUserId(session.user.id);
      setSessionToken(storedToken);
      setUsername(profileData.username);
      setProfile({ name: profileData.name, level: profileData.level, tutor: profileData.tutor || "alex" });
      setTrialCalls(profileData.trial_calls ?? 0);
      setTrialMinutes(profileData.trial_minutes ?? 30);
      setExpiresAt(profileData.expires_at ?? null);
      setUnlimited(profileData.unlimited ?? false);
      setBlocked(profileData.blocked ?? false);
      setLoaded(true);
    };
    init();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem("edueng_session");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const saveProfile = async (p: UserProfile) => {
    if (!userId) return;
    await supabase.from("profiles").update({ name: p.name, level: p.level, tutor: p.tutor }).eq("id", userId);
    setProfile(p);
    setView("home");
  };

  const isPaid = !!expiresAt && new Date(expiresAt) > new Date();
  const isUnlimited = username === "gooster" || unlimited;
  const canMakeCall = isUnlimited || isPaid || trialCalls > 0;

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    const wasTrial = isTrialCallRef.current;
    isTrialCallRef.current = false;

    const duration = callDuration;
    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);

    if (userId && sessionToken && duration > 0) {
      fetch("/api/call/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionToken, seconds: duration }),
      });
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
  }, [stopSpeaking, userId, sessionToken, callDuration]);

  // 30분 자동 종료 (체험 통화)
  useEffect(() => {
    if (callState === "active" && isTrialCallRef.current && callDuration >= trialMinutes * 60) {
      endCall();
      alert(`체험 통화 ${trialMinutes}분이 종료됐습니다.`);
    }
  }, [callDuration, callState, trialMinutes, endCall]);

  const startCall = useCallback(async () => {
    if (!canMakeCall) return;
    isTrialCallRef.current = !isPaid && !isUnlimited;
    unlockTTS();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      alert("마이크 권한이 필요해요.");
      return;
    }

    setCallState("calling");
    setTimeout(() => {
      setCallState("active");
      setCallDuration(0);
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

      const firstName = profile?.name || "there";
      const tutorName = profile?.tutor === "rachel" ? "Rachel" : "Alex";
      const greeting =
        topic === "Self Introduction" ? `Hello ${firstName}! I'm ${tutorName}. Let's practice self-introductions. Could you tell me a bit about yourself?`
        : topic === "Business English" ? `Good day ${firstName}! I'm ${tutorName}. Let's practice business English. How would you introduce yourself to a new colleague?`
        : topic === "Travel" ? `Hi ${firstName}! I'm ${tutorName}. Let's talk about travel. Have you been anywhere interesting lately?`
        : topic === "Health & Fitness" ? `Hey ${firstName}! I'm ${tutorName}. Let's talk about health and fitness. Do you exercise regularly?`
        : topic === "Food & Cooking" ? `Hi ${firstName}! I'm ${tutorName}. Let's chat about food. Do you enjoy cooking?`
        : topic === "Movies & TV" ? `Hey ${firstName}! I'm ${tutorName}. Let's talk about movies and TV. Watched anything good lately?`
        : topic === "Work & Career" ? `Good day ${firstName}! I'm ${tutorName}. Let's practice work-related English. Tell me about your job!`
        : `Hey ${firstName}! This is ${tutorName}, your English tutor. How are you doing today?`;

      addMessage({ role: "assistant", content: greeting });
      speak(greeting);
    }, 1500);
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

      speak(aiText);
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
  const micStatus = isRecording ? "듣는 중... 손을 떼면 전송"
    : isTranscribing ? "인식 중..."
    : isAiTyping ? "Alex가 생각 중..."
    : isSpeaking ? "Alex가 말하는 중..."
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
        <div className="bg-gray-800 px-6 pt-8 pb-6 text-center relative">
          {callState === "idle" && view === "home" && (
            <>
              <button onClick={() => setView("settings")} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 text-xl">⚙️</button>
              <button onClick={handleLogout} className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-xs">로그아웃</button>
              {username === "gooster" && (
                <button onClick={() => setView("admin")} className="absolute top-8 left-4 text-yellow-500 hover:text-yellow-400 text-xs">관리자</button>
              )}
            </>
          )}
          {(view === "settings" || view === "admin") && (
            <button onClick={() => setView("home")} className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-sm">← 뒤로</button>
          )}

          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            {profile?.tutor === "rachel" ? "🌸" : "🎓"}
          </div>
          <h1 className="text-white text-lg font-semibold">
            {profile?.tutor === "rachel" ? "Rachel" : "Alex"}
          </h1>
          <p className="text-gray-400 text-sm">
            {profile?.tutor === "rachel" ? "Warm & Patient" : "Friendly & Encouraging"}
          </p>
          {profile && callState === "idle" && view === "home" && (
            <p className="text-green-400 text-xs mt-1">안녕하세요, {profile.name}님 👋</p>
          )}
          {callState === "active" && <p className="text-green-400 text-sm mt-1 font-mono">{formatTime(callDuration)}</p>}
          {callState === "calling" && <p className="text-yellow-400 text-sm mt-1 animate-pulse">연결 중...</p>}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {view === "admin" && userId && sessionToken ? (
            <AdminPanel userId={userId} sessionToken={sessionToken} />
          ) : view === "settings" ? (
            <UserSetup existing={profile || undefined} onComplete={saveProfile} />
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
          {callState === "idle" && view === "home" && (
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
                  <p className="text-gray-500 text-xs text-center mb-2">
                    이용 기간 {new Date(expiresAt).toLocaleDateString("ko-KR")}까지
                  </p>
                )}
                <button onClick={startCall} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg">
                  📞 통화 시작
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-white text-sm font-medium">체험 횟수를 모두 사용했습니다</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  멤버십 가입 후 무제한으로 이용하세요<br />월 9,900원
                </p>
                <div className="bg-gray-800 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                  <p>토스 1000-4983-0654</p>
                  <p>예금주: 최귀송</p>
                  <a
                    href="https://open.kakao.com/o/sPanl0Ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-yellow-400 hover:text-yellow-300 pt-1"
                  >
                    입금 후 카카오톡으로 아이디 알려주기 →
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
      </div>
    </main>
  );
}
