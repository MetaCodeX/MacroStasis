import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

export const dynamic = "force-dynamic"

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64")
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`

async function getAccessToken() {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token || "",
    }),
  })
  return response.json()
}

async function getNowPlaying() {
  const { access_token } = await getAccessToken()
  return fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    cache: "no-store",
  })
}

async function getBase64Image(url: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) return ""
    const buffer = await res.arrayBuffer()
    return `data:image/jpeg;base64,${Buffer.from(buffer).toString("base64")}`
  } catch (e) {
    return ""
  }
}

// Helper to escape XML special characters
function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;"
      case ">": return "&gt;"
      case "&": return "&amp;"
      case "'": return "&apos;"
      case '"': return "&quot;"
      default: return c
    }
  })
}

const LAST_SONG_FILE = path.join(process.cwd(), "spotify-last-song.json")

interface CachedSong {
  title: string
  artist: string
  progress: number
  duration: number
  albumArtBase64: string
}

let memoryLastSong: CachedSong | null = null

async function saveLastSong(song: CachedSong) {
  memoryLastSong = song
  try {
    await fs.writeFile(LAST_SONG_FILE, JSON.stringify(song, null, 2), "utf-8")
  } catch (err) {
    console.error("Failed to write last song cache:", err)
  }
}

async function loadLastSong(): Promise<CachedSong | null> {
  if (memoryLastSong) return memoryLastSong
  try {
    const data = await fs.readFile(LAST_SONG_FILE, "utf-8")
    memoryLastSong = JSON.parse(data)
    return memoryLastSong
  } catch (err) {
    return null
  }
}

export async function GET() {
  const headers = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store",
  }

  try {
    const response = await getNowPlaying()

    if (response.status === 204 || response.status > 400) {
      const lastPlayed = await loadLastSong()
      if (lastPlayed) {
        const svg = getNowPlayingSVG({
          title: lastPlayed.title,
          artist: lastPlayed.artist,
          isPlaying: false,
          progress: 0,
          duration: lastPlayed.duration,
          albumArtBase64: lastPlayed.albumArtBase64,
          label: "RECENTLY PLAYED",
        })
        return new Response(svg, { headers })
      }
      return new Response(getOfflineSVG(), { headers })
    }

    const song = await response.json()
    if (!song.item) {
      const lastPlayed = await loadLastSong()
      if (lastPlayed) {
        const svg = getNowPlayingSVG({
          title: lastPlayed.title,
          artist: lastPlayed.artist,
          isPlaying: false,
          progress: 0,
          duration: lastPlayed.duration,
          albumArtBase64: lastPlayed.albumArtBase64,
          label: "RECENTLY PLAYED",
        })
        return new Response(svg, { headers })
      }
      return new Response(getOfflineSVG(), { headers })
    }

    const isPlaying = song.is_playing
    const title = escapeXml(song.item.name)
    const artist = escapeXml(song.item.artists.map((_artist: any) => _artist.name).join(", "))
    const progress = song.progress_ms
    const duration = song.item.duration_ms
    const albumArtUrl = song.item.album.images[0]?.url
    const albumArtBase64 = albumArtUrl ? await getBase64Image(albumArtUrl) : ""

    // Save to cache
    await saveLastSong({
      title,
      artist,
      progress,
      duration,
      albumArtBase64,
    })

    const svg = getNowPlayingSVG({
      title,
      artist,
      isPlaying,
      progress,
      duration,
      albumArtBase64,
      label: isPlaying ? "NOW PLAYING ON SPOTIFY" : "LAST PLAYED ON SPOTIFY",
    })

    return new Response(svg, { headers })
  } catch (error) {
    console.error("Error generating Spotify SVG:", error)
    const lastPlayed = await loadLastSong()
    if (lastPlayed) {
      const svg = getNowPlayingSVG({
        title: lastPlayed.title,
        artist: lastPlayed.artist,
        isPlaying: false,
        progress: 0,
        duration: lastPlayed.duration,
        albumArtBase64: lastPlayed.albumArtBase64,
        label: "RECENTLY PLAYED",
      })
      return new Response(svg, { headers })
    }
    return new Response(getOfflineSVG(), { headers })
  }
}

function getNowPlayingSVG({
  title,
  artist,
  isPlaying,
  progress,
  duration,
  albumArtBase64,
  label = "NOW PLAYING ON SPOTIFY",
}: {
  title: string
  artist: string
  isPlaying: boolean
  progress: number
  duration: number
  albumArtBase64: string
  label?: string
}) {
  const percent = Math.min(100, Math.max(0, (progress / duration) * 100))
  const progressWidth = (220 * percent) / 100

  // Format time strings (MM:SS)
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const timeString = `${formatTime(progress)} / ${formatTime(duration)}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 110" width="450" height="110">
    <style>
      .card {
        fill: #03050a;
        stroke: rgba(255, 215, 0, 0.15);
        stroke-width: 1;
        rx: 10px;
      }
      .title {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        fill: #ffffff;
        font-weight: 600;
      }
      .artist {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        fill: #a0aec0;
      }
      .time {
        font-family: monospace;
        font-size: 10px;
        fill: #718096;
      }
      .now-playing {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 9px;
        fill: #ffd700;
        font-weight: 700;
        letter-spacing: 1.5px;
      }
      .eq-bar {
        fill: #ffd700;
        transform-origin: bottom;
      }
      @keyframes eq-bounce-1 {
        0% { transform: scaleY(0.2); }
        100% { transform: scaleY(1.0); }
      }
      @keyframes eq-bounce-2 {
        0% { transform: scaleY(0.3); }
        100% { transform: scaleY(0.85); }
      }
      @keyframes eq-bounce-3 {
        0% { transform: scaleY(0.15); }
        100% { transform: scaleY(0.95); }
      }
      .bar-1 { animation: eq-bounce-1 0.6s ease-in-out infinite alternate; }
      .bar-2 { animation: eq-bounce-2 0.45s ease-in-out infinite alternate; }
      .bar-3 { animation: eq-bounce-3 0.55s ease-in-out infinite alternate; }
    </style>

    <!-- Card Background -->
    <rect width="448" height="108" class="card" x="1" y="1" />

    <!-- Album Art -->
    <g transform="translate(14, 14)">
      <clipPath id="album-clip">
        <rect width="80" height="80" rx="6" />
      </clipPath>
      ${
        albumArtBase64
          ? `<image width="80" height="80" href="${albumArtBase64}" clip-path="url(#album-clip)" />`
          : `<rect width="80" height="80" fill="#1a202c" clip-path="url(#album-clip)" />
             <path d="M40 30v20M35 50h10" stroke="#ffd700" stroke-width="3" stroke-linecap="round" />`
      }
    </g>

    <!-- Content -->
    <g transform="translate(110, 0)">
      <!-- Tag -->
      <text x="0" y="24" class="now-playing">${label}</text>

      <!-- Song Title -->
      <text x="0" y="44" class="title" width="220" clip-path="url(#text-clip)">
        ${title.length > 28 ? title.slice(0, 26) + "..." : title}
      </text>
      
      <!-- Artist -->
      <text x="0" y="62" class="artist">
        ${artist.length > 34 ? artist.slice(0, 32) + "..." : artist}
      </text>

      <!-- Progress Bar Track -->
      <rect x="0" y="76" width="220" height="4" fill="#1a202c" rx="2" />
      
      <!-- Progress Bar Active -->
      <rect x="0" y="76" width="${progressWidth}" height="4" fill="#ffd700" rx="2" />

      <!-- Progress Time -->
      <text x="0" y="94" class="time">${timeString}</text>
    </g>

    <!-- Animated Equalizer -->
    ${
      isPlaying
        ? `<g transform="translate(405, 54)">
            <rect class="eq-bar bar-1" x="0" y="-20" width="3" height="20" />
            <rect class="eq-bar bar-2" x="5" y="-20" width="3" height="20" />
            <rect class="eq-bar bar-3" x="10" y="-20" width="3" height="20" />
          </g>`
        : `<g transform="translate(405, 54)">
            <rect class="eq-bar" x="0" y="-4" width="3" height="4" />
            <rect class="eq-bar" x="5" y="-6" width="3" height="6" />
            <rect class="eq-bar" x="10" y="-3" width="3" height="3" />
          </g>`
    }
  </svg>`
}

function getOfflineSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 110" width="450" height="110">
    <style>
      .card {
        fill: #03050a;
        stroke: rgba(255, 215, 0, 0.15);
        stroke-width: 1;
        rx: 10px;
      }
      .title {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        fill: #ffffff;
        font-weight: 600;
      }
      .artist {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        fill: #a0aec0;
      }
      .now-playing {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 9px;
        fill: #ffd700;
        font-weight: 700;
        letter-spacing: 1.5px;
      }
    </style>

    <rect width="448" height="108" class="card" x="1" y="1" />

    <!-- Album Art Placeholder -->
    <g transform="translate(14, 14)">
      <rect width="80" height="80" fill="#0d1117" rx="6" stroke="rgba(255,215,0,0.05)" stroke-width="1" />
      <!-- Music Note Icon SVG -->
      <path d="M48 24v32M48 32c-3.5 0-7 1.5-9 4.5s-2 7 1 9.5 7.5 1 9.5-2 1.5-7.5-1.5-10V28l12-3v8" stroke="#ffd700" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round" />
    </g>

    <!-- Content -->
    <g transform="translate(110, 0)">
      <text x="0" y="28" class="now-playing">OFFLINE</text>
      <text x="0" y="52" class="title">Not playing anything</text>
      <text x="0" y="72" class="artist">Spotify is currently inactive</text>
    </g>
  </svg>`
}
