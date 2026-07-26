// 마지막 알림 시각 저장 (서버 인스턴스 단위, 1시간 쿨다운)
const lastAlertTime: Record<string, number> = {};
const COOLDOWN_MS = 60 * 60 * 1000; // 1시간

export async function sendTelegramAlert(message: string, key: string = "default") {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  const now = Date.now();
  if (lastAlertTime[key] && now - lastAlertTime[key] < COOLDOWN_MS) return;
  lastAlertTime[key] = now;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    if (!res.ok) {
      console.error("Telegram alert failed:", res.status, await res.text());
    }
  } catch (error) {
    // 알림 실패해도 메인 흐름에 영향 없음 — 다만 로그는 남겨서 원인 추적 가능하게 함
    console.error("Telegram alert error:", error);
  }
}
