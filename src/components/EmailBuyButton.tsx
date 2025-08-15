"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBookStore } from "@/store/bookStore";
import { animate } from "animejs";

function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

export function EmailBuyButton() {
  const { spreads, topic, isGenerating, hasGeneratedOnce } = useBookStore();
  const anyReady = useMemo(
    () => spreads.some((s) => s.status === "ready"),
    [spreads]
  );
  const anyPending = useMemo(
    () => spreads.some((s) => s.status === "imagePending"),
    [spreads]
  );
  const canShow = hasGeneratedOnce && anyReady && !anyPending;

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canShow && containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 350,
        ease: "out(3)",
      });
    }
  }, [canShow]);

  useEffect(() => {
    if (!inputWrapRef.current) return;
    animate(inputWrapRef.current, {
      height: open ? [0, 48] : [48, 0],
      opacity: open ? [0, 1] : [1, 0],
      duration: 220,
      easing: "easeOutQuad",
    });
  }, [open]);

  if (!canShow) return null;

  const disabled = isGenerating || sending;

  const onSubmit = async () => {
    if (!isValidEmail(email)) return;
    try {
      setSending(true);
      const payload = {
        topic,
        spreads: spreads.map((s) => ({
          title: s.title,
          paragraphs: s.paragraphs,
          imageUrl: s.imageUrl,
          status: s.status,
        })),
        email,
      };
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send");
      setOpen(false);
      setEmail("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full flex justify-center py-2">
      <div className="w-full max-w-xl">
        <button
          disabled={disabled}
          className="w-full h-10 inline-flex items-center justify-center rounded-md bg-white text-black text-sm font-medium disabled:opacity-60"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (sending ? "Sending…" : "Confirm Email") : "Buy"}
        </button>

        <div
          ref={inputWrapRef}
          className="overflow-hidden"
          style={{ height: open ? 48 : 0 }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidEmail(email) && !disabled) {
                onSubmit();
              }
            }}
            placeholder="ENTER YOUR EMAIL"
            disabled={disabled}
            className="mt-2 w-full bg-transparent text-[24px] leading-none text-[#dadada] placeholder:text-[#dadada] outline-none border-0 focus:border-0 focus:outline-none caret-white disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-[#7a7a7a]">
            Press Enter to send your book details to us.
          </p>
        </div>
      </div>
    </div>
  );
}
