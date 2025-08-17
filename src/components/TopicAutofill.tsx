"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useBookStore } from "@/store/bookStore";

export function TopicAutofill() {
  const searchParams = useSearchParams();
  const { topic, setTopic } = useBookStore();
  const didApplyRef = useRef(false);

  useEffect(() => {
    if (didApplyRef.current) return;
    didApplyRef.current = true;
    if (!searchParams) return;
    if (topic) return; // do not override an existing topic

    let initial = searchParams.get("topic") || searchParams.get("q");

    if (!initial) {
      const first = searchParams.entries().next();
      if (!first.done) {
        const [, value] = first.value;
        initial = value || "";
      }
    }

    if (initial) setTopic(initial);
  }, [searchParams, topic, setTopic]);

  return null;
}
