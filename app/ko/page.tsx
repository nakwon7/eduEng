"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAudioRecorderKo } from "@/hooks/useAudioRecorderKo";
import { useKoreanSpeech } from "@/hooks/useKoreanSpeech";
import TranscriptBox, { Message } from "@/components/TranscriptBox";

type CallState = "idle" | "calling" | "active";

type KoProfile = {
  name: string;
  level: "beginner" | "intermediate" | "advanced";
  tutor: "minjun" | "jia";
};

const KO_TOPICS = [
  { id: "greetings", label: "Greetings", emoji: "👋", value: "Greetings & Introductions (인사)" },
  { id: "daily", label: "Daily Life", emoji: "☕", value: "Daily Conversation (일상대화)" },
  { id: "food", label: "Food", emoji: "🍜", value: "Food & Restaurants (음식/식당)" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", value: "Shopping (쇼핑)" },
  { id: "kdrama", label: "K-Drama", emoji: "🎬", value: "K-Drama & K-Pop Phrases" },
  { id: "transport", label: "Transport", emoji: "🚇", value: "Transportation in Korea (교통)" },
  { id: "culture", label: "Culture", emoji: "🏮", value: "Korean Culture (한국 문화)" },
  { id: "word", label: "Word Practice", emoji: "📖", value: "Word Practice" },
];

export default function KoPage() {
  const router = useRouter();
  const [callState, setCallState] = useState<CallState>("idle");
  const [topic, setTopic] = useState(KO_TOPICS[0].value);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [profile, setProfile] = useState<KoProfile>({ name: "Student", level: "beginner", tutor: "minjun" });
  const [username, setUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [unlimited, setUnlimited] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const callDurationRef = useRef(0);
  const callStateRef = useRef<CallState>("idle");
  const messagesRef = useRef<Message[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useAudioRecorderKo();
  const { speak, stop: stopSpeaking, unlock: unlockTTS, isSpeaking } = useKoreanSpeech();

  useEffect(() => { callDurationRef.current = callDuration; }, [callDuration]);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!session) { router.push("/login"); return; }

        const storedToken = localStorage.getItem("turingcall_session");
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, session_token, expires_at, unlimited")
          .eq("id", session.user.id)
          .single();

        const allowedUsers = ["gooster", "mh1104"];
        if (!profileData || profileData.session_token !== storedToken || !allowedUsers.includes(profileData.username)) {
          router.push("/app");
          return;
        }

        setUsername(profileData.username);
        setExpiresAt(profileData.expires_at ?? null);
        setUnlimited(profileData.unlimited ?? false);
        setLoaded(true);
      } else if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const addMessage = useCallback((msg: Message) => {
    messagesRef.current = [...messagesRef.current, msg];
    setMessages([...messagesRef.current]);
  }, []);

  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopSpeaking();
    setCallState("idle");
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);
    callDurationRef.current = 0;
  }, [stopSpeaking]);

  const startCall = useCallback(() => {
    unlockTTS();
    setCallState("calling");

    setTimeout(() => {
      setCallState("active");
      setCallDuration(0);
      callDurationRef.current = 0;
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

      const tutorName = effectiveTutor === "jia" ? "지아" : "민준";
      const tutorCopula = effectiveTutor === "jia" ? "지아예요" : "민준이에요";
      const greeting =
        topic === "Word Practice"
          ? `안녕하세요, ${profile.name}! 저는 ${tutorCopula}. 오늘 단어 연습 해봐요! 준비됐어요?`
          : topic.includes("인사")
          ? `안녕하세요, ${profile.name}! 저는 ${tutorCopula}. 오늘 인사 연습 해봐요. 자기소개 해주세요!`
          : `안녕하세요, ${profile.name}! 저는 ${tutorCopula}. 오늘도 한국어 연습 해봐요!`;

      addMessage({ role: "assistant", content: greeting });
      speak(greeting, effectiveTutor === "jia" ? "female" : "male");
    }, 1500);
  }, [topic, addMessage, speak, profile, unlockTTS, effectiveTutor]);

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
      const res = await fetch("/api/chat-ko", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic, profile }),
      });

      if (!res.ok) throw new Error("API error");

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
  }, [isRecording, stopRecording, addMessage, topic, speak, profile]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isBusy = isTranscribing || isAiTyping || isSpeaking;
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const effectiveTutor = isMobile ? "jia" : profile.tutor;
  const tutorName = effectiveTutor === "jia" ? "Jia (지아)" : "MinJun (민준)";

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
        {/* Header */}
        <div className="bg-gray-800 px-6 pt-14 pb-6 text-center relative">
          {callState === "idle" && (
            <>
              <button
                onClick={() => router.push("/app")}
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-300 text-xs"
              >
                ← Back
              </button>
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setShowSetup(!showSetup)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-300 text-xs"
                >
                  ⚙️ Setup
                </button>
              </div>
            </>
          )}

          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
            {effectiveTutor === "jia" ? "🌸" : "🎓"}
          </div>
          <h1 className="text-white text-lg font-semibold">{tutorName}</h1>
          <p className="text-gray-400 text-sm">Korean Tutor</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-blue-400 text-xs font-medium bg-blue-900/40 px-2 py-0.5 rounded-full">
              🇰🇷 Korean for Foreigners
            </span>
            <span className="text-yellow-400 text-xs bg-yellow-900/40 px-2 py-0.5 rounded-full">
              Admin Only
            </span>
          </div>
          {callState === "active" && (
            <p className="text-green-400 text-sm mt-1 font-mono">{formatTime(callDuration)}</p>
          )}
          {callState === "calling" && (
            <p className="text-yellow-400 text-sm mt-1 animate-pulse">Connecting...</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
          {showSetup && callState === "idle" ? (
            <div className="flex-1 space-y-4">
              <h2 className="text-white text-sm font-bold">Setup</h2>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Your Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
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
                      {lvl === "beginner" ? "초급" : lvl === "intermediate" ? "중급" : "고급"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Tutor</label>
                {isMobile ? (
                  <div className="bg-gray-800 rounded-xl px-4 py-3 text-xs text-gray-400">
                    튜터 선택은 PC에서 가능해요. 모바일에서는 Jia(지아)와 대화해요.
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
                        {t === "jia" ? "🌸 Jia (지아)" : "🎓 MinJun (민준)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowSetup(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-sm"
              >
                Save
              </button>

              <div className="mt-6">
                <button
                  onClick={async () => { await supabase.auth.signOut(); localStorage.removeItem("turingcall_session"); router.push("/login"); }}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl text-sm"
                >
                  로그아웃
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
                      <span className="text-xl">{t.emoji}</span>
                      <p className="text-sm font-medium mt-1">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-gray-500 text-xs mb-1">
                  Hello, {profile.name} · Level: {profile.level}
                </p>
              </div>
            </div>
          ) : (
            <TranscriptBox messages={messages} interimTranscript="" isAiTyping={isAiTyping || isTranscribing} />
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-8 pt-4">
          {callState === "idle" && !showSetup && (
            <>
              {!unlimited && expiresAt && new Date(expiresAt) > new Date() && (
                <div className="bg-gray-800 rounded-xl px-4 py-2 mb-2 text-center">
                  <p className="text-blue-400 text-xs font-medium">멤버십 이용 중</p>
                  <p className="text-gray-300 text-xs mt-0.5">{new Date(expiresAt).toLocaleDateString("ko-KR")}까지</p>
                </div>
              )}
              <button
                onClick={startCall}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg transition-all active:scale-95 shadow-lg"
              >
                📞 Start Call
              </button>
            </>
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
      </div>
    </main>
  );
}
