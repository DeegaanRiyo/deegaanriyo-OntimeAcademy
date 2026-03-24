"use client";

export default function SlideDots() {
  return (
    <div className="slide-dots" id="sDots">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`sdot${i === 0 ? " on" : ""}`}
          onClick={() => (window as any).goSlide?.(i)}
        />
      ))}
    </div>
  );
}
