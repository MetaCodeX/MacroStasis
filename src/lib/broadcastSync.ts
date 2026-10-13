export interface Track {
  title: string;
  artist: string;
  file: string;
  duration: number; // in seconds
}

export const CURATOR_ALBUM: Track[] = [
  {
    title: "Localized memory loss",
    artist: "The Curator",
    file: "/audio/curator/1 - The Curator - Localized memory loss.mp3",
    duration: 229.09,
  },
  {
    title: "Continuous recurrence of expressions",
    artist: "The Curator",
    file: "/audio/curator/2 - The Curator - Continuous recurrence of expressions.mp3",
    duration: 347.09,
  },
  {
    title: "Past memory bias",
    artist: "The Curator",
    file: "/audio/curator/3 - The Curator - Past memory bias.mp3",
    duration: 325.09,
  },
  {
    title: "Prolonged (distant)",
    artist: "The Curator",
    file: "/audio/curator/4 - The Curator - Prolonged (distant).mp3",
    duration: 260.10,
  },
  {
    title: "Speech impediments",
    artist: "The Curator",
    file: "/audio/curator/5 - The Curator - Speech impediments.mp3",
    duration: 378.62,
  },
  {
    title: "Retrogression to an early self",
    artist: "The Curator",
    file: "/audio/curator/6 - The Curator - Retrogression to an early self.mp3",
    duration: 287.16,
  },
  {
    title: "Retrospective falsification",
    artist: "The Curator",
    file: "/audio/curator/7 - The Curator - Retrospective falsification.mp3",
    duration: 288.05,
  },
  {
    title: "The isolation effect",
    artist: "The Curator",
    file: "/audio/curator/8 - The Curator - The isolation effect.mp3",
    duration: 296.36,
  },
  {
    title: "Revealing dementia",
    artist: "The Curator",
    file: "/audio/curator/9 - The Curator - Revealing dementia.mp3",
    duration: 307.41,
  },
];

export const TOTAL_LOOP_DURATION = CURATOR_ALBUM.reduce((acc, t) => acc + t.duration, 0); // ~2718.97 seconds (~45.3 mins)

/**
 * Calculates current global broadcast track and seek position
 * based on absolute Unix timestamp so all clients sync to the exact same point in time.
 */
export function getBroadcastState(nowMs: number = Date.now()) {
  const epochSeconds = Math.floor(nowMs / 1000);
  let offsetInLoop = epochSeconds % Math.floor(TOTAL_LOOP_DURATION);

  for (let i = 0; i < CURATOR_ALBUM.length; i++) {
    const track = CURATOR_ALBUM[i];
    if (offsetInLoop < track.duration) {
      return {
        trackIndex: i,
        track,
        seekTime: offsetInLoop,
        remainingTime: track.duration - offsetInLoop,
      };
    }
    offsetInLoop -= track.duration;
  }

  return {
    trackIndex: 0,
    track: CURATOR_ALBUM[0],
    seekTime: 0,
    remainingTime: CURATOR_ALBUM[0].duration,
  };
}
