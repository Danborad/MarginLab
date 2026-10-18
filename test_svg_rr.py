import xml.etree.ElementTree as ET

svg_rr = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <!-- Matte Wall & Asphalt Shading -->
    <linearGradient id="rr_blue_wall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="60%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>
    <linearGradient id="rr_red_door" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#B91C1C"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <filter id="rr_shadow_soft">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>

  <!-- Massive Saturated Yves Klein Cobalt Blue Wall (Color is Architecture) -->
  <rect width="300" height="315" fill="url(#rr_blue_wall)"/>
  
  <!-- Subtle Architectural Plaster Seam -->
  <line x1="110" y1="0" x2="110" y2="315" stroke="#1E3A8A" stroke-width="1.2" opacity="0.4"/>

  <!-- Monumental Giant Detective Silhouette Shadow on Blue Wall -->
  <g id="giant_shadow" opacity="0.32" transform="translate(185, 20)">
    <!-- Fedora Hat & Brim -->
    <path d="M5 45 C15 20 50 15 80 18 C75 35 70 42 68 45 L115 48 C120 50 115 56 100 56 L-5 52 C-15 52 -10 46 5 45 Z" fill="#0A0F1D"/>
    <!-- Face Profile: Forehead, Nose, Lips, Chin, Jaw -->
    <path d="M12 52 C20 70 25 82 23 90 L32 98 L24 104 C25 112 28 116 26 122 L18 126 C22 145 35 175 42 205 L-20 205 L-20 52 Z" fill="#0A0F1D"/>
  </g>

  <!-- Theatrical Recessed Vermilion Red Doorway on Left -->
  <g id="red_doorway" transform="translate(32, 75)">
    <!-- Depth Bevel -->
    <polygon points="-4,-4 38,-4 38,240 -4,240" fill="#0F172A" opacity="0.6"/>
    <!-- Pure Saturated Red Door Interior -->
    <rect x="0" y="0" width="34" height="240" fill="url(#rr_red_door)"/>
    <!-- Inner Shadow -->
    <line x1="0" y1="0" x2="0" y2="240" stroke="#7F1D1D" stroke-width="2"/>
    <line x1="0" y1="0" x2="34" y2="0" stroke="#7F1D1D" stroke-width="2"/>
  </g>

  <!-- Clean Asphalt Ground Plane -->
  <rect x="0" y="315" width="300" height="85" fill="#1F2937"/>
  <line x1="0" y1="315" x2="300" y2="315" stroke="#111827" stroke-width="2"/>

  <!-- Saturated Wet Blue Paint Strip Rolled out on Asphalt -->
  <path d="M0 342 L236 342 L236 370 L0 370 Z" fill="#2563EB" opacity="0.95"/>
  <line x1="0" y1="342" x2="236" y2="342" stroke="#60A5FA" stroke-width="1.2" opacity="0.7"/>

  <!-- Red Vintage Boxy Car Emerging from the Doorway -->
  <g id="red_car" transform="translate(26, 252)">
    <!-- Cast Shadow on Road -->
    <ellipse cx="65" cy="65" rx="55" ry="5" fill="#0A0F1D" opacity="0.8"/>
    <!-- Car Body -->
    <path d="M4 35 L20 35 L40 18 L78 18 L95 35 L118 36 C122 36 125 39 125 44 L123 58 C123 60 120 62 116 62 L105 62 C105 52 92 52 92 62 L35 62 C35 52 22 52 22 62 L6 62 C4 62 2 60 2 56 L4 35 Z" fill="#DC2626"/>
    <!-- Car Cabin / Windows -->
    <path d="M42 21 L75 21 L88 34 L38 34 Z" fill="#0F172A" opacity="0.85"/>
    <line x1="58" y1="21" x2="58" y2="34" stroke="#DC2626" stroke-width="2.5"/>
    <line x1="75" y1="21" x2="75" y2="34" stroke="#DC2626" stroke-width="2"/>
    <!-- Car Wheels with Blue Rims -->
    <circle cx="28" cy="60" r="11" fill="#111827"/>
    <circle cx="28" cy="60" r="6" fill="#3B82F6"/>
    <circle cx="28" cy="60" r="2.5" fill="#E2E8F0"/>
    <circle cx="98" cy="60" r="11" fill="#111827"/>
    <circle cx="98" cy="60" r="6" fill="#3B82F6"/>
    <circle cx="98" cy="60" r="2.5" fill="#E2E8F0"/>
    <!-- Bumper & Headlight -->
    <rect x="119" y="46" width="6" height="12" rx="1" fill="#1F2937"/>
    <rect x="117" y="40" width="4" height="6" fill="#FEF08A"/>
  </g>

  <!-- Walking Man pulling the Blue Paint Roller -->
  <g id="walking_man" transform="translate(242, 210)">
    <!-- Ground Cast Shadow -->
    <ellipse cx="22" cy="112" rx="20" ry="4.5" fill="#0A0F1D" opacity="0.75"/>
    <!-- Legs in Motion -->
    <path d="M14 62 L6 90 L2 112 M20 62 L32 88 L38 110" stroke="#111827" stroke-width="6" stroke-linecap="round" fill="none"/>
    <polygon points="0,110 5,110 4,114 -2,114" fill="#020617"/>
    <polygon points="36,108 42,108 40,112 34,112" fill="#020617"/>
    <!-- Tweed Jacket & Torso -->
    <path d="M8 26 L30 26 L34 65 L8 65 Z" fill="#9CA3AF"/>
    <path d="M12 28 L28 28 L30 63 L12 63 Z" fill="#6B7280"/>
    <!-- Arm pulling handle -->
    <path d="M14 34 L-6 62" stroke="#9CA3AF" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Head & Fedora Hat -->
    <ellipse cx="20" cy="15" rx="6" ry="8" fill="#FCA5A5"/>
    <path d="M10 11 C12 2 26 2 28 11 Z" fill="#1F2937"/>
    <line x1="8" y1="12" x2="32" y2="12" stroke="#111827" stroke-width="3" stroke-linecap="round"/>

    <!-- Red Paint Roller Pole & Blue Roller -->
    <line x1="-6" y1="62" x2="-26" y2="135" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="-38" y="130" width="22" height="18" rx="4" fill="#1D4ED8" stroke="#1E40AF" stroke-width="1.5"/>
    <circle cx="-27" cy="139" r="3" fill="#EF4444"/>
  </g>

  <!-- Bottom Theatrical Film Caption -->
  <g id="film_caption" transform="translate(18, 385)">
    <text x="0" y="0" font-family="'Helvetica Neue', 'Arial Black', sans-serif" font-size="8.5" font-weight="900" fill="#F8FAFC" letter-spacing="1.5">REALITY RESTAGED</text>
    <text x="0" y="8.5" font-family="'Courier New', monospace" font-size="5" font-weight="700" fill="#93C5FD" letter-spacing="1">DOCUMENTARY MEMORY • SURREAL STAGE</text>
  </g>
  <!-- Right Category Badge -->
  <rect x="238" y="374" width="48" height="16" rx="3" fill="#E11D48"/>
  <text x="262" y="385" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">电影舞台</text>
</svg>"""

ET.fromstring(svg_rr)
print("SVG parsed cleanly as valid XML!")
