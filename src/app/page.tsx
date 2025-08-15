"use client";

import { TopicBar } from "@/components/TopicBar";
import { SpreadList } from "@/components/SpreadList";

export default function Home() {
  return (
    <div className="h-screen grid grid-cols-5 grid-rows-8 bg-[#1a1a1a] text-[#dadada] overflow-hidden">
      <div className="col-start-2 col-span-3 row-start-2">
        <TopicBar />
      </div>
      <div className="col-start-2 col-span-3 row-start-3 row-span-5 min-h-0">
        <SpreadList />
      </div>
    </div>
  );
}
