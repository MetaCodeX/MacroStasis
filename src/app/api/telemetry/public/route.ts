import { NextResponse } from "next/server";

export const revalidate = 10;

async function queryPrometheus(query: string): Promise<any[]> {
  try {
    const url = "http://127.0.0.1:9090/api/v1/query?query=" + encodeURIComponent(query);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.result || [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    // 1. MINECRAFT (TVCraft)
    const tpsRes = await queryPrometheus("metacodex_minecraft_tps");
    const msptRes = await queryPrometheus("metacodex_minecraft_mspt");
    const playersRes = await queryPrometheus("metacodex_minecraft_players");

    const tpsVal = tpsRes[0]?.value[1] ? parseFloat(tpsRes[0].value[1]) : 20.0;
    const msptVal = msptRes[0]?.value[1] ? parseFloat(msptRes[0].value[1]) : 50.0;
    const playersVal = playersRes[0]?.value[1] ? parseInt(playersRes[0].value[1], 10) : 0;

    // 2. TF2
    const tf2PRes = await queryPrometheus("metacodex_tf2_players");
    const tf2MRes = await queryPrometheus("metacodex_tf2_max_players");
    const tf2Online = tf2PRes.length > 0;
    const tf2Players = tf2Online ? parseInt(tf2PRes[0].value[1], 10) : 0;
    const tf2Max = tf2MRes.length > 0 ? parseInt(tf2MRes[0].value[1], 10) : 24;

    const payload = {
      timestamp: new Date().toISOString(),
      minecraft: {
        status: "online",
        name: "TVCraft Crossplay",
        tps: Math.min(20.0, Math.round(tpsVal * 10) / 10),
        mspt: Math.round(msptVal) + "ms",
        players: playersVal,
        maxPlayers: 20,
        version: "Paper 1.21.4 Crossplay"
      },
      tf2: {
        status: tf2Online ? "online" : "offline",
        name: "Troublemaker TF2",
        players: tf2Players,
        maxPlayers: tf2Max
      },
      muno: {
        status: "online",
        name: "MUNO! Engine",
        version: "v0.9.9.88"
      },
      radio: {
        status: "live",
        name: "TroubleMaker Radio",
        streamUrl: "https://radio.macrostasis.dev"
      },
      services: [
        { id: "kimeraware", name: "Kimeraware Engine", status: "operational" },
        { id: "parhelion", name: "Parhelion Suite", status: "operational" },
        { id: "riocazones", name: "Río Cazones IoT", status: "operational" },
        { id: "dnd", name: "D&D 2024 Backend", status: "operational" },
        { id: "n8n", name: "n8n Workflows", status: "operational" },
        { id: "minio", name: "MinIO S3 Storage", status: "operational" }
      ]
    };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5"
      }
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
