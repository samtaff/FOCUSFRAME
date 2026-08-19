import { SampleImage } from './types';

export const GRADIENT_PRESETS = [
  // Verts Studio
  { name: 'Vert Émeraude Studio', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { name: 'Vert Menthe & Forêt', value: 'linear-gradient(135deg, #34d399 0%, #059669 50%, #064e3b 100%)' },
  { name: 'Vert Forêt Profond', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
  { name: 'Vert Lime Vif', value: 'linear-gradient(135deg, #84cc16 0%, #10b981 100%)' },
  { name: 'Vert Jade & Sauge', value: 'linear-gradient(135deg, #6ee7b7 0%, #047857 100%)' },
  { name: 'Vert Néon Cyber', value: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  // Blancs Studio
  { name: 'Blanc Pur Studio', value: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' },
  { name: 'Blanc Perle & Soie', value: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)' },
  { name: 'Blanc Minimaliste', value: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)' },
  { name: 'Blanc Givré & Nuage', value: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' },
  { name: 'Blanc Argenté', value: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)' },
  { name: 'Blanc Cassé Chaud', value: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)' },
];

export const SOLID_PRESETS = [
  '#ffffff',
  '#f8fafc',
  '#f1f5f9',
  '#e2e8f0',
  '#10b981',
  '#059669',
  '#047857',
  '#064e3b',
  '#022c22',
  '#22c55e',
  '#84cc16',
  '#14532d',
];

// Helper to generate crisp SVG sample screenshots so users have real visuals instantly
function createSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Analytics',
    description: 'Graphique de ventes et KPI',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" fill="none">
        <rect width="480" height="340" fill="#0f172a" rx="8"/>
        <!-- Header -->
        <rect x="20" y="20" width="120" height="16" rx="4" fill="#38bdf8"/>
        <rect x="360" y="20" width="100" height="24" rx="6" fill="#334155"/>
        <circle cx="440" cy="32" r="6" fill="#10b981"/>
        
        <!-- Metric Cards -->
        <rect x="20" y="56" width="136" height="64" rx="8" fill="#1e293b"/>
        <text x="32" y="76" fill="#94a3b8" font-family="sans-serif" font-size="11">Revenus Mensuels</text>
        <text x="32" y="104" fill="#f8fafc" font-family="sans-serif" font-weight="bold" font-size="18">€24,850.00</text>

        <rect x="172" y="56" width="136" height="64" rx="8" fill="#1e293b"/>
        <text x="184" y="76" fill="#94a3b8" font-family="sans-serif" font-size="11">Nouveaux Clients</text>
        <text x="184" y="104" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="18">+1,248</text>

        <rect x="324" y="56" width="136" height="64" rx="8" fill="#1e293b"/>
        <text x="336" y="76" fill="#94a3b8" font-family="sans-serif" font-size="11">Taux de Rétention</text>
        <text x="336" y="104" fill="#10b981" font-family="sans-serif" font-weight="bold" font-size="18">98.4%</text>

        <!-- Chart Container -->
        <rect x="20" y="132" width="440" height="188" rx="8" fill="#1e293b"/>
        <text x="36" y="156" fill="#f8fafc" font-family="sans-serif" font-weight="600" font-size="13">Évolution de la Performance</text>
        
        <!-- Grid lines -->
        <line x1="36" y1="180" x2="444" y2="180" stroke="#334155" stroke-dasharray="3 3"/>
        <line x1="36" y1="220" x2="444" y2="220" stroke="#334155" stroke-dasharray="3 3"/>
        <line x1="36" y1="260" x2="444" y2="260" stroke="#334155" stroke-dasharray="3 3"/>
        <line x1="36" y1="290" x2="444" y2="290" stroke="#475569"/>

        <!-- Sparkline Curve -->
        <path d="M 40 260 Q 90 220 140 240 T 240 190 T 340 160 T 440 145" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="340" cy="160" r="5" fill="#38bdf8"/>
        <circle cx="440" cy="145" r="5" fill="#0ea5e9"/>
      </svg>
    `)
  },
  {
    id: 'code-editor',
    name: 'Code Snippet',
    description: 'Extrait de code TypeScript moderne',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" fill="none">
        <rect width="480" height="340" fill="#18181b" rx="8"/>
        <!-- Window Bar -->
        <rect width="480" height="36" fill="#27272a" rx="8"/>
        <circle cx="20" cy="18" r="5" fill="#ef4444"/>
        <circle cx="36" cy="18" r="5" fill="#eab308"/>
        <circle cx="52" cy="18" r="5" fill="#22c55e"/>
        <text x="240" y="22" fill="#a1a1aa" font-family="sans-serif" font-size="11" text-anchor="middle">highlight-focus.ts</text>
        
        <!-- Code Content -->
        <text x="24" y="68" fill="#60a5fa" font-family="monospace" font-size="13">export async function <tspan fill="#facc15">renderFocusBox</tspan>() {</text>
        <text x="44" y="96" fill="#a1a1aa" font-family="monospace" font-size="13">const <tspan fill="#e879f9">focusArea</tspan> = document.<tspan fill="#38bdf8">querySelector</tspan>(<tspan fill="#4ade80">'#focus'</tspan>);</text>
        <text x="44" y="124" fill="#a1a1aa" font-family="monospace" font-size="13">if (!focusArea) <tspan fill="#f43f5e">return null</tspan>;</text>
        
        <text x="44" y="160" fill="#34d399" font-family="monospace" font-size="13">// Conserve 100% d'opacité dans la zone</text>
        <text x="44" y="188" fill="#a1a1aa" font-family="monospace" font-size="13">focusArea.<tspan fill="#93c5fd">style</tspan>.<tspan fill="#93c5fd">opacity</tspan> = <tspan fill="#fb923c">'1.0'</tspan>;</text>
        <text x="44" y="216" fill="#a1a1aa" font-family="monospace" font-size="13">const <tspan fill="#e879f9">result</tspan> = await <tspan fill="#38bdf8">exportToPng</tspan>({ quality: <tspan fill="#fb923c">1.0</tspan> });</text>
        
        <text x="44" y="252" fill="#a1a1aa" font-family="monospace" font-size="13"><tspan fill="#f43f5e">return</tspan> result;</text>
        <text x="24" y="280" fill="#60a5fa" font-family="monospace" font-size="13">}</text>
      </svg>
    `)
  },
  {
    id: 'mobile-app',
    name: 'Interface Mobile',
    description: 'Écran de confirmation de paiement',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="480" height="340" viewBox="0 0 480 340" fill="none">
        <rect width="480" height="340" fill="#f8fafc" rx="8"/>
        <!-- App Header -->
        <rect width="480" height="52" fill="#4f46e5" rx="8"/>
        <text x="24" y="32" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">Paiement Réussi 🎉</text>

        <!-- Success Badge -->
        <circle cx="240" cy="110" r="36" fill="#ecfdf5"/>
        <circle cx="240" cy="110" r="28" fill="#10b981"/>
        <path d="M 230 110 L 237 117 L 252 102" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Details Card -->
        <rect x="40" y="160" width="400" height="110" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
        <text x="60" y="190" fill="#64748b" font-family="sans-serif" font-size="12">Destinataire</text>
        <text x="420" y="190" fill="#0f172a" font-family="sans-serif" font-weight="600" font-size="12" text-anchor="end">Studio Creatif SAS</text>
        
        <line x1="60" y1="205" x2="420" y2="205" stroke="#f1f5f9"/>

        <text x="60" y="225" fill="#64748b" font-family="sans-serif" font-size="12">Montant total</text>
        <text x="420" y="225" fill="#4f46e5" font-family="sans-serif" font-weight="bold" font-size="15" text-anchor="end">€ 149.00 EUR</text>

        <rect x="40" y="285" width="400" height="36" rx="6" fill="#4f46e5"/>
        <text x="240" y="308" fill="#ffffff" font-family="sans-serif" font-weight="600" font-size="13" text-anchor="middle">Télécharger le reçu</text>
      </svg>
    `)
  }
];
