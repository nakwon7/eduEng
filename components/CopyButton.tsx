"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
  copiedLabel?: string;
}

export default function CopyButton({ text, className = "", label = "복사", copiedLabel = "복사됨" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`ml-2 text-xs px-2 py-0.5 rounded border transition-colors ${
        copied
          ? "border-green-500 text-green-400"
          : "border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
      } ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
