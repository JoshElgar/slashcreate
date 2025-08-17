"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBookStore } from "@/store/bookStore";

export function TopicAutofill() {
  const searchParams = useSearchParams();
  const { topic, setTopic } = useBookStore();

  useEffect(() => {
    if (!searchParams) return;
    if (topic) return;

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
