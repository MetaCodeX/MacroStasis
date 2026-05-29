import { NextRequest } from "next/server"
import { GET as getGithubData } from "../route"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Helper to send SSE formatted events
  const sendEvent = async (event: string, data: any) => {
    try {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      )
    } catch (e) {
      // Suppress write errors if client disconnected before write completes
    }
  }

  // Send initial connection handshake event
  await sendEvent("connected", { status: "connected", timestamp: Date.now() })

  let lastSentDataStr = ""

  // Fetch and send initial data immediately
  try {
    const res = await getGithubData(new Request(request.url))
    if (res.ok) {
      const data = await res.json()
      lastSentDataStr = JSON.stringify(data)
      await sendEvent("github-data", data)
    }
  } catch (err) {
    console.error("Error sending initial stream data:", err)
  }

  // Polling interval to check cache/live state and send heartbeats every 15s
  const intervalId = setInterval(async () => {
    try {
      const res = await getGithubData(new Request(request.url))
      if (res.ok) {
        const data = await res.json()
        const dataStr = JSON.stringify(data)

        if (dataStr !== lastSentDataStr) {
          lastSentDataStr = dataStr
          await sendEvent("github-data", data)
        } else {
          // Send a heartbeat to maintain the connection and allow client ping-pong tracking
          await sendEvent("heartbeat", { status: "alive", timestamp: Date.now() })
        }
      }
    } catch (err) {
      console.error("Error in stream update:", err)
    }
  }, 15000)

  // Clean up timer when client connection closes
  request.signal.addEventListener("abort", () => {
    clearInterval(intervalId)
    try {
      writer.close()
    } catch (e) {}
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Direct Nginx not to buffer this stream
    },
  })
}
