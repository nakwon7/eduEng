"use client";

import { useState } from "react";
import Image from "next/image";

export default function ZoomableImage({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative rounded-lg overflow-hidden border border-white/10 block w-full cursor-zoom-in"
        >
          <Image src={src} alt={alt} width={width} height={height} className="w-full h-auto" />
        </button>
        {caption && <p className="text-xs text-gray-500 text-center">{caption}</p>}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-w-full max-h-full object-contain rounded-lg" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-900/80 text-white flex items-center justify-center text-lg"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
