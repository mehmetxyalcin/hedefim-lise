// Mersin silüeti — bu proje için sıfırdan çizilmiş özgün SVG.
// Hazır/stok bir illüstrasyon kopyalanmaz veya izi alınmaz; yalnızca gerçek
// Mersin simgeleri (deniz feneri, Soli Pompeiopolis sütunları, kale, palmiye,
// liman vinçleri, Toroslar, Mersin Kulesi) kendi geometrimizle yeniden çizildi.
// Dekoratiftir: aria-hidden.

const COLUMNS: { x: number; top: number }[] = [
  { x: 250, top: 118 },
  { x: 288, top: 92 },
  { x: 326, top: 130 },
  { x: 364, top: 64 },
  { x: 404, top: 64 },
  { x: 442, top: 104 },
  { x: 480, top: 86 },
  { x: 518, top: 138 },
  { x: 556, top: 110 },
];

// Palmiye: gövde + tepe noktası (153,147) çevresinde döndürülen dolu yapraklar.
const PALM_TRUNK =
  "M145,210 C148,184 151,166 150,149 L158,149 C159,166 156,184 155,210 Z";
// Sağa bakan, ucu sarkan dolu yaprak; açılarla çoğaltılır.
const PALM_FROND =
  "M153,147 C176,128 199,127 216,133 C199,141 177,148 158,162 Z";
const FROND_ANGLES = [-62, -28, 8, 152, 188, 222];

// Mersin Kulesi: dış gövde + yatay bant boşlukları (evenodd ile delik).
function towerPath(): string {
  let d = "M1352,210 L1352,64 L1408,54 L1408,210 Z";
  for (let y = 86; y <= 190; y += 16) {
    const yr = y - 6; // sağ kenar yukarı doğru daralır
    d += ` M1359,${y} L1401,${yr} L1401,${yr + 5} L1359,${y + 5} Z`;
  }
  return d;
}

function Palm() {
  return (
    <g>
      <path d={PALM_TRUNK} />
      {FROND_ANGLES.map((a) => (
        <path key={a} d={PALM_FROND} transform={`rotate(${a},153,147)`} />
      ))}
    </g>
  );
}

// Konteyner vinci. Taban çizgisinden (y=210) ölçeklenir, böylece küçültülen
// vinç de zemine oturur.
function Crane({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${x},210) scale(${scale}) translate(0,-210)`}>
      {/* ayaklar */}
      <path d="M4,210 L11,210 L17,150 L11,150 Z" />
      <path d="M64,210 L71,210 L65,150 L58,150 Z" />
      {/* portal kirişi */}
      <rect x="6" y="144" width="62" height="7" />
      {/* A-çerçeve */}
      <path d="M20,144 L33,74 L37,74 L27,144 Z" />
      <path d="M55,144 L42,74 L38,74 L48,144 Z" />
      {/* bom */}
      <rect x="-30" y="100" width="148" height="6" />
      {/* germe halatları: tepe → bom uçları */}
      <path d="M33,76 L37,79 L-27,104 L-30,101 Z" />
      <path d="M42,76 L38,79 L115,104 L118,101 Z" />
      {/* araba + konteyner */}
      <rect x="72" y="106" width="16" height="7" />
      <rect x="74" y="124" width="12" height="4" />
      <rect x="70" y="128" width="20" height="13" />
    </g>
  );
}

export function MersinSkyline({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      {/* Uzak Toroslar — atmosferik derinlik için daha soluk */}
      <g opacity="0.5">
        <path d="M1000,210 L1060,146 L1098,178 L1148,104 L1198,156 L1238,130 L1286,172 L1330,142 L1400,210 Z" />
      </g>

      <g>
        {/* Deniz feneri */}
        <path d="M62,210 L62,198 L70,198 L73,124 L69,124 L69,116 L75,116 L75,100 L73,100 L83,88 L93,100 L91,100 L91,116 L97,116 L97,124 L93,124 L96,198 L104,198 L104,210 Z" />

        {/* Palmiye 1 */}
        <Palm />

        {/* Soli Pompeiopolis sütun dizisi */}
        {COLUMNS.map((c, i) => (
          <g key={`col-${i}`}>
            <path
              d={`M${c.x},210 L${c.x + 2},${c.top + 10} L${c.x + 14},${c.top + 10} L${c.x + 16},210 Z`}
            />
            <rect x={c.x - 4} y={c.top} width={24} height={10} />
          </g>
        ))}
        {/* ayakta kalan arşitrav parçası */}
        <rect x="360" y="50" width="64" height="12" />

        {/* Kale: sur + mazgallar + iki burç */}
        <rect x="620" y="160" width="250" height="50" />
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={`cr-${i}`} x={620 + i * 20} y={150} width={11} height={11} />
        ))}
        <rect x="624" y="120" width="34" height="90" />
        {Array.from({ length: 3 }, (_, i) => (
          <rect key={`ta-${i}`} x={624 + i * 12} y={112} width={10} height={9} />
        ))}
        <rect x="790" y="108" width="38" height="102" />
        {Array.from({ length: 3 }, (_, i) => (
          <rect key={`tb-${i}`} x={790 + i * 13} y={100} width={11} height={9} />
        ))}

        {/* Palmiye 2 */}
        <g transform="translate(757,210) scale(0.88) translate(0,-210)">
          <Palm />
        </g>

        {/* Liman vinçleri */}
        <Crane x={980} />
        <Crane x={1108} scale={0.86} />

        {/* Mersin Kulesi */}
        <path fillRule="evenodd" d={towerPath()} />

        {/* Zemin çizgisi */}
        <rect x="0" y="206" width="1440" height="4" />
      </g>
    </svg>
  );
}
