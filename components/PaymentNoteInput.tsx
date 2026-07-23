"use client";

interface PaymentNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  lang?: "ko" | "en";
}

export default function PaymentNoteInput({ value, onChange, lang = "ko" }: PaymentNoteInputProps) {
  const label =
    lang === "ko"
      ? "입금자명 또는 결제하신 이메일 (선택, 있으면 확인이 빨라져요)"
      : "Depositor name or payment email (optional, speeds up confirmation)";
  const placeholder = lang === "ko" ? "예: 홍길동 또는 you@paypal.com" : "e.g. John Doe or you@paypal.com";

  return (
    <div className="mt-1">
      <label className="block text-gray-500 text-[11px] mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 text-white rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600"
      />
    </div>
  );
}
