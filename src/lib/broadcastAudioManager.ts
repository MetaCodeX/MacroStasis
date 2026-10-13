"use client";

import { getBroadcastState, Track } from "./broadcastSync";

export class BroadcastAudioManager {
  private static instance: BroadcastAudioManager;
  
  public musicAudio: HTMLAudioElement | null = null;
  public windAudio: HTMLAudioElement | null = null;
  
  public isPlaying = false;
  public currentTrack: Track | null = null;
  public currentTrackIndex = -1;
  public trackProgress = 0;
  public trackDuration = 0;
  
  public musicVolume = 0.85;
  public windVolume = 0.35;
  public isMuted = false;

  private listeners: Set<() => void> = new Set();
  private timer: NodeJS.Timeout | null = null;

  static getInstance(): BroadcastAudioManager {
    if (!this.instance) {
      this.instance = new BroadcastAudioManager();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== "undefined") {
      this.musicAudio = new Audio();
      this.windAudio = new Audio();

      this.musicAudio.crossOrigin = "anonymous";
      this.windAudio.crossOrigin = "anonymous";

      this.windAudio.src = "/audio/wind.wav";
      this.windAudio.loop = true;
      this.windAudio.volume = this.windVolume;

      this.musicAudio.addEventListener("timeupdate", () => {
        if (this.musicAudio) {
          this.trackProgress = this.musicAudio.currentTime;
          this.trackDuration = this.musicAudio.duration || (this.currentTrack?.duration ?? 0);
          this.notify();
        }
      });

      this.musicAudio.addEventListener("ended", () => {
        this.syncToBroadcast(true);
      });

      this.musicAudio.addEventListener("error", (e) => {
        console.warn("[BroadcastAudio] Music playback error:", e);
        setTimeout(() => this.syncToBroadcast(true), 2500);
      });
    }
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public setVolume(musicVol: number, windVol: number) {
    this.musicVolume = Math.max(0, Math.min(1, musicVol));
    this.windVolume = Math.max(0, Math.min(1, windVol));
    if (this.musicAudio) this.musicAudio.volume = this.isMuted ? 0 : this.musicVolume;
    if (this.windAudio) this.windAudio.volume = this.isMuted ? 0 : this.windVolume;
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.musicAudio) this.musicAudio.volume = this.isMuted ? 0 : this.musicVolume;
    if (this.windAudio) this.windAudio.volume = this.isMuted ? 0 : this.windVolume;
    this.notify();
  }

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.syncToBroadcast(false);

    if (this.windAudio) {
      this.windAudio.volume = this.isMuted ? 0 : this.windVolume;
      this.windAudio.play().catch(() => {});
    }

    if (!this.timer) {
      this.timer = setInterval(() => {
        this.driftCheck();
      }, 5000);
    }

    this.notify();
  }

  public stop() {
    this.isPlaying = false;
    if (this.musicAudio) this.musicAudio.pause();
    if (this.windAudio) this.windAudio.pause();
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Syncs the current audio to the exact broadcast position
   */
  public syncToBroadcast(forcePlay: boolean = false) {
    const { trackIndex, track, seekTime } = getBroadcastState();
    this.currentTrack = track;
    this.currentTrackIndex = trackIndex;

    if (!this.musicAudio) return;

    const isDifferentTrack = this.musicAudio.src !== window.location.origin + track.file && !this.musicAudio.src.endsWith(track.file);

    if (isDifferentTrack) {
      this.musicAudio.src = track.file;
      this.musicAudio.load();

      const onCanPlay = () => {
        if (!this.musicAudio) return;
        this.musicAudio.removeEventListener("canplay", onCanPlay);
        try {
          this.musicAudio.currentTime = seekTime;
        } catch {
          // Ignore
        }
        if (this.isPlaying || forcePlay) {
          this.musicAudio.volume = this.isMuted ? 0 : this.musicVolume;
          this.musicAudio.play().catch((err) => console.warn("[Broadcast] play error:", err));
        }
      };

      this.musicAudio.addEventListener("canplay", onCanPlay);
    } else {
      if (Math.abs(this.musicAudio.currentTime - seekTime) > 3) {
        this.musicAudio.currentTime = seekTime;
      }
      if (this.isPlaying || forcePlay) {
        this.musicAudio.volume = this.isMuted ? 0 : this.musicVolume;
        this.musicAudio.play().catch(() => {});
      }
    }

    this.notify();
  }

  /**
   * Drifting corrector: ensure client playback stays aligned within ±2 seconds of broadcast clock
   */
  private driftCheck() {
    if (!this.isPlaying || !this.musicAudio || this.musicAudio.paused) return;

    const { trackIndex, track, seekTime } = getBroadcastState();

    if (this.currentTrackIndex !== trackIndex) {
      this.syncToBroadcast(true);
      return;
    }

    const drift = Math.abs(this.musicAudio.currentTime - seekTime);
    if (drift > 2.5) {
      console.log(`[Broadcast] Correcting time drift (${drift.toFixed(2)}s)`);
      this.musicAudio.currentTime = seekTime;
    }
  }
}
