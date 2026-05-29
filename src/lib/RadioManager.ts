"use client";

export type RadioMode = 'radio' | 'playlist';
export type TrackInfo = { artist?: string; title?: string; name?: string; album?: string; artwork?: string };

export class RadioManager {
  static instance: RadioManager;
  audio: HTMLAudioElement;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  dataArray?: Uint8Array;
  
  ws?: WebSocket;
  mode: RadioMode = 'radio';
  token: string | null = null;
  
  isPlaying = false;
  trackInfo: TrackInfo | null = null;
  currentUrl?: string;
  pausedTime = 0;
  
  progress = 0;
  duration = 0;
  volume = 1;

  listeners: Set<() => void> = new Set();
  fadeInterval?: any;

  static getInstance() {
    if (!this.instance) {
        this.instance = new RadioManager();
    }
    return this.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
        this.audio = new Audio();
        this.audio.crossOrigin = "anonymous";
        this.token = localStorage.getItem('radio_token');
        
        this.audio.addEventListener('ended', () => {
            if (this.mode === 'playlist' && this.audio.duration > 0 && !this.audio.error) {
                this.nextTrack();
            }
        });

        this.audio.addEventListener('error', (e) => {
            console.error("Audio encountered an error:", this.audio.error);
            // Only skip to next track if it's a critical decode error (e.g. format error 4) and we are actually trying to play
            if (this.mode === 'playlist' && this.audio.error && this.audio.error.code === 4 && this.isPlaying) {
                console.log("Format error detected, skipping track in 2s...");
                setTimeout(() => this.nextTrack(), 2000); 
            } else if (this.mode === 'radio' && this.isPlaying) {
                console.log("Broadcast error detected, reconnecting in 5s...");
                setTimeout(() => this.playUrl(`https://radio.macrostasis.dev/stream.mp3?cb=${Date.now()}`), 5000); 
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.mode === 'playlist' && this.isPlaying && this.audio.src) {
               this.progress = this.audio.currentTime;
               this.duration = this.audio.duration || 0;
               this.notify();
            }
        });
    } else {
        this.audio = {} as any; // Dummy for SSR
    }
  }

  initAudio() {
    if (this.audioContext || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    
    const source = this.audioContext.createMediaElementSource(this.audio);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  connectWS() {
     if (typeof window === 'undefined') return;
     if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;

     this.ws = new WebSocket('wss://radio.macrostasis.dev/ws');
     
     this.ws.onopen = () => {
         this.setMode(this.mode);
     };
     
     this.ws.onmessage = async (e) => {
         const data = JSON.parse(e.data);
         if (data.type === 'now_playing' && this.mode === 'radio') {
             this.trackInfo = { artist: data.artist, title: data.title, artwork: data.artwork };
             this.notify();
         } else if (data.type === 'session') {
             this.token = data.token;
             if (this.token) localStorage.setItem('radio_token', this.token);
             if (data.state && data.state.current && this.mode === 'playlist') {
                 this.trackInfo = { title: data.state.current.name, artist: "TroubleMaker Playlist", artwork: data.state.current.artwork };
                 this.playUrl('https://radio.macrostasis.dev' + data.state.current.url + '?cb=' + Date.now());
             }
             this.notify();
         } else if (data.type === 'track' && this.mode === 'playlist') {
             this.trackInfo = { title: data.name, artist: "TroubleMaker Playlist", artwork: data.artwork };
             this.playUrl('https://radio.macrostasis.dev' + data.url + '?cb=' + Date.now());
             this.notify();
         }
     }
     
     this.ws.onclose = () => {
         setTimeout(() => this.connectWS(), 3000);
     }
  }

  setMode(mode: RadioMode) {
      this.mode = mode;
      this.trackInfo = null;
      this.progress = 0;
      this.duration = 0;
      this.notify();
      
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          if (mode === 'radio') {
              this.ws.send(JSON.stringify({ type: 'set_mode', mode: 'radio' }));
              this.playUrl(`https://radio.macrostasis.dev/stream.mp3?cb=${Date.now()}`);
          } else {
              this.ws.send(JSON.stringify({ type: 'set_mode', mode: 'playlist', token: this.token }));
          }
      }
      }

      playUrl(url: string) {
          this.currentUrl = url;
          this.pausedTime = 0;
          if (this.isPlaying) {
              this.audio.pause();
              this.audio.src = url;
              this.audio.load();
              this.fadeIn();
          } else {
              this.audio.pause();
              this.audio.src = "";
              this.audio.load();
          }
      }
  fadeIn() {
      this.audio.volume = 0;
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
          playPromise.catch(e => {
             console.warn("Audio play prevented:", e.message);
             // If playback fails, ensure isPlaying state is consistent
             if (e.name !== 'AbortError') {
                 this.isPlaying = false;
                 this.notify();
             }
          });
      }
      
      if (this.fadeInterval) clearInterval(this.fadeInterval);
      this.fadeInterval = setInterval(() => {
          if (this.audio.volume < this.volume * 0.95) {
              this.audio.volume += 0.05;
          } else {
              this.audio.volume = this.volume;
              clearInterval(this.fadeInterval);
          }
      }, 100);
  }

  setVolume(vol: number) {
      this.volume = Math.max(0, Math.min(1, vol));
      this.audio.volume = this.volume;
      this.notify();
  }

  seek(time: number) {
      if (this.mode === 'playlist') {
          if (this.isPlaying && this.audio.src) {
              this.audio.currentTime = time;
          } else {
              this.pausedTime = time;
          }
          this.progress = time;
          this.notify();
      }
  }

  prevTrack() {
      if (this.mode === 'playlist') {
          if (this.progress < 4 && this.ws && this.ws.readyState === WebSocket.OPEN) {
              // If less than 4 seconds in, actually go to previous track
              this.ws.send(JSON.stringify({ type: 'prev' }));
          } else {
              // Otherwise just restart current track
              this.seek(0);
          }
      }
  }

  nextTrack() {
      if (this.mode === 'playlist' && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'next' }));
      }
  }

  loadAndPlay() {
      if (this.mode === 'radio') {
          this.playUrl(`https://radio.macrostasis.dev/stream.mp3?cb=${Date.now()}`);
      } else if (this.mode === 'playlist' && this.currentUrl) {
          this.audio.pause();
          this.audio.src = this.currentUrl;
          this.audio.load();
          
          const onLoadedMetadata = () => {
              if (this.isPlaying && this.pausedTime > 0) {
                  this.audio.currentTime = this.pausedTime;
              }
              this.audio.removeEventListener('loadedmetadata', onLoadedMetadata);
          };
          this.audio.addEventListener('loadedmetadata', onLoadedMetadata);
          
          this.fadeIn();
      }
  }

  start() {
      if (this.isPlaying) return;
      this.initAudio();
      this.audioContext?.resume();
      this.isPlaying = true;
      
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connectWS();
      } else {
          this.loadAndPlay();
      }
      this.notify();
  }

  togglePlay() {
      if (!this.isPlaying) {
          this.start();
      } else {
          this.isPlaying = false;
          if (this.mode === 'playlist') {
              this.pausedTime = this.audio.currentTime;
          } else {
              this.pausedTime = 0;
          }
          if (this.fadeInterval) {
              clearInterval(this.fadeInterval);
              this.fadeInterval = undefined;
          }
          this.audio.pause();
          this.audio.src = "";
          this.audio.load();
          this.notify();
      }
  }

  getFrequencies() {
      if (!this.analyser || !this.dataArray || !this.isPlaying) return { bass: 0, mid: 0, high: 0 };
      this.analyser.getByteFrequencyData(this.dataArray as any);
      
      let bass = 0, mid = 0, high = 0;
      const third = Math.floor(this.dataArray.length / 3);
      for(let i=0; i<third; i++) bass += this.dataArray[i];
      for(let i=third; i<third*2; i++) mid += this.dataArray[i];
      for(let i=third*2; i<this.dataArray.length; i++) high += this.dataArray[i];
      
      return {
          bass: bass / (third * 255),
          mid: mid / (third * 255),
          high: high / ((this.dataArray.length - third*2) * 255)
      };
  }

  subscribe(cb: () => void) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
  }
  notify() {
      this.listeners.forEach(cb => cb());
  }
}
