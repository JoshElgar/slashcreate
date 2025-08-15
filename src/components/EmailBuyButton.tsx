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
  const [justSent, setJustSent] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canShow && containerRef.current) {
      animate(containerRef.current, {
        opacity: [0, 1],
        duration: 350,
        ease: "out(3)",
      });
    }
  }, [canShow]);

  // Removed height animation to avoid layout shift

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
      setJustSent(true);
      await new Promise((r) => setTimeout(r, 1000));
      setJustSent(false);
      setEmail("");
      setOpen(false);
      setSending(false);
      return;
    } catch (e) {
      console.error(e);
      setSending(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {!open ? (
        <button
          disabled={disabled}
          className="h-10 inline-flex items-center justify-start rounded-md text-[#dadada] text-[24px] cursor-pointer underline disabled:opacity-60 hover:text-green-600"
          onClick={() => setOpen(true)}
        >
          request physical copy
        </button>
      ) : (
        <div ref={inputWrapRef} className="w-full flex flex-col">
          <input
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValidEmail(email) && !disabled) {
                onSubmit();
              }
            }}
            data-form-type="other"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            inputMode="email"
            spellCheck={false}
            placeholder="email"
            disabled={disabled}
            className={`w-full h-10 bg-transparent text-[24px] leading-none ${
              justSent ? "text-green-500" : "text-[#dadada]"
            } placeholder:text-[#dadada] outline-none border-0 focus:border-0 focus:outline-none caret-white disabled:opacity-50`}
          />
          <span className="mt-1 text-[10px] text-[#7a7a7a]">
            hit enter to confirm
          </span>
        </div>
      )}
    </div>
  );
}
