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
    id: 'dropzone',
    name: 'Déposer votre fichier',
    description: 'Zone de dépôt initiale (204 × 490 px)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" width="204" height="490" viewBox="0 0 204 490" fill="none">
        <rect width="204" height="490" fill="#0b0f19" rx="14"/>
        
        <!-- Smartphone Status Bar -->
        <text x="22" y="24" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="600">09:41</text>
        <rect x="77" y="12" width="50" height="13" rx="6.5" fill="#020617"/>
        
        <!-- Status Icons (Signal & Battery) -->
        <rect x="156" y="19" width="2.5" height="5" rx="0.5" fill="#94a3b8"/>
        <rect x="160" y="17" width="2.5" height="7" rx="0.5" fill="#94a3b8"/>
        <rect x="164" y="15" width="2.5" height="9" rx="0.5" fill="#94a3b8"/>
        <rect x="172" y="16" width="16" height="8" rx="2" stroke="#94a3b8" stroke-width="1" fill="none"/>
        <rect x="174" y="18" width="11" height="4" rx="1" fill="#10b981"/>
        <rect x="188" y="18.5" width="1.5" height="3" rx="0.5" fill="#94a3b8"/>

        <!-- Dashed Dropzone Area -->
        <rect x="14" y="52" width="176" height="388" rx="12" fill="#131d2e" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="5 4" stroke-opacity="0.6"/>

        <!-- Upload Icon Badge -->
        <circle cx="102" cy="130" r="30" fill="#38bdf8" fill-opacity="0.08"/>
        <circle cx="102" cy="130" r="22" fill="#38bdf8" fill-opacity="0.16"/>
        <path d="M 102 118 L 102 139 M 94 126 L 102 118 L 110 126" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M 88 139 L 88 143 C 88 145 90 147 92 147 L 112 147 C 114 147 116 145 116 143 L 116 139" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

        <!-- Primary Text: Déposer votre fichier -->
        <text x="102" y="180" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Déposer votre fichier</text>
        
        <!-- Subtitles -->
        <text x="102" y="202" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="9.5" text-anchor="middle">Glissez-déposez ici</text>
        <text x="102" y="218" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" text-anchor="middle">ou cliquez pour parcourir</text>

        <!-- Formats Chips -->
        <rect x="36" y="240" width="36" height="18" rx="4" fill="#1e293b"/>
        <text x="54" y="252" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="600" text-anchor="middle">PNG</text>
        
        <rect x="84" y="240" width="36" height="18" rx="4" fill="#1e293b"/>
        <text x="102" y="252" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="600" text-anchor="middle">JPG</text>
        
        <rect x="132" y="240" width="36" height="18" rx="4" fill="#1e293b"/>
        <text x="150" y="252" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="600" text-anchor="middle">SVG</text>

        <!-- Visual Smartphone Notification Card (Height: 42px, Standard) -->
        <rect x="22" y="284" width="160" height="42" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <circle cx="38" cy="305" r="7" fill="#38bdf8"/>
        <text x="50" y="302" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="600">Zone Focus 490px</text>
        <text x="50" y="315" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="7.5">Pilule 42px • Prêt à exporter</text>

        <!-- Guide Lines Hints -->
        <line x1="26" y1="354" x2="178" y2="354" stroke="#1e293b" stroke-width="1"/>
        <text x="102" y="372" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="8" text-anchor="middle">Format smartphone 204 × 490</text>
        <text x="102" y="386" fill="#475569" font-family="system-ui, -apple-system, sans-serif" font-size="8" text-anchor="middle">Canal Alpha transparent</text>

        <!-- Bottom Home Indicator Bar -->
        <rect x="68" y="466" width="68" height="4" rx="2" fill="#475569"/>
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
