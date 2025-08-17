"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TopicBar } from "@/components/TopicBar";
import { SpreadList } from "@/components/SpreadList";
import { EmailBuyButton } from "../components/EmailBuyButton";
import { useBookStore } from "@/store/bookStore";

export default function Home() {
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

  return (
    <div className="h-screen grid grid-cols-10 md:grid-cols-5 grid-rows-8 bg-app-bg text-app-fg overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(80%_50%_at_50%_100%,_rgba(255,255,255,0.05),_transparent_70%)]" />
      <div className="col-start-1 col-span-1 row-start-1 p-4">
        <p className="text-sm text-app-fg/50 pointer-events-none">/create</p>
      </div>
      <div className="col-start-2! col-span-8 md:col-span-3 row-start-2">
        <TopicBar />
      </div>
      <div className="col-start-2! col-span-8 md:col-span-3 row-start-3 row-span-4 min-h-0">
        <SpreadList />
      </div>
      <div className="col-start-2! col-span-8 md:col-span-3 row-start-7 flex">
        <EmailBuyButton />
      </div>
    </div>
  );
}
