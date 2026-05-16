# MacroStasis 2.0

Portfolio interactivo 3D — Carlos Eduardo Juarez Ricardo

## Stack

- **Next.js 15** — Static export
- **Three.js** — Escena 3D con modelo GLTF metálico
- **Tailwind CSS** — Estilos mínimos
- **Raleway** — Tipografía

## Escena

- Modelo 3D dorado con reflexiones de entorno y bloom
- Campo de estrellas parpadeantes (4000 desktop / 2000 mobile)
- Textos META / CODEX con shaders metálicos GPU
- Nombre y título con gradientes metálicos animados
- Layout responsivo: desktop horizontal, mobile vertical

### Desktop
```
  CARLOS EDUARDO JUAREZ RICARDO     MID-LEVEL FULL STACK ENGINEER | AI & AUTOMATION ARCHITECT
  META  ─── [ modelo 3D ] ─── CODEX
```

### Mobile (< 768px)
```
  M  CARLOS          C  MID LEVEL
  E  EDUARDO    ──   O  FULL STACK ENGINEER
  T  JUAREZ     ──   D  | AI & AUTOMATION
  A  RICARDO          E  ARCHITECT
                       X
```

## Deploy

- **Servidor:** troublemaker (Tailscale)
- **Web root:** `/var/www/macrostasis/` (nginx)
- **Dominio:** macrostasis.dev (Cloudflare Tunnel)

### Build
```bash
npm run build
rm -rf /var/www/macrostasis/* && cp -r out/* /var/www/macrostasis/
```

## Estructura
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── OriginalScene.tsx
public/
└── model.gltf
```
