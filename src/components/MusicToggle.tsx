"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function MusicToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const audio = new Audio("/music.mp4");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    const tryPlay = async () => {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    };

    tryPlay();

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const kickstartIfTopicInput = (evt: Event) => {
      const target = evt.target as Element | null;
      if (!target) return;
      if (target.matches('input[placeholder="enter a topic"]')) {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
          audio.play().catch(() => {});
        }
      }
    };

    document.addEventListener("pointerdown", kickstartIfTopicInput, true);
    document.addEventListener("focusin", kickstartIfTopicInput, true);

    return () => {
      document.removeEventListener("pointerdown", kickstartIfTopicInput, true);
      document.removeEventListener("focusin", kickstartIfTopicInput, true);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 select-none">
      <button
        type="button"
        onClick={togglePlayback}
        aria-pressed={isPlaying}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className={`inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/80 backdrop-blur p-2 text-white shadow transition-colors hover:bg-neutral-800`}
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
