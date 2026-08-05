"use client"

import { useEffect, useState } from "react"
import { Box, Card, Flex, Grid, Text, Badge } from "@radix-ui/themes"

interface StatusData {
  timestamp: string;
  minecraft: {
    status: string;
    name: string;
    tps: number;
    mspt: string;
    players: number;
    maxPlayers: number;
    version: string;
  };
  tf2: {
    status: string;
    name: string;
    players: number;
    maxPlayers: number;
  };
  muno: {
    status: string;
    name: string;
    version: string;
  };
  radio: {
    status: string;
    name: string;
    streamUrl: string;
  };
  services: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export function PublicTelemetryHUD() {
  const [data, setData] = useState<StatusData | null>(null);
  const [connected, setConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Carga inicial vía API REST
    fetch("/api/status/public")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {});

    // 2. Conexión en tiempo real SSE Stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/status/public/stream");

      eventSource.onopen = () => setConnected(true);

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
          setConnected(true);
        } catch {
          // ignore
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
      };
    } catch {
      setConnected(false);
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  // Evita el error de hidratación #418 de React al garantizar concordancia exacta SSR / Client initial render
  if (!mounted) {
    return (
      <Box className="w-full my-8 min-h-[220px]">
        <Card className="bg-[#080d1a]/80 backdrop-blur-md border border-[#ffffff15] p-5 rounded-xl">
          <Flex align="center" gap="3" className="mb-4 pb-3 border-b border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <Text size="2" className="font-mono tracking-[0.2em] text-white/60 uppercase font-bold">
              Telemetría de Sistema e Infraestructura en Vivo
            </Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="w-full my-8">
      <Card className="bg-[#080d1a]/80 backdrop-blur-md border border-[#ffffff15] p-5 rounded-xl shadow-[0_0_25px_rgba(0,0,0,0.5)]">
        {/* Header en Español con badge de Tiempo Real */}
        <Flex justify="between" align="center" className="mb-4 pb-3 border-b border-white/10">
          <Flex align="center" gap="3">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" : "bg-amber-500"}`} />
            <Text size="2" className="font-mono tracking-[0.2em] text-white/80 uppercase font-bold">
              Telemetría de Sistema e Infraestructura en Vivo
            </Text>
          </Flex>
          <Badge size="1" color={connected ? "green" : "amber"} variant="surface" className="font-mono text-[9px] px-2 py-0.5">
            {connected ? "TIEMPO REAL (STREAM)" : "CONECTANDO..."}
          </Badge>
        </Flex>

        {/* Tarjetas Principales sin emojis y en Español */}
        <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="4" className="mb-6">
          {/* TVCraft Minecraft */}
          <Card className="bg-[#040711] border border-emerald-500/30 p-3 rounded-lg hover:border-emerald-500/60 transition-all">
            <Flex direction="column" gap="1">
              <Flex justify="between" align="center">
                <Text size="1" className="font-mono text-emerald-400 font-bold uppercase text-[11px] tracking-wider">
                  TVCraft Minecraft
                </Text>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
              </Flex>
              <Text size="3" className="font-mono font-black text-white mt-1">
                {data ? `${data.minecraft.tps} TPS` : "20.0 TPS"}
              </Text>
              <Flex gap="2" align="center" className="mt-1">
                <Badge size="1" color="green" variant="soft" className="font-mono text-[9px]">
                  {data ? data.minecraft.mspt : "50ms"}
                </Badge>
                <Text size="1" className="font-mono text-white/60 text-[10px]">
                  {data ? `${data.minecraft.players} / ${data.minecraft.maxPlayers} jugadores` : "0 jugadores"}
                </Text>
              </Flex>
            </Flex>
          </Card>

          {/* TF2 Server */}
          <Card className="bg-[#040711] border border-white/10 p-3 rounded-lg hover:border-white/30 transition-all">
            <Flex direction="column" gap="1">
              <Flex justify="between" align="center">
                <Text size="1" className="font-mono text-amber-400 font-bold uppercase text-[11px] tracking-wider">
                  Servidor TF2
                </Text>
                <span className={`w-2 h-2 rounded-full ${data?.tf2.status === "online" ? "bg-emerald-500" : "bg-white/30"}`} />
              </Flex>
              <Text size="3" className="font-mono font-black text-white mt-1">
                {data?.tf2.status === "online" ? `${data.tf2.players} Activos` : "En Espera"}
              </Text>
              <Text size="1" className="font-mono text-white/50 text-[10px] mt-1">
                {data ? `${data.tf2.players} / ${data.tf2.maxPlayers} slots` : "0 / 24 slots"}
              </Text>
            </Flex>
          </Card>

          {/* MUNO Engine */}
          <Card className="bg-[#040711] border border-cyan-500/30 p-3 rounded-lg hover:border-cyan-500/60 transition-all">
            <Flex direction="column" gap="1">
              <Flex justify="between" align="center">
                <Text size="1" className="font-mono text-cyan-400 font-bold uppercase text-[11px] tracking-wider">
                  Motor MUNO!
                </Text>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              </Flex>
              <Text size="3" className="font-mono font-black text-white mt-1">
                Operativo
              </Text>
              <Text size="1" className="font-mono text-white/50 text-[10px] mt-1">
                {data ? data.muno.version : "v0.9.9.88"}
              </Text>
            </Flex>
          </Card>

          {/* TroubleMaker Radio */}
          <Card className="bg-[#040711] border border-yellow-500/30 p-3 rounded-lg hover:border-yellow-500/60 transition-all">
            <Flex direction="column" gap="1">
              <Flex justify="between" align="center">
                <Text size="1" className="font-mono text-yellow-400 font-bold uppercase text-[11px] tracking-wider">
                  Transmisión de Radio
                </Text>
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15] animate-pulse" />
              </Flex>
              <Text size="3" className="font-mono font-black text-white mt-1">
                EN VIVO 24/7
              </Text>
              <Text size="1" className="font-mono text-yellow-400/80 text-[10px] mt-1 underline cursor-pointer" onClick={() => window.open("https://radio.macrostasis.dev", "_blank")}>
                radio.macrostasis.dev ↗
              </Text>
            </Flex>
          </Card>
        </Grid>

        {/* Grid de Microservicios Core en Español */}
        <Box className="pt-4 border-t border-white/10">
          <Text size="1" className="font-mono text-[9px] tracking-[0.25em] text-white/40 uppercase mb-3 block">
            Red de Microservicios Core
          </Text>
          <Grid columns={{ initial: "2", sm: "3", md: "6" }} gap="2">
            {(data?.services || [
              { id: "kimeraware", name: "Motor Kimeraware", status: "operativo" },
              { id: "parhelion", name: "Suite Parhelion", status: "operativo" },
              { id: "riocazones", name: "IoT Río Cazones", status: "operativo" },
              { id: "dnd", name: "Motor D&D 2024", status: "operativo" },
              { id: "n8n", name: "Workflows n8n", status: "operativo" },
              { id: "minio", name: "Almacenamiento MinIO S3", status: "operativo" },
            ]).map((s) => (
              <Flex key={s.id} align="center" gap="2" className="bg-[#040711]/60 border border-white/5 px-2.5 py-1.5 rounded text-[10px] font-mono hover:border-white/15 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/90 flex-none" />
                <Flex direction="column" className="overflow-hidden">
                  <Text className="text-white/80 truncate text-[10px] leading-tight">{s.name}</Text>
                  <Text className="text-emerald-400/80 text-[8px] font-mono uppercase tracking-wider">{s.status}</Text>
                </Flex>
              </Flex>
            ))}
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
