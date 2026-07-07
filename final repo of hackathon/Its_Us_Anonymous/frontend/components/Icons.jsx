// Icons.jsx — hand-drawn-feel JugaadGPT iconography
// 1.5px stroke, rounded caps, slightly imperfect.
// Real objects (matka, brick, charcoal, jute sack) over abstract glyphs.

const _ico = (children, { size = 20, stroke = 'currentColor', sw = 1.5 } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// generic ui
const IconClose = (p) => _ico(<><path d="M6 6 L18 18" /><path d="M18 6 L6 18" /></>, p);
const IconChevDown = (p) => _ico(<path d="M6 9 L12 15 L18 9" />, p);
const IconChevUp = (p) => _ico(<path d="M6 15 L12 9 L18 15" />, p);
const IconChevRight = (p) => _ico(<path d="M9 6 L15 12 L9 18" />, p);
const IconChevLeft = (p) => _ico(<path d="M15 6 L9 12 L15 18" />, p);
const IconCheck = (p) => _ico(<path d="M5 12.5 L10 17.5 L19 7" />, p);
const IconEdit = (p) => _ico(<><path d="M14 4 L20 10 L9 21 L3 21 L3 15 Z" /><path d="M13 5 L19 11" /></>, p);
const IconPlus = (p) => _ico(<><path d="M12 5 V19" /><path d="M5 12 H19" /></>, p);
const IconArrowUp = (p) => _ico(<><path d="M12 19 V5" /><path d="M6 11 L12 5 L18 11" /></>, p);
const IconSend = (p) => _ico(<path d="M4 12 L20 4 L14 20 L11 13 Z" />, p);
const IconSearch = (p) => _ico(<><circle cx="11" cy="11" r="6" /><path d="M16 16 L21 21" /></>, p);
const IconSparkleSlash = (p) => _ico(<><path d="M4 4 L20 20" /><path d="M12 5 L13.5 9 L17.5 10.5 L13.5 12 L12 16" opacity="0.5" /></>, p); // (kept off-by-default; we don't use sparkles in copy/UI)
const IconBookmark = (p) => _ico(<path d="M6 4 H18 V21 L12 17 L6 21 Z" />, p);
const IconShare = (p) => _ico(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11 L16 7" /><path d="M8 13 L16 17" /></>, p);
const IconWarn = (p) => _ico(<><path d="M12 4 L21 19 H3 Z" /><path d="M12 10 V14" /><circle cx="12" cy="17" r="0.5" fill="currentColor" /></>, p);
const IconHand = (p) => _ico(<>
  <path d="M9 11 V5 a1.5 1.5 0 0 1 3 0 V11" />
  <path d="M12 11 V4 a1.5 1.5 0 0 1 3 0 V11" />
  <path d="M15 11 V5 a1.5 1.5 0 0 1 3 0 V13" />
  <path d="M18 13 V8 a1.5 1.5 0 0 1 3 0 V15 a7 7 0 0 1 -7 7 H12 a4 4 0 0 1 -3 -1.5 L4 14 a1.5 1.5 0 0 1 2.4 -1.8 L9 14"/>
</>, p);

// input affordances
const IconMic = (p) => _ico(<>
  <rect x="9.5" y="3.5" width="5" height="11" rx="2.5" />
  <path d="M5.5 11 a6.5 6.5 0 0 0 13 0" />
  <path d="M12 17.5 V21" /><path d="M9 21 H15" />
</>, p);
const IconCamera = (p) => _ico(<>
  <path d="M3 7 H7 L9 5 H15 L17 7 H21 V19 H3 Z" />
  <circle cx="12" cy="13" r="3.5" />
</>, p);
const IconAttach = (p) => _ico(<path d="M16 8 L9 15 a3 3 0 0 0 4 4 L20 12 a5 5 0 0 0 -7 -7 L6 12 a7 7 0 0 0 10 10 L21 17" />, p);
const IconImage = (p) => _ico(<><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M4 17 L10 12 L20 19" /></>, p);
const IconStop = (p) => _ico(<rect x="6" y="6" width="12" height="12" rx="1.5" />, p);

// nav
const IconChat = (p) => _ico(<path d="M4 5 H20 V17 H13 L8 21 V17 H4 Z" />, p);
const IconSaved = (p) => _ico(<path d="M6 4 H18 V21 L12 17 L6 21 Z" />, p);
const IconCommunity = (p) => _ico(<>
  <circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" />
  <path d="M3 19 a6 6 0 0 1 12 0" /><path d="M14 19 a4 4 0 0 1 7 0" />
</>, p);

// material/object icons (real things, with character)
const IconMatka = (p) => _ico(<>
  <path d="M9 6 H15 V8" />
  <path d="M8 8 C 5 10, 4 14, 6 17 C 8 20, 16 20, 18 17 C 20 14, 19 10, 16 8 Z" />
  <path d="M9 9 C 11 10, 13 10, 15 9" opacity="0.6" />
</>, p);
const IconBrick = (p) => _ico(<><rect x="3.5" y="7" width="17" height="10" rx="1" /><path d="M3.5 12 H20.5" /><path d="M9 7 V12 M14 12 V17" /></>, p);
const IconCharcoal = (p) => _ico(<>
  <path d="M5 14 C 5 10, 9 7, 14 8 C 19 9, 21 13, 19 16 C 17 19, 9 19, 6 17 Z" />
  <path d="M9 12 C 11 13, 13 13, 15 12" opacity="0.55" />
</>, p);
const IconJute = (p) => _ico(<>
  <path d="M7 7 H17 L18 21 H6 Z" />
  <path d="M9 4 H15 L17 7 H7 Z" />
  <path d="M9 11 H15 M9 15 H15" opacity="0.55" />
</>, p);
const IconRupee = (p) => _ico(<>
  <path d="M7 5 H17" /><path d="M7 9 H17" />
  <path d="M7 5 a3.5 3.5 0 0 1 0 7 H8 L15 20" />
</>, p);
const IconBolt = (p) => _ico(<path d="M13 3 L5 14 H11 L9 21 L19 9 H13 Z" />, p);
const IconBoltSlash = (p) => _ico(<><path d="M13 3 L5 14 H11 L9 21 L19 9 H13 Z" /><path d="M3 3 L21 21" stroke="currentColor"/></>, p);
const IconSun = (p) => _ico(<>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2 V4 M12 20 V22 M2 12 H4 M20 12 H22 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5" />
</>, p);
const IconMoon = (p) => _ico(<path d="M20 14 A8 8 0 0 1 10 4 A8 8 0 1 0 20 14 Z" />, p);
const IconLeaf = (p) => _ico(<><path d="M4 20 C 4 10, 12 4, 20 4 C 20 12, 14 20, 4 20 Z" /><path d="M6 18 L18 6" /></>, p);
const IconDrop = (p) => _ico(<path d="M12 3 C 7 9, 5 13, 5 16 a7 7 0 0 0 14 0 C 19 13, 17 9, 12 3 Z" />, p);
const IconTool = (p) => _ico(<path d="M14 4 a4 4 0 0 0 4 4 L20 10 L18 12 L16 10 a4 4 0 0 0 -6 0 L4 16 L8 20 L14 14 a4 4 0 0 0 4 -4 Z" />, p);
const IconLocation = (p) => _ico(<><path d="M12 22 C 6 16, 4 12, 4 9 a8 8 0 0 1 16 0 C 20 12, 18 16, 12 22 Z" /><circle cx="12" cy="9" r="2.5" /></>, p);
const IconBox = (p) => _ico(<><path d="M3.5 7 L12 3 L20.5 7 V17 L12 21 L3.5 17 Z" /><path d="M3.5 7 L12 11 L20.5 7" /><path d="M12 11 V21" /></>, p);
const IconRuler = (p) => _ico(<><rect x="3" y="9" width="18" height="6" rx="1" /><path d="M7 9 V12 M11 9 V13 M15 9 V12 M19 9 V13" /></>, p);
const IconClock = (p) => _ico(<><circle cx="12" cy="12" r="8" /><path d="M12 7 V12 L15 14" /></>, p);
const IconShield = (p) => _ico(<path d="M12 3 L20 6 V12 C 20 17, 16 21, 12 22 C 8 21, 4 17, 4 12 V6 Z" />, p);
const IconSparkleNo = IconSparkleSlash; // alias

const IconUser = (p) => _ico(<><circle cx="12" cy="9" r="4" /><path d="M4 21 a8 8 0 0 1 16 0" /></>, p);
const IconGlobe = (p) => _ico(<><circle cx="12" cy="12" r="9" /><path d="M3 12 H21" /><path d="M12 3 a14 14 0 0 1 0 18 a14 14 0 0 1 0 -18" /></>, p);

Object.assign(window, {
  IconClose, IconChevDown, IconChevUp, IconChevRight, IconChevLeft, IconCheck, IconEdit, IconPlus,
  IconArrowUp, IconSend, IconSearch, IconBookmark, IconShare, IconWarn, IconHand,
  IconMic, IconCamera, IconAttach, IconImage, IconStop,
  IconChat, IconSaved, IconCommunity,
  IconMatka, IconBrick, IconCharcoal, IconJute, IconRupee, IconBolt, IconBoltSlash,
  IconSun, IconMoon, IconLeaf, IconDrop, IconTool, IconLocation, IconBox, IconRuler, IconClock, IconShield,
  IconUser, IconGlobe,
});
