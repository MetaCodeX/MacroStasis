/**
 * =============================================================================
 * MACROSTASIS PORTFOLIO - Main Component
 * =============================================================================
 * 
 * Componente principal del portfolio con animaciones parallax y navegación.
 * 
 * CARACTERÍSTICAS:
 * - Layout responsivo (desktop/mobile)
 * - Animación parallax al hacer scroll (0-400px)
 * - Logo centrado que crece y se posiciona durante el scroll
 * - Menú de navegación horizontal con gradientes únicos por botón
 * - Iconos de redes sociales en las esquinas
 * 
 * PARALLAX SCROLL (0 → 1):
 * - Textos META/CODEX se desvanecen y salen lateralmente
 * - Logo: scale 1→1.8, translateX +15px, translateY -10%
 * - Menú aparece con fade-in al 80% del scroll
 * 
 * @author Carlos Eduardo Juárez Ricardo
 * @version 2.0.0
 */

import {
  Component,
  HostListener,
  signal,
  computed,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, UpperCasePipe } from '@angular/common';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { ChessService } from './services/chess.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements AfterViewInit {
  /** Flag para verificar si estamos en el navegador (no SSR) */
  private isBrowser: boolean;

  /** DomSanitizer para URLs seguros en estilos */
  private sanitizer: DomSanitizer;

  /** Progreso del scroll (0 = arriba, 1 = 400px scroll) */
  private _progress = signal(0);

  /** Servicio de ajedrez para el tablero IDLE */
  readonly chessService: ChessService;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    sanitizer: DomSanitizer,
    chessService: ChessService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.sanitizer = sanitizer;
    this.chessService = chessService;
  }

  /**
   * Resetea el scroll a la posición inicial al cargar la página
   * Usa setTimeout para ejecutar después del render inicial
   * También precarga todos los assets y conecta WebSocket
   */
  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        window.scrollTo(0, 0);
        this._progress.set(0);
        // Precargar todos los assets en segundo plano
        this.preloadAllAssets();
        // Conectar WebSocket inmediatamente (para que el ajedrez juegue en background)
        this.chessService.connect();
      }, 0);
    }
  }

  /**
   * Precarga todos los assets SVG en el cache del navegador
   * Esto hace que las transiciones sean instantáneas después de la carga inicial
   */
  private preloadAllAssets(): void {
    const assets = [
      // Stack icons
      '/stack/dotnet.svg',
      '/stack/python.svg',
      '/stack/angular.svg',
      '/stack/react.svg',
      '/stack/postgresql.svg',
      '/stack/docker.svg',
      '/stack/fastapi.svg',
      '/stack/n8n.svg',
      '/stack/tailwindcss.svg',
      '/stack/vite.svg',
      '/stack/nginx.svg',
      '/stack/typescript.svg',
      '/stack/css3.svg',
      '/stack/nodedotjs.svg',
      '/stack/javascript.svg',
      // Social icons
      '/linkedin.svg',
      '/github.svg',
      '/instagram.svg',
      '/email.svg',
      '/web.svg',
      // Flags
      '/flag-mx.svg',
      '/flag-us.svg',
      // Logo
      '/path1.svg'
    ];

    // Usar requestIdleCallback para no bloquear el hilo principal
    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        assets.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      });
    } else {
      // Fallback para navegadores sin requestIdleCallback
      setTimeout(() => {
        assets.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      }, 100);
    }
  }

  // ============================================================================
  // COMPUTED VALUES - Usados en el template
  // ============================================================================

  /** Progreso del scroll expuesto al template */
  progress = computed(() => this._progress());

  /** Opacidad de los textos (se desvanecen antes de llegar al máximo scroll) */
  opacity = computed(() => Math.max(0, 1 - this._progress() * 1.5));

  /** Desplazamiento columna izquierda (sale por la izquierda) */
  leftX = computed(() => -150 * this._progress());

  /** Desplazamiento columna derecha (sale por la derecha) */
  rightX = computed(() => 150 * this._progress());

  /** Escala del logo desktop (crece de 1x a 1.8x - reducido) */
  logoScale = computed(() => 1 + (0.8 * this._progress()));

  /** Desplazamiento horizontal del logo para centrarse (compensa el desbalance META vs CODEX) */
  logoTranslateX = computed(() => 15 * this._progress());

  /** Desplazamiento vertical del logo (sube al hacer scroll para no estorbar botones) */
  logoTranslateY = computed(() => -10 * this._progress());

  /** Escala del logo móvil (crece de 1x a 5x para mayor impacto visual) */
  logoScaleMobile = computed(() => 1 + (4 * this._progress()));

  // ============================================================================
  // MENÚ RADIAL - Aparece cuando el logo está grande
  // ============================================================================

  /** El menú es visible cuando el scroll llega al 80% */
  menuVisible = computed(() => this._progress() >= 0.8);

  /** Opacidad del menú (fade-in de 0.8 a 1.0 del progress) */
  menuOpacity = computed(() => {
    const p = this._progress();
    if (p < 0.8) return 0;
    return (p - 0.8) / 0.2; // 0→1 en el rango 0.8→1.0
  });

  // ============================================================================
  // NAVEGACIÓN DE SECCIONES
  // ============================================================================

  /** Sección activa (portafolio, sobre-mi, stack, arquitectura, contacto) */
  activeSection = signal<string | null>(null);

  /** Flag para evitar clicks múltiples durante transición */
  isTransitioning = signal(false);

  /** Clase para animación de regreso */
  isReturning = signal(false);

  // ============================================================================
  // SISTEMA DE TRADUCCIÓN
  // ============================================================================

  /** Idioma actual: 'es' (español) o 'en' (inglés) */
  currentLang = signal<'es' | 'en'>('es');

  /** Diccionario de traducciones */
  readonly translations: Record<string, { es: string; en: string }> = {
    // Menú de navegación
    'nav.portfolio': { es: 'Portafolio', en: 'Portfolio' },
    'nav.about': { es: 'Sobre Mi', en: 'About Me' },
    'nav.stack': { es: 'Mi Stack', en: 'My Stack' },
    'nav.architecture': { es: 'Arquitectura', en: 'Architecture' },
    'nav.contact': { es: 'Contacto', en: 'Contact' },
    'nav.stack.short': { es: 'Stack', en: 'Stack' },
    'nav.architecture.short': { es: 'Arq.', en: 'Arch.' },
    // Encabezados de sección
    'section.portfolio': { es: 'Portafolio', en: 'Portfolio' },
    'section.about': { es: 'Sobre Mi', en: 'About Me' },
    'section.stack': { es: 'Mi Stack', en: 'My Stack' },
    'section.architecture': { es: 'Arquitectura', en: 'Architecture' },
    'section.contact': { es: 'Contacto', en: 'Contact' },
    // Portfolio
    'btn.github': { es: 'GitHub', en: 'GitHub' },
    'btn.website': { es: 'Sitio Web', en: 'Website' },
    // Proyectos - Parhelion
    'project.parhelion.subtitle': {
      es: 'Plataforma Unificada de Logística B2B (WMS + TMS) nivel Enterprise',
      en: 'Unified B2B Logistics Platform (WMS + TMS) Enterprise Level'
    },
    'project.parhelion.desc': {
      es: `Sistema SaaS multi-tenant para empresas de transporte B2B con gestión integral de operaciones logísticas.

• Gestión de flotas tipificadas: DryBox, Refrigerado, HAZMAT, Blindado
• Redes de distribución Hub & Spoke con trazabilidad por checkpoints
• Documentación legal mexicana: Carta Porte, POD con firma digital
• 10 módulos de análisis predictivo: ETA, demanda, optimización de rutas
• Automatización con agentes de IA para crisis management
• Apps móviles PWA para choferes y almacenistas`,
      en: `Multi-tenant SaaS system for B2B transportation companies with comprehensive logistics operations management.

• Typed fleet management: DryBox, Refrigerated, HAZMAT, Armored
• Hub & Spoke distribution networks with checkpoint tracking
• Mexican legal documentation: Carta Porte, POD with digital signature
• 10 predictive analytics modules: ETA, demand, route optimization
• Automation with AI agents for crisis management
• Mobile PWA apps for drivers and warehouse staff`
    },
    // Proyectos - MacroStasis
    'project.macrostasis.subtitle': {
      es: 'Portfolio Interactivo con Estética Minimalista',
      en: 'Interactive Portfolio with Minimalist Aesthetics'
    },
    'project.macrostasis.desc': {
      es: `Portafolio profesional con arquitectura Frontend moderna y diseño premium.

• Angular 18 Standalone Components con Signals para reactividad
• Animaciones CSS avanzadas: parallax, sistema solar orbital, gradientes aurora
• Optimización de rendimiento: GPU acceleration, OnPush strategy
• Backend futuro: Python/Node.js para webhooks y analytics
• Diseño responsivo con estética Into the Dream (Minimalismo)`,
      en: `Professional portfolio with modern Frontend architecture and premium design.

• Angular 18 Standalone Components with Signals for reactivity
• Advanced CSS animations: parallax, orbital solar system, aurora gradients
• Performance optimization: GPU acceleration, OnPush strategy
• Future backend: Python/Node.js for webhooks and analytics
• Responsive design with Into the Dream aesthetics (Minimalism)`
    },
    // Proyectos - Varios
    'project.misc.subtitle': {
      es: 'Colección de Experimentos y Herramientas',
      en: 'Collection of Experiments and Tools'
    },
    'project.misc.desc': {
      es: 'Proyectos experimentales: automatizaciones, scripts de desarrollo, exploraciones en IA generativa y herramientas de productividad.',
      en: 'Experimental projects: automations, development scripts, explorations in generative AI and productivity tools.'
    },
    // ========== ABOUT ME ==========
    'about.greeting': {
      es: '¡Hola! Soy',
      en: "Hi! I'm"
    },
    'about.profile': {
      es: `Ingeniero de Software innovador con sólida base Full Stack, evolucionando hacia arquitecturas de IA Agéntica. Me especializo en construir la infraestructura backend (.NET 8/Python) que impulsa agentes autónomos, transformando lógica de negocio manual en workflows auto-reparables usando herramientas como n8n y LangGraph.`,
      en: `Innovative Software Engineer with a strong Full Stack foundation, evolving into Agentic AI architectures. I specialize in building the backend infrastructure (.NET 8/Python) that powers autonomous agents, transforming manual business logic into self-healing workflows using tools like n8n and LangGraph.`
    },
    'about.personal': {
      es: '22 años • Veracruz, México • Universidad Veracruzana (ITC)',
      en: '22 years old • Veracruz, Mexico • Veracruzana University (IT)'
    },
    'about.languages': {
      es: 'Idiomas: Español (nativo) • Inglés (intermedio técnico)',
      en: 'Languages: Spanish (native) • English (technical intermediate)'
    },
    'about.expertise.title': {
      es: 'Experiencia Técnica',
      en: 'Technical Expertise'
    },
    'about.expertise.list': {
      es: `• IA Agéntica: Workflows autónomos con n8n, LangGraph y Webhooks. Integración de LLMs (Gemini/Claude) en sistemas auto-reparables.
• Backend: Arquitecturas limpias en .NET 8 (C#), Python y FastAPI. APIs RESTful seguras con JWT/API Keys.
• Bases de Datos: Diseño avanzado en PostgreSQL, MySQL y SQL Server. EF Core migrations.
• DevOps: Servidores Linux (Ubuntu), Docker, Cloudflare (DNS/Tunnels), pipelines CI/CD.
• Frontend: Interfaces modernas con Angular, React Native (móvil) y Tailwind CSS.`,
      en: `• Agentic AI: Autonomous workflows with n8n, LangGraph and Webhooks. LLM integration (Gemini/Claude) for self-healing systems.
• Backend: Clean Architecture with .NET 8 (C#), Python and FastAPI. Secure REST APIs with JWT/API Keys.
• Databases: Advanced design in PostgreSQL, MySQL and SQL Server. EF Core migrations.
• DevOps: Linux servers (Ubuntu), Docker, Cloudflare (DNS/Tunnels), CI/CD pipelines.
• Frontend: Modern interfaces with Angular, React Native (mobile) and Tailwind CSS.`
    },
    'about.experience.title': {
      es: 'Experiencia Profesional',
      en: 'Professional Experience'
    },
    'about.experience.list': {
      es: `• Lead Architect @ Parhelion Logistics (2025-Presente)
  Sistema de crisis management con n8n y lógica Haversine geoespacial. API .NET 8 con atributos personalizados para comunicación AI-to-Database.

• Full Stack Developer @ Microfinanciera Inpulso (2025)
  Plataforma administrativa con Node.js/PHP. Optimización de queries reduciendo tiempo de reportes 40%.

• IT Specialist & Automation (2019-2024)
  Soluciones de infraestructura para clientes bancarios (HSBC/BBVA). Automatización con Python ahorrando 10+ horas semanales.`,
      en: `• Lead Architect @ Parhelion Logistics (2025-Present)
  Crisis management system with n8n and Haversine geospatial logic. .NET 8 API with custom attributes for AI-to-Database communication.

• Full Stack Developer @ Microfinanciera Inpulso (2025)
  Admin platform with Node.js/PHP. Query optimization reducing report time by 40%.

• IT Specialist & Automation (2019-2024)
  Infrastructure solutions for banking clients (HSBC/BBVA). Python automation saving 10+ hours weekly.`
    },
    'about.achievement': {
      es: '🏆 Ganador CTF Ubisoft Captain Laserhawk (2024) - Premio 1 ETH',
      en: '🏆 Winner CTF Ubisoft Captain Laserhawk (2024) - 1 ETH Prize'
    },
    'about.philosophy': {
      es: 'Mi filosofía: código limpio, documentación clara y soluciones que escalan.',
      en: 'My philosophy: clean code, clear documentation and solutions that scale.'
    }
  };

  /** Obtiene un texto traducido */
  t(key: string): string {
    const entry = this.translations[key];
    if (!entry) return key;
    return entry[this.currentLang()];
  }

  /** Cambia el idioma */
  toggleLanguage(): void {
    this.currentLang.set(this.currentLang() === 'es' ? 'en' : 'es');
  }

  // ============================================================================
  // CARRUSEL ORBITAL - Proyectos del Portafolio
  // ============================================================================

  /** Proyecto actualmente visible */
  activeProject = signal(0);

  /** Posiciones aleatorias de los planetas en sus órbitas (en segundos de animation-delay) */
  orbitOffsets = signal<number[]>([0, 0, 0, 0, 0, 0]);

  /** Genera nuevas posiciones aleatorias para los planetas */
  private randomizeOrbitPositions(): void {
    this.orbitOffsets.set([
      Math.random() * 12,  // órbita 1: 0-12s (duración total 12s)
      Math.random() * 20,  // órbita 2: 0-20s
      Math.random() * 32,  // órbita 3: 0-32s
      Math.random() * 48,  // órbita 4: 0-48s
      Math.random() * 60,  // órbita 5: 0-60s
      Math.random() * 75   // órbita 6: 0-75s
    ]);
  }

  /** Lista de proyectos con claves de traducción */
  readonly projects = [
    {
      id: 1,
      title: 'Parhelion Logistics',
      i18nSubtitle: 'project.parhelion.subtitle',
      i18nDesc: 'project.parhelion.desc',
      stack: ['dotnet', 'python', 'angular', 'react', 'postgresql', 'docker', 'fastapi', 'n8n', 'tailwindcss', 'vite', 'nginx'],
      github: 'https://github.com/MetaCodeX/Parhelion-Logistics/tree/develop',
      website: 'https://parhelion.macrostasis.lat/',
      color: '#ee7752'
    },
    {
      id: 2,
      title: 'MacroStasis Portfolio',
      i18nSubtitle: 'project.macrostasis.subtitle',
      i18nDesc: 'project.macrostasis.desc',
      stack: ['angular', 'typescript', 'css3', 'python', 'nodedotjs', 'docker', 'websocket'],
      github: 'https://github.com/MetaCodeX/MacroStasis',
      website: 'https://macrostasis.lat/',
      color: '#23a6d5'
    },
    {
      id: 3,
      title: 'Proyectos Varios',
      i18nSubtitle: 'project.misc.subtitle',
      i18nDesc: 'project.misc.desc',
      stack: ['python', 'javascript', 'docker'],
      github: '',
      website: '',
      color: '#23d5ab'
    }
  ];

  /** Nombres legibles de las tecnologías para tooltips */
  readonly stackLabels: Record<string, string> = {
    'angular': 'Angular 18',
    'dotnet': '.NET 8',
    'python': 'Python 3',
    'typescript': 'TypeScript',
    'postgresql': 'PostgreSQL',
    'docker': 'Docker',
    'react': 'React',
    'fastapi': 'FastAPI',
    'n8n': 'n8n',
    'tailwindcss': 'Tailwind CSS',
    'vite': 'Vite',
    'nginx': 'Nginx',
    'nodedotjs': 'Node.js',
    'git': 'Git',
    'java': 'Java',
    'mysql': 'MySQL',
    'linux': 'Linux',
    'cloudflare': 'Cloudflare',
    'githubactions': 'GitHub Actions',
    'sqlserver': 'SQL Server',
    'csharp': 'C#',
    'php': 'PHP',
    'html5': 'HTML5',
    'css3': 'CSS3',
    'javascript': 'JavaScript',
    'anthropic': 'Claude API',
    'digitalocean': 'DigitalOcean',
    'aws': 'AWS',
    'azure': 'Azure',
    'websocket': 'WebSocket'
  };

  /** Estadísticas de cada stack con metadata completa */
  readonly stackStats: Record<string, {
    skill: number;
    years: number;
    category: string;
    usage: 'active' | 'recent' | 'occasional';
    cert: string | null;
    favorite: boolean;
  }> = {
      'angular': { skill: 40, years: 1, category: 'Frontend', usage: 'active', cert: null, favorite: true },
      'dotnet': { skill: 50, years: 3, category: 'Backend', usage: 'active', cert: null, favorite: true },
      'python': { skill: 60, years: 4, category: 'Backend', usage: 'active', cert: null, favorite: true },
      'typescript': { skill: 80, years: 6, category: 'Frontend', usage: 'active', cert: null, favorite: true },
      'postgresql': { skill: 80, years: 5, category: 'Database', usage: 'active', cert: null, favorite: true },
      'docker': { skill: 90, years: 3, category: 'DevOps', usage: 'active', cert: null, favorite: true },
      'react': { skill: 65, years: 2, category: 'Frontend', usage: 'occasional', cert: null, favorite: false },
      'fastapi': { skill: 70, years: 3, category: 'Backend', usage: 'recent', cert: null, favorite: false },
      'n8n': { skill: 40, years: 1, category: 'Automation', usage: 'recent', cert: null, favorite: false },
      'tailwindcss': { skill: 80, years: 2, category: 'Frontend', usage: 'recent', cert: null, favorite: false },
      'vite': { skill: 70, years: 2, category: 'Frontend', usage: 'recent', cert: null, favorite: false },
      'nginx': { skill: 90, years: 3, category: 'DevOps', usage: 'active', cert: null, favorite: false },
      'nodedotjs': { skill: 70, years: 2, category: 'Backend', usage: 'recent', cert: null, favorite: false },
      'git': { skill: 90, years: 5, category: 'DevOps', usage: 'active', cert: null, favorite: true },
      'java': { skill: 70, years: 2, category: 'Backend', usage: 'occasional', cert: null, favorite: false },
      'mysql': { skill: 80, years: 5, category: 'Database', usage: 'active', cert: null, favorite: false },
      'linux': { skill: 75, years: 4, category: 'DevOps', usage: 'active', cert: null, favorite: true },
      'cloudflare': { skill: 80, years: 3, category: 'Cloud', usage: 'active', cert: null, favorite: false },
      'githubactions': { skill: 60, years: 1, category: 'DevOps', usage: 'recent', cert: null, favorite: false },
      'sqlserver': { skill: 60, years: 2, category: 'Database', usage: 'occasional', cert: null, favorite: false },
      'csharp': { skill: 70, years: 2, category: 'Backend', usage: 'active', cert: null, favorite: false },
      'php': { skill: 70, years: 4, category: 'Backend', usage: 'occasional', cert: null, favorite: false },
      'html5': { skill: 80, years: 6, category: 'Frontend', usage: 'active', cert: null, favorite: false },
      'css3': { skill: 75, years: 6, category: 'Frontend', usage: 'active', cert: null, favorite: false },
      'javascript': { skill: 80, years: 6, category: 'Frontend', usage: 'active', cert: null, favorite: false },
      'anthropic': { skill: 70, years: 2, category: 'AI', usage: 'active', cert: null, favorite: true },
      'digitalocean': { skill: 80, years: 2, category: 'Cloud', usage: 'active', cert: null, favorite: false },
      'aws': { skill: 60, years: 3, category: 'Cloud', usage: 'occasional', cert: null, favorite: false },
      'azure': { skill: 60, years: 3, category: 'Cloud', usage: 'occasional', cert: null, favorite: false },
      'websocket': { skill: 30, years: 1, category: 'Backend', usage: 'active', cert: null, favorite: false }
    };

  /** Obtiene el nivel textual basado en el porcentaje */
  getSkillLevel(skill: number): string {
    if (skill >= 86) return this.currentLang() === 'es' ? 'Experto' : 'Expert';
    if (skill >= 71) return this.currentLang() === 'es' ? 'Avanzado' : 'Advanced';
    if (skill >= 51) return this.currentLang() === 'es' ? 'Intermedio' : 'Intermediate';
    return this.currentLang() === 'es' ? 'Básico' : 'Basic';
  }

  /** Traduce el uso a español/inglés */
  getUsageLabel(usage: string): string {
    const labels: Record<string, { es: string; en: string }> = {
      'active': { es: 'Activo', en: 'Active' },
      'recent': { es: 'Reciente', en: 'Recent' },
      'occasional': { es: 'Ocasional', en: 'Occasional' }
    };
    return this.currentLang() === 'es' ? labels[usage]?.es : labels[usage]?.en;
  }

  /** Lista de todos los stacks para la sección Mi Stack */
  readonly allStacks = [
    'angular', 'dotnet', 'python', 'typescript', 'postgresql', 'docker',
    'react', 'fastapi', 'n8n', 'tailwindcss', 'vite', 'nginx',
    'nodedotjs', 'git', 'java', 'mysql', 'linux', 'cloudflare',
    'githubactions', 'sqlserver', 'csharp', 'php', 'html5', 'css3',
    'javascript', 'anthropic', 'digitalocean', 'aws', 'azure', 'websocket'
  ];

  /** Stack activo para la animación principal */
  activeStack = signal(0);

  /** Progreso del timer (0-100) */
  stackProgress = signal(0);

  /** Animación de transición activa */
  stackTransitioning = signal(false);

  /** Intervalo de rotación de stacks */
  private stackInterval: ReturnType<typeof setInterval> | null = null;

  /** Intervalo del timer de progreso */
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  /** Duración de cada stack en ms */
  private readonly STACK_DURATION = 5000;

  /** Inicia la rotación automática de stacks */
  startStackRotation(): void {
    if (this.stackInterval) return;
    this.stackProgress.set(0);

    // Timer de progreso (actualiza cada 60ms para animación suave)
    this.progressInterval = setInterval(() => {
      const current = this.stackProgress();
      if (current >= 100) {
        this.nextStack();
        this.stackProgress.set(0);
      } else {
        this.stackProgress.update(p => p + (100 / (this.STACK_DURATION / 60)));
      }
    }, 60);
  }

  /** Detiene la rotación automática de stacks */
  stopStackRotation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.stackInterval) {
      clearInterval(this.stackInterval);
      this.stackInterval = null;
    }
  }

  /** Navegar al stack anterior */
  prevStack(): void {
    this.stackTransitioning.set(true);
    setTimeout(() => {
      this.activeStack.update(i => i === 0 ? this.allStacks.length - 1 : i - 1);
      this.stackProgress.set(0);
      this.stackTransitioning.set(false);
    }, 200);
  }

  /** Navegar al siguiente stack */
  nextStack(): void {
    this.stackTransitioning.set(true);
    setTimeout(() => {
      this.activeStack.update(i => (i + 1) % this.allStacks.length);
      this.stackProgress.set(0);
      this.stackTransitioning.set(false);
    }, 200);
  }

  // ========== ARQUITECTURA - TERMINAL ANIMADA ==========

  /** Paso actual del flujo de arquitectura (1-5) */
  archStep = signal(1);

  /** Tipo de proyecto actual */
  archProjectType = signal<'angular' | 'dotnet' | 'python'>('angular');

  /** Comandos por paso según tipo de proyecto */
  readonly archCommands: Record<string, Record<number, string[]>> = {
    'angular': {
      1: ['mkdir proyecto-angular && cd proyecto-angular', 'ng new app --routing --style=scss'],
      2: ['git init', 'git add .', 'git commit -m "Initial commit"'],
      3: ['docker build -t angular-app .', 'docker run -d -p 4200:80 angular-app'],
      4: ['npm run build --prod', 'npm run test:ci'],
      5: ['git push origin main', 'cloudflare pages deploy ./dist']
    },
    'dotnet': {
      1: ['mkdir proyecto-dotnet && cd proyecto-dotnet', 'dotnet new webapi -n API'],
      2: ['git init', 'git add .', 'git commit -m "Initial commit"'],
      3: ['docker build -t dotnet-api .', 'docker-compose up -d'],
      4: ['dotnet build --configuration Release', 'dotnet test'],
      5: ['git push origin main', 'az webapp deploy --src-path ./publish']
    },
    'python': {
      1: ['mkdir proyecto-python && cd proyecto-python', 'python -m venv venv && pip install fastapi'],
      2: ['git init', 'git add .', 'git commit -m "Initial commit"'],
      3: ['docker build -t fastapi-app .', 'docker run -d -p 8000:8000 fastapi-app'],
      4: ['pytest --cov=app tests/', 'black . && flake8 .'],
      5: ['git push origin main', 'fly deploy --app fastapi-prod']
    }
  };

  /** Intervalo de arquitectura */
  private archInterval: ReturnType<typeof setInterval> | null = null;

  /** Inicia la animación de arquitectura */
  startArchAnimation(): void {
    if (this.archInterval) return;

    // Tipo aleatorio
    const types: ('angular' | 'dotnet' | 'python')[] = ['angular', 'dotnet', 'python'];
    this.archProjectType.set(types[Math.floor(Math.random() * types.length)]);
    this.archStep.set(1);

    // Cambiar paso cada 3 segundos
    this.archInterval = setInterval(() => {
      const current = this.archStep();
      if (current >= 5) {
        // Reiniciar con nuevo tipo
        this.archProjectType.set(types[Math.floor(Math.random() * types.length)]);
        this.archStep.set(1);
      } else {
        this.archStep.update(s => s + 1);
      }
    }, 3000);
  }

  /** Detiene la animación de arquitectura */
  stopArchAnimation(): void {
    if (this.archInterval) {
      clearInterval(this.archInterval);
      this.archInterval = null;
    }
  }

  /** Obtiene los comandos actuales para mostrar en terminal */
  getCurrentCommands(): string[] {
    const type = this.archProjectType();
    const step = this.archStep();
    return this.archCommands[type]?.[step] || [];
  }

  /** Obtiene un SafeStyle para mask-image con la URL del SVG */
  getMaskUrl(stack: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`url(/stack/${stack}.svg)`);
  }

  /** Signal para controlar la animación de transición */
  isAnimating = signal(false);

  /** Navegar al proyecto anterior con animación */
  onProjectPrev(): void {
    this.triggerProjectAnimation();
    const current = this.activeProject();
    const prev = current === 0 ? this.projects.length - 1 : current - 1;
    this.activeProject.set(prev);
  }

  /** Navegar al siguiente proyecto con animación */
  onProjectNext(): void {
    this.triggerProjectAnimation();
    const current = this.activeProject();
    const next = (current + 1) % this.projects.length;
    this.activeProject.set(next);
  }

  /** Dispara la animación de transición del proyecto */
  private triggerProjectAnimation(): void {
    this.isAnimating.set(false);
    // Forzar reflow para reiniciar la animación
    requestAnimationFrame(() => {
      this.isAnimating.set(true);
      setTimeout(() => this.isAnimating.set(false), 450);
    });
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Detecta el scroll y actualiza el progreso
   * Solo se ejecuta en el navegador (no en SSR)
   */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    const scrollY = window?.scrollY ?? 0;
    const maxScroll = 400; // Píxeles de scroll para completar la animación
    const progress = Math.min(scrollY / maxScroll, 1);

    this._progress.set(progress);
  }

  /**
   * Handler para click en botones de navegación
   * Inicia la transición hacia una sección específica
   */
  onNavClick(section: string, event: Event): void {
    event.preventDefault();
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);

    // Generar posiciones aleatorias si es el portafolio
    if (section === 'portafolio') {
      this.randomizeOrbitPositions();
    }

    // Conectar al backend de ajedrez si es contacto
    if (section === 'contacto' && this.isBrowser) {
      this.chessService.isVisible.set(true);
    }

    // Pequeño delay antes de activar la sección
    setTimeout(() => {
      this.activeSection.set(section);
      this.isTransitioning.set(false);

      // Bloquear scroll cuando se entra a una sección
      if (this.isBrowser) {
        document.body.style.overflow = 'hidden';
      }
    }, 300);
  }

  /**
   * Handler para botón de regreso al menú principal
   * Ejecuta animación inversa rápida y fluida
   */
  onBackClick(): void {
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);
    this.isReturning.set(true);

    // Delay optimizado para animación de salida rápida (sincronizado con CSS 0.4s)
    setTimeout(() => {
      this.activeSection.set(null);
      this.isReturning.set(false);
      this.isTransitioning.set(false);

      // Restaurar scroll al volver al menú
      if (this.isBrowser) {
        document.body.style.overflow = '';
      }

      // Marcar sección de ajedrez como no visible
      this.chessService.isVisible.set(false);
    }, 500);
  }

  /**
   * Verifica si una casilla es el origen de la animación actual
   */
  isAnimatingFrom(rank: number, file: number): boolean {
    const anim = this.chessService.currentAnimation();
    if (!anim) return false;
    return anim.from.rank === rank && anim.from.file === file;
  }

  /**
   * Verifica si una casilla es el destino de la animación actual
   */
  isAnimatingTo(rank: number, file: number): boolean {
    const anim = this.chessService.currentAnimation();
    if (!anim) return false;
    return anim.to.rank === rank && anim.to.file === file;
  }
}
