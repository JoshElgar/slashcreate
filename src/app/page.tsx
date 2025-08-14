"use client";

import { useRef } from "react";

export default function Home() {
  const buildSectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  // Otherwise, show the regular content
  return (
    <div className="flex min-h-screen flex-col relative bg-[#F2F2F2] text-black">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(/noise.png)",
          backgroundRepeat: "repeat",
          opacity: 0.85,
          mixBlendMode: "overlay",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.4) 100%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 100%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 100%)",
        }}
      />

      {/* Hero section */}
      <div className="relative h-screen overflow-hidden">
        <main className="relative flex flex-col items-center justify-between h-full px-4 pt-0 pb-16 sm:justify-center sm:pb-0">
          <h1 className="text-xl sm:text-2xl text-center md:text-4xl font-bold mt-32 sm:mt-0 mb-0 sm:mb-24 md:mb-48 mx-auto px-4 md:px-8 font-advercase uppercase">
            Building products you keep coming back to.
          </h1>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="https://cal.com/elgar/30min"
              className="bg-black text-white font-medium rounded-none px-6 py-3 transition-all duration-300 hover:scale-105 focus:outline-none z-50 inline-block text-center font-geist"
            >
              Work with us
            </a>
            <button
              onClick={() => scrollToSection(buildSectionRef)}
              className="bg-white text-black border border-black font-medium rounded-none px-6 py-3 transition-all duration-300 hover:scale-105 focus:outline-none z-50 inline-block font-geist"
            >
              See what we can build
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
