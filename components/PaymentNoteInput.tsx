"use client";

interface PaymentNoteInputProps {
  value: string;
  onChange: (value: string) => void;
  variant: "bankName" | "email";
}

const COPY = {
  bankName: {
    label: "입금자명 (필수, 계좌이체 시 표시되는 이름)",
    placeholder: "예: 홍길동",
  },
  email: {
    label: "PayPal email (required)",
    placeholder: "e.g. you@paypal.com",
  },
} as const;

export default function PaymentNoteInput({ value, onChange, variant }: PaymentNoteInputProps) {
  const { label, placeholder } = COPY[variant];

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
