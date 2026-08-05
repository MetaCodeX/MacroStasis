"use client"

import { useState } from "react"
import { Box, Card, Flex, Heading, Text, TextField, Button, IconButton } from "@radix-ui/themes"

// SHA-256 de H4NZC0D3X1521.a
const AUTH_HASH = "000970b0aa4d5881168ac2e5e5584fee6b1041a1d3637065d2dc7fbd96abb0f0";

async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function GrafanaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputHash = await sha256(password);
    if (inputHash === AUTH_HASH) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[85vh] bg-[#040711] border border-white/20 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <Flex justify="between" align="center" className="px-6 py-4 bg-[#080d1a] border-b border-white/10 flex-none">
          <Flex align="center" gap="3">
            <span className={`w-3 h-3 rounded-full ${authenticated ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-red-500"}`} />
            <Heading size="3" className="font-mono tracking-wider text-white uppercase font-bold">
              Grafana Observability Portal · Privado
            </Heading>
          </Flex>
          <IconButton variant="ghost" color="gray" onClick={onClose} className="cursor-pointer hover:bg-white/10 rounded-full">
            ✕
          </IconButton>
        </Flex>

        {/* Content */}
        {!authenticated ? (
          <Flex direction="column" align="center" justify="center" className="flex-1 p-6">
            <Card className="w-full max-w-md bg-[#080d1a]/90 border border-white/15 p-8 rounded-xl shadow-2xl">
              <Heading size="4" className="font-mono text-center text-white mb-2 uppercase tracking-widest">
                Acceso Restringido
              </Heading>
              <Text size="2" className="font-mono text-center text-white/50 mb-6 block">
                Introduce la clave de acceso del sistema para desbloquear Grafana.
              </Text>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Box>
                  <TextField.Root
                    type="password"
                    placeholder="Clave de Acceso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono bg-black/50 border-white/20 text-white"
                  />
                  {error && (
                    <Text color="red" size="1" className="font-mono mt-2 block">
                      Clave incorrecta. Acceso denegado.
                    </Text>
                  )}
                </Box>
                <Button type="submit" variant="solid" color="amber" className="font-mono uppercase tracking-widest cursor-pointer font-bold py-2">
                  Desbloquear Grafana
                </Button>
              </form>
            </Card>
          </Flex>
        ) : (
          <iframe
            src="https://grafana.macrostasis.dev"
            className="w-full h-full border-none"
            title="Grafana Observability"
          />
        )}
      </div>
    </div>
  );
}
