"use client"

import { useEffect, useState, useRef } from "react"
import { RadioManager, RadioMode, TrackInfo } from "@/lib/RadioManager"
import {
  Theme,
  Card,
  Flex,
  Box,
  Heading,
  Text,
  Badge,
  Slider,
  SegmentedControl,
  IconButton,
} from "@radix-ui/themes"

export function RadioHUD({ audioUnlocked = false, visualUnlocked = false }: { audioUnlocked?: boolean, visualUnlocked?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [track, setTrack] = useState<TrackInfo | null>(null)
  const [mode, setMode] = useState<RadioMode>('radio')
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const collapsedRef = useRef<HTMLDivElement>(null)
  
  // Toast notification state
  const [toastVisible, setToastVisible] = useState(false)
  const [toastTrack, setToastTrack] = useState<TrackInfo | null>(null)
  const toastTimeoutRef = useRef<any>(null)

  useEffect(() => {
    const manager = RadioManager.getInstance()
    const updateState = () => {
      setIsPlaying(manager.isPlaying)
      setMode(manager.mode)
      setVolume(manager.volume)
      if (!isScrubbing) {
         setProgress(manager.progress)
      }
      setDuration(manager.duration)
      
      // Handle Track Change for Toast
      if (manager.trackInfo?.title !== track?.title) {
         setTrack(manager.trackInfo)
         if (manager.trackInfo?.title) {
            setToastTrack(manager.trackInfo)
            setToastVisible(true)
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
            toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 8000)
         }
      } else {
         setTrack(manager.trackInfo)
      }
    }
    
    updateState()
    const unsubscribe = manager.subscribe(updateState)
    return () => { unsubscribe() }
  }, [track, isScrubbing])

  useEffect(() => {
    let reqId: number;
    let lastBass = 0;
    const animate = () => {
       reqId = requestAnimationFrame(animate);
       if (!collapsedRef.current) return;
       const manager = RadioManager.getInstance();
       
       let bass = 0;
       
       if (manager.isPlaying) {
           const freq = manager.getFrequencies();
           bass = Math.pow(freq.bass, 3) * 1.8;
       } else if (visualUnlocked && !audioUnlocked) {
           bass = Math.pow(Math.sin(Date.now() / 400), 2) * 1.5;
       } else {
           collapsedRef.current.style.boxShadow = '0 0 10px rgba(255,215,0,0.15)';
           collapsedRef.current.style.backgroundColor = 'transparent';
           return;
       }
       
       bass = lastBass + (bass - lastBass) * 0.25;
       lastBass = bass;

       const glowSize = 12 + bass * 35; 
       const coreOpacity = 0.15 + bass * 0.45;
       const waveOpacity = bass * 0.35;
       
       collapsedRef.current.style.boxShadow = `
         0 0 ${glowSize * 0.3}px rgba(255,215,0, ${coreOpacity}),
         0 0 ${glowSize * 0.8}px rgba(255,215,0, ${waveOpacity}),
         0 0 ${glowSize * 1.8}px rgba(255,215,0, ${waveOpacity * 0.3})
       `;
       collapsedRef.current.style.backgroundColor = `rgba(255,215,0, ${coreOpacity})`;
    }
    animate();
    return () => cancelAnimationFrame(reqId);
  }, [visualUnlocked, audioUnlocked])

  const toggleMode = () => RadioManager.getInstance().setMode(mode === 'radio' ? 'playlist' : 'radio')
  const nextTrack = () => RadioManager.getInstance().nextTrack()
  const prevTrack = () => RadioManager.getInstance().prevTrack()
  const togglePlay = () => RadioManager.getInstance().togglePlay()

  const formatTime = (time: number) => {
      if (!time || isNaN(time)) return "0:00"
      const mins = Math.floor(time / 60)
      const secs = Math.floor(time % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!visualUnlocked && !audioUnlocked) return null;

  const expanded = isHovered || isMobileOpen;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] w-0 h-0 overflow-visible">
      <Theme appearance="dark" accentColor="gold" hasBackground={false}>
      {/* Toast Notification (Top Center) */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[10000] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none ${toastVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-95'}`}>
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 shadow-[0_0_30px_rgba(255,215,0,0.15)]">
           <div className="flex gap-1 h-3 items-end">
              <div className="w-1 bg-[#ffd700] animate-[bounce_1s_infinite_0s]"></div>
              <div className="w-1 bg-[#ffd700] animate-[bounce_1s_infinite_0.2s]"></div>
              <div className="w-1 bg-[#ffd700] animate-[bounce_1s_infinite_0.4s]"></div>
           </div>
           <div>
              <div className="text-[10px] text-white/50 tracking-[0.2em] uppercase leading-none mb-1">Now Playing</div>
              <div className="text-sm font-medium text-white leading-none truncate max-w-[250px]">{toastTrack?.title || "SYSTEM BROADCAST"}</div>
           </div>
        </div>
      </div>

      {/* Floating Radio Deck Container */}
      <div 
        className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-auto overflow-hidden ${
          expanded 
            ? 'w-[260px] max-w-[85vw] h-[390px] max-h-[75vh] bg-black/95 md:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl' 
            : 'w-14 h-14 bg-black/90 border border-[#ffd700]/30 rounded-full shadow-[0_0_15px_rgba(255,215,0,0.2)] cursor-pointer hover:scale-105'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed UI Circular Button */}
        <div 
          ref={collapsedRef}
          className={`absolute inset-0 rounded-full flex items-center justify-center transition-all duration-300 ${expanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileOpen(true);
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        <div className={`relative z-20 w-full h-full flex flex-col p-3.5 transition-opacity duration-500 ${expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          
          {/* Close Button */}
          <IconButton 
              size="1"
              variant="ghost"
              color="gray"
              className="absolute top-3 right-3 z-[100]"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMobileOpen(false); setIsHovered(false); }}
              style={{ cursor: 'pointer' }}
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </IconButton>

          <Flex direction="column" gap="1" className="flex-none mb-1 mt-0.5">
             <Text size="1" className="text-[8px] tracking-[0.25em] text-white/40 uppercase mb-0.5">System Status</Text>
             <Flex align="center" gap="2">
                <span className={`w-1.5 h-1.5 rounded-full ${audioUnlocked ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse'}`} />
                <Badge size="1" color={audioUnlocked ? 'green' : 'red'} variant="surface" className="font-mono tracking-wider uppercase text-[9px] px-1.5 py-0">
                    {audioUnlocked ? 'Audio Unlocked' : 'Click to Unlock'}
                </Badge>
             </Flex>
          </Flex>

          <Flex direction="column" gap="1" className="flex-grow min-h-0" style={{ justifyContent: 'space-evenly' }}>
             {/* Art & Track Info */}
             <Flex direction="column" align="center" gap="1.5" className="text-center shrink">
                {track?.artwork ? (
                    <img src={track.artwork} alt="Album Art" className="w-16 h-16 object-cover rounded-lg shadow-[0_0_15px_rgba(255,215,0,0.15)] border border-white/10 shrink-0" />
                ) : (
                    <Box className="w-16 h-16 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.05)] shrink-0">
                        <svg className="w-8 h-8 text-white/30 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    </Box>
                )}
                <Box className="w-full shrink-0 px-1">
                   <Heading as="h4" size="1" className="text-white font-medium mb-0.5 line-clamp-2 leading-tight drop-shadow-md">
                     {track?.title || "AWAITING SIGNAL..."}
                   </Heading>
                   <Text size="1" className="text-[8px] text-white/50 font-light tracking-wide uppercase line-clamp-1">
                     {track?.artist || "SYSTEM"}
                   </Text>
                </Box>
             </Flex>

             {/* Progress Bar (Playlist only) */}
             {mode === 'playlist' ? (
                  <Flex direction="column" gap="1.5" width="100%" className="px-2">
                     <Slider
                        value={[progress]}
                        onValueChange={(val) => {
                           setIsScrubbing(true)
                           setProgress(val[0])
                        }}
                        onValueCommit={(val) => {
                           RadioManager.getInstance().seek(val[0])
                           setIsScrubbing(false)
                        }}
                        max={duration || 100}
                        step={1}
                     />
                     <Flex justify="between" className="text-[9px] text-white/40 font-mono">
                        <Text>{formatTime(progress)}</Text>
                        <Text>{formatTime(duration)}</Text>
                     </Flex>
                  </Flex>
             ) : (
                  <Flex direction="column" gap="1.5" width="100%" align="center" className="px-2">
                     <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500/80 w-full animate-pulse shadow-[0_0_10px_red]"></div>
                     </div>
                     <Flex justify="between" width="100%" align="center" className="mt-0.5">
                        <Flex gap="1" align="end" className="h-2.5">
                           <div className="w-0.5 bg-red-400 animate-[bounce_1s_infinite_0s] h-2" />
                           <div className="w-0.5 bg-red-400 animate-[bounce_1s_infinite_0.2s] h-2.5" />
                           <div className="w-0.5 bg-red-400 animate-[bounce_1s_infinite_0.4s] h-1.5" />
                        </Flex>
                        <Text size="1" className="text-[9px] text-red-400 font-mono uppercase tracking-widest drop-shadow-[0_0_5px_red]">Live Broadcast</Text>
                     </Flex>
                  </Flex>
             )}

             {/* Playback Controls */}
             <Flex align="center" justify="center" gap="3" mt="0">
                  <IconButton 
                    size="1" 
                    variant="ghost" 
                    color="gold" 
                    onClick={prevTrack} 
                    disabled={mode === 'radio'} 
                    style={{ cursor: mode === 'radio' ? 'not-allowed' : 'pointer' }}
                  >
                     <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                  </IconButton>
                  
                  <IconButton 
                    size="2" 
                    variant="solid" 
                    color="gold" 
                    radius="full" 
                    onClick={togglePlay}
                    style={{ cursor: 'pointer' }}
                    className="shadow-[0_0_10px_rgba(255,215,0,0.3)] hover:shadow-[0_0_20px_rgba(255,215,0,0.5)] transform hover:scale-105 transition-all"
                  >
                     {isPlaying ? (
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                     ) : (
                          <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                     )}
                  </IconButton>
                  
                  <IconButton 
                    size="1" 
                    variant="ghost" 
                    color="gold" 
                    onClick={nextTrack} 
                    disabled={mode === 'radio'} 
                    style={{ cursor: mode === 'radio' ? 'not-allowed' : 'pointer' }}
                  >
                     <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </IconButton>
             </Flex>

             {/* Volume Control */}
             <Card variant="surface" style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} className="mx-1">
                <Flex align="center" gap="2.5">
                   <svg className="w-3.5 h-3.5 text-white/50 flex-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                   <Slider
                      value={[volume]}
                      onValueChange={(val) => RadioManager.getInstance().setVolume(val[0])}
                      min={0}
                      max={1}
                      step={0.01}
                      className="flex-grow"
                   />
                </Flex>
             </Card>
          </Flex>

          {/* Mode Switcher */}
          <Flex direction="column" className="flex-none mt-1 border-t border-white/10 pt-2.5">
             <Text size="1" className="text-[8px] tracking-[0.25em] text-white/40 uppercase mb-1.5 text-center">Audio Link</Text>
             
             <SegmentedControl.Root 
               size="1" 
               value={mode} 
               onValueChange={(v: any) => RadioManager.getInstance().setMode(v)}
               style={{ width: '100%', border: '1px solid rgba(255,215,0,0.15)' }}
             >
               <SegmentedControl.Item value="radio" style={{ cursor: 'pointer' }}>Broadcast</SegmentedControl.Item>
               <SegmentedControl.Item value="playlist" style={{ cursor: 'pointer' }}>Session</SegmentedControl.Item>
             </SegmentedControl.Root>
          </Flex>
          
        </div>
      </div>
    </Theme>
    </div>
  )
}
