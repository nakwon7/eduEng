"use client";

const KB_AUTHMARK_URL =
  "https://okbfex.kbstar.com/quics?" +
  new URLSearchParams({
    page: "C021590",
    cc: "b034066:b035526",
    mHValue: "f4a6e2cb729b1ad1813b6c78261122fd",
  }).toString();

export default function KbAuthMark() {
  const openPopup = () => {
    window.open(
      KB_AUTHMARK_URL,
      "KB_AUTHMARK",
      "height=604,width=648,status=yes,toolbar=no,menubar=no,location=no"
    );
  };

  return (
    <button type="button" onClick={openPopup} className="inline-block mt-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://img1.kbstar.com/img/escrow/escrowcmark.gif"
        alt="KB 구매안전서비스(에스크로) 인증마크"
      />
    </button>
  );
}
