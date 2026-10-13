"use client";

import { useEffect, useState } from "react";
import { BroadcastAudioManager } from "@/lib/broadcastAudioManager";
import { Track } from "@/lib/broadcastSync";

export function CuratorBroadcastHUD() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    const manager = BroadcastAudioManager.getInstance();

    const updateState = () => {
      setIsPlaying(manager.isPlaying);
      setTrack(manager.currentTrack);
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
      setUserInteracted(true);
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

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleToggle = () => {
    const manager = BroadcastAudioManager.getInstance();
    manager.togglePlay();
  };

  const handleMute = () => {
    const manager = BroadcastAudioManager.getInstance();
    manager.toggleMute();
  };

  return (
    <>
      {/* Tap to listen banner if audio autoplay was blocked by browser policy */}
      {!userInteracted && !isPlaying && (
        <div
          onClick={handleToggle}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0e1220]/80 border border-white/20 backdrop-blur-md px-6 py-2.5 rounded-full text-xs tracking-widest text-[#d8e0f5] uppercase cursor-pointer hover:bg-[#1a223a] transition-all duration-300 animate-pulse shadow-lg flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Toca o haz clic para sincronizar audio broadcast
        </div>
      )}

      {/* Persistent Minimalist HUD Player */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg bg-[#070b14]/75 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl text-white/90">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-emerald-400 animate-ping" : "bg-neutral-500"}`}></span>
              <span className={`absolute w-2 h-2 rounded-full ${isPlaying ? "bg-emerald-400" : "bg-neutral-500"}`}></span>
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white/90 truncate tracking-wide">
                {track ? track.title : "Continuous Recurrence"}
              </div>
              <div className="text-[10px] text-white/50 tracking-wider uppercase">
                The Curator • Broadcast en vivo
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMute}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/70 hover:text-white text-xs"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={handleToggle}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition text-xs font-medium tracking-wide flex items-center gap-1.5"
            >
              {isPlaying ? (
                <>
                  <span>⏸</span> Pausa
                </>
              ) : (
                <>
                  <span>▶</span> Conectar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Broadcast Progress Bar */}
        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-blue-400 to-indigo-300 h-full transition-all duration-300 rounded-full"
            style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-white/40 mt-1 font-mono">
          <span>{formatTime(progress)}</span>
          <span className="text-emerald-400/80 uppercase tracking-widest text-[9px]">LIVE SYNC</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </>
  );
}
