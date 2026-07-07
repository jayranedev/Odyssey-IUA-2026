// Icons2.jsx — line icons matching the navy/blueprint aesthetic.
// Stroke-based, currentColor.

const Ico = ({ size = 20, stroke = 1.6, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IcoTools = (p) => (
  <Ico {...p}>
    <path d="M14.7 6.3a3.5 3.5 0 0 0-4.4 4.4L4 17l3 3 6.3-6.3a3.5 3.5 0 0 0 4.4-4.4l-2.5 2.5-2-2 2.5-2.5z"/>
    <path d="M5.5 18.5l1 1"/>
  </Ico>
);
const IcoCompass = (p) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="9"/>
    <path d="M15 9l-2 6-4 0 2-6 4 0z" fill="currentColor" stroke="none" opacity="0.15"/>
    <path d="M15 9l-2 6-4 0 2-6 4 0z"/>
  </Ico>
);
const IcoStorefront = (p) => (
  <Ico {...p}>
    <path d="M3 9l1.5-4h15L21 9"/>
    <path d="M4 9v11h16V9"/>
    <path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/>
    <path d="M9 20v-5h6v5"/>
  </Ico>
);
const IcoArchive = (p) => (
  <Ico {...p}>
    <rect x="3" y="4" width="18" height="4" rx="0.5"/>
    <path d="M5 8v12h14V8"/>
    <path d="M10 13h4"/>
  </Ico>
);
const IcoGear = (p) => (
  <Ico {...p}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 12a7.4 7.4 0 0 0-.1-1.1l2-1.5-2-3.5-2.4.8a7.4 7.4 0 0 0-2-1.1l-.4-2.6h-4l-.4 2.6a7.4 7.4 0 0 0-2 1.1l-2.4-.8-2 3.5 2 1.5a7.4 7.4 0 0 0-.1 1.1c0 .4.05.75.1 1.1l-2 1.5 2 3.5 2.4-.8c.6.45 1.27.83 2 1.1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 2-1.1l2.4.8 2-3.5-2-1.5c.05-.35.1-.7.1-1.1z"/>
  </Ico>
);
const IcoCamera = (p) => (
  <Ico {...p}>
    <path d="M3 8h4l2-3h6l2 3h4v11H3z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </Ico>
);
const IcoX = (p) => (
  <Ico {...p}>
    <path d="M5 5l14 14M19 5L5 19"/>
  </Ico>
);
const IcoPlus = (p) => (
  <Ico {...p}>
    <path d="M12 5v14M5 12h14"/>
  </Ico>
);
const IcoArrowRight = (p) => (
  <Ico {...p}>
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </Ico>
);
const IcoSparkle = (p) => (
  <Ico {...p}>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>
    <path d="M5.5 5.5l3 3M15.5 15.5l3 3M18.5 5.5l-3 3M8.5 15.5l-3 3"/>
  </Ico>
);
const IcoListCheck = (p) => (
  <Ico {...p}>
    <path d="M9 6h11M9 12h11M9 18h11"/>
    <path d="M3 5l1.5 1.5L7 4M3 11l1.5 1.5L7 10M3 17l1.5 1.5L7 16"/>
  </Ico>
);
const IcoWallet = (p) => (
  <Ico {...p}>
    <path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
    <path d="M3 7v0a2 2 0 0 1 2-2h12"/>
    <circle cx="17" cy="13.5" r="1.2" fill="currentColor"/>
  </Ico>
);
const IcoEdit = (p) => (
  <Ico {...p}>
    <path d="M14 4l6 6L8 22H2v-6L14 4z"/>
    <path d="M12 6l6 6"/>
  </Ico>
);
const IcoSpeaker = (p) => (
  <Ico {...p}>
    <path d="M3 10v4h4l5 4V6L7 10H3z"/>
    <path d="M16 8a5 5 0 0 1 0 8M19 5a8 8 0 0 1 0 14"/>
  </Ico>
);
const IcoStar = (p) => (
  <Ico {...p}>
    <path d="M12 3l2.6 6.2 6.4.5-4.9 4.2 1.5 6.3L12 16.8 6.4 20.2l1.5-6.3L3 9.7l6.4-.5z" fill="currentColor"/>
  </Ico>
);
const IcoMap = (p) => (
  <Ico {...p}>
    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/>
    <path d="M9 4v16M15 6v16"/>
  </Ico>
);
const IcoPin = (p) => (
  <Ico {...p}>
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </Ico>
);
const IcoArrowSm = (p) => (
  <Ico {...p}><path d="M5 12h14M14 7l5 5-5 5"/></Ico>
);
const IcoPencil = (p) => (
  <Ico {...p}>
    <path d="M4 20l3.5-1L20 6.5 17.5 4 5 16.5z"/>
    <path d="M14 7l3 3"/>
  </Ico>
);

Object.assign(window, {
  IcoTools, IcoCompass, IcoStorefront, IcoArchive, IcoGear,
  IcoCamera, IcoX, IcoPlus, IcoArrowRight, IcoSparkle, IcoListCheck,
  IcoWallet, IcoEdit, IcoSpeaker, IcoStar, IcoMap, IcoPin, IcoArrowSm, IcoPencil,
});
