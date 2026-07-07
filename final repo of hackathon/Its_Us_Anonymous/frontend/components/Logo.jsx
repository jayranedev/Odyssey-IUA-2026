// Logo.jsx — JugaadGPT mark
// A clay matka (pot) with circuit traces, two node dots (sage + mustard),
// and a tiny face. Works at favicon size; scales to print stamp.
//
// <JugaadMark size={32} face dots /> — full mark
// <JugaadMark size={16} stamp />     — single-color stamp version (favicon)
// <JugaadWordmark />                 — mark + wordmark side by side
//
// Extension icon variants:
// <ExtIcon variant="idle" />    — plain
// <ExtIcon variant="alert" />   — red dot (a notification is pending)
// <ExtIcon variant="active" />  — terracotta ring (working on this tab)

const JugaadMark = ({ size = 32, face = true, dots = true, stamp = false, accent }) => {
  const ink = stamp ? 'currentColor' : 'var(--jg-ink)';
  // Matka body: brass-tinted ceramic. Slightly warmer than the brass accent
  // so it reads as a clay object, not a brass fitting.
  const clay = stamp ? 'currentColor' : (accent || 'var(--jg-brass)');
  const clayDeep = stamp ? 'currentColor' : 'var(--jg-brass-deep)';
  const moss = stamp ? 'currentColor' : 'var(--jg-moss)';
  const verm = stamp ? 'currentColor' : 'var(--jg-vermillion)';

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={{ display: 'block', shapeRendering: 'geometricPrecision' }}>
      {/* circuit traces — drawn first so the pot covers their inner ends */}
      {!stamp && (
        <g stroke={ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85">
          {/* left trace: shoulder of pot → out → up → dot */}
          <path d="M 16 28 L 8 28 L 8 18 L 12 18" />
          {/* right trace: shoulder → out → down → dot */}
          <path d="M 48 28 L 56 28 L 56 40 L 52 40" />
          {/* tiny solder pads */}
          <circle cx="16" cy="28" r="1.2" fill={ink} stroke="none" />
          <circle cx="48" cy="28" r="1.2" fill={ink} stroke="none" />
        </g>
      )}

      {/* matka body — slightly squat, hand-drawn feel via curves */}
      <g>
        {/* shadow plate (very subtle) */}
        {!stamp && (
          <ellipse cx="32" cy="55.5" rx="14" ry="1.6" fill={ink} opacity="0.08" />
        )}
        {/* pot fill */}
        <path
          d="M 22 24
             C 22 22, 23 21, 24.5 21
             L 39.5 21
             C 41 21, 42 22, 42 24
             C 47 27, 50 33, 50 40
             C 50 49, 42 55, 32 55
             C 22 55, 14 49, 14 40
             C 14 33, 17 27, 22 24 Z"
          fill={clay}
          stroke={stamp ? 'currentColor' : clayDeep}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* pot rim shadow line — subtle horizontal mark */}
        <path d="M 22.5 25.5 C 28 27, 36 27, 41.5 25.5"
              stroke={stamp ? 'currentColor' : clayDeep}
              strokeWidth="1" fill="none" strokeLinecap="round" opacity={stamp ? 0.6 : 0.55} />
        {/* belly highlight — left side, sketchy */}
        {!stamp && (
          <path d="M 19 36 C 18 41, 19 46, 22 50"
                stroke="#FFF" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.18" />
        )}
      </g>

      {/* face (eyes + smile) */}
      {face && (
        <g fill={stamp ? 'currentColor' : '#1A1A1A'}>
          <circle cx="27" cy="38" r="1.5" />
          <circle cx="37" cy="38" r="1.5" />
          <path d="M 28 43 Q 32 46, 36 43"
                fill="none" stroke={stamp ? 'currentColor' : '#1A1A1A'}
                strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {/* node dots — sage + mustard */}
      {dots && !stamp && (
        <g>
          <circle cx="12" cy="18" r="3" fill={moss} stroke={ink} strokeWidth="1" />
          <circle cx="52" cy="40" r="3" fill={verm} stroke={ink} strokeWidth="1" />
        </g>
      )}
    </svg>
  );
};

const JugaadWordmark = ({ size = 28, color = 'var(--jg-ink)' }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
    <JugaadMark size={size} />
    <span style={{
      fontFamily: 'var(--jg-font-serif)',
      fontSize: Math.round(size * 0.62),
      fontWeight: 500,
      letterSpacing: '-0.01em',
      color,
    }}>
      Jugaad<span style={{ fontStyle: 'italic', color: 'var(--jg-brass-deep)' }}>GPT</span>
    </span>
  </div>
);

// Browser-extension toolbar icon (square, rendered against browser chrome)
// variants: idle | alert (red dot) | active (terracotta ring)
const ExtIcon = ({ size = 28, variant = 'idle', label }) => {
  return (
    <div style={{
      width: size, height: size, position: 'relative',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 6,
      background: variant === 'active' ? 'color-mix(in oklab, var(--jg-terracotta) 14%, transparent)' : 'transparent',
      transition: 'background .15s',
    }}>
      <JugaadMark size={Math.round(size * 0.78)} face={false} dots={false} />
      {variant === 'alert' && (
        <span style={{
          position: 'absolute', top: -2, right: -2,
          width: 10, height: 10, borderRadius: 999,
          background: 'var(--jg-vermillion)',
          border: '1.5px solid var(--jg-paper)',
          boxShadow: '0 0 0 0.5px rgba(0,0,0,0.2)',
        }} />
      )}
      {variant === 'active' && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 6,
          border: '1.5px solid var(--jg-brass)',
          pointerEvents: 'none',
        }} />
      )}
      {label && (
        <span style={{
          position: 'absolute', top: -7, right: -10,
          minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 999,
          background: 'var(--jg-vermillion)', color: '#fff',
          fontSize: 10, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--jg-paper)',
          fontFamily: 'var(--jg-font-sans)',
        }}>{label}</span>
      )}
    </div>
  );
};

Object.assign(window, { JugaadMark, JugaadWordmark, ExtIcon });
