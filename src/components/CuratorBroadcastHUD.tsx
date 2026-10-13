"use client";

import { useEffect, useState } from "react";
import { BroadcastAudioManager } from "@/lib/broadcastAudioManager";

export function CuratorBroadcastHUD() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const manager = BroadcastAudioManager.getInstance();

    const updateState = () => {
      setIsPlaying(manager.isPlaying);
      setProgress(manager.trackProgress);
      setDuration(manager.trackDuration);
      setIsMuted(manager.isMuted);
    };

    updateState();
    const unsubscribe = manager.subscribe(updateState);

    // Initial sync trigger
    manager.syncToBroadcast(false);

    // Auto-unlock audio on first user gesture anywhere
    const handleGesture = () => {
      if (!manager.isPlaying) {
        manager.start();
      }
    };

    window.addEventListener("click", handleGesture, { once: true, passive: true });
    window.addEventListener("keydown", handleGesture, { once: true, passive: true });
    window.addEventListener("touchstart", handleGesture, { once: true, passive: true });

    return () => {
      unsubscribe();
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
    };
  }, []);

  const handleToggle = () => {
    const manager = BroadcastAudioManager.getInstance();
    manager.togglePlay();
  };

  const handleMute = () => {
    const manager = BroadcastAudioManager.getInstance();
    manager.toggleMute();
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Subtle discreet progress bar */}
      <div className="w-24 bg-white/10 rounded-full h-1 overflow-hidden">
        <div
          className="bg-white/60 h-full transition-all duration-300 rounded-full"
          style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
        />
      </div>

      {/* Mute icon */}
      <button
        onClick={handleMute}
        aria-label="Mute / Unmute"
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition duration-200"
      >
        {isMuted ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>

      {/* Play/Pause icon */}
      <button
        onClick={handleToggle}
        aria-label="Play / Pause"
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition duration-200"
      >
        {isPlaying ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
