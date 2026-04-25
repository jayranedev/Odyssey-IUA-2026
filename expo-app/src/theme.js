export const themes = {
  day: {
    bg: '#F1EBDC',
    surface: '#FBF6E8',
    surfaceSoft: '#E7DEC8',
    surfaceMuted: '#DCD0B5',
    ink: '#15201F',
    inkSoft: '#2A3A38',
    paper: '#F1EBDC',
    text: '#15201F',
    textMuted: '#5A5145',
    border: '#C8B894',
    borderStrong: '#A89878',
    accent: '#B8893B',
    accentDeep: '#8C6420',
    accentSoft: '#D9B271',
    sage: '#4D7A4A',
    sageDeep: '#2F5A2D',
    vermillion: '#C84B26',
    vermillionDeep: '#8E2E10',
    indigo: '#2B4A6F',
    indigoDeep: '#1A3252',
    shadow: 'rgba(20, 30, 30, 0.12)',
  },
  night: {
    bg: '#0E1620',
    surface: '#131D2A',
    surfaceSoft: '#16202C',
    surfaceMuted: '#1E2A38',
    ink: '#EDE3CA',
    inkSoft: '#C9BFA6',
    paper: '#0E1620',
    text: '#EDE3CA',
    textMuted: '#9FA8B8',
    border: '#2D3849',
    borderStrong: '#3F4C61',
    accent: '#E2B96A',
    accentDeep: '#C9A04A',
    accentSoft: '#6E5424',
    sage: '#7FB07A',
    sageDeep: '#A6D29F',
    vermillion: '#E07550',
    vermillionDeep: '#F09574',
    indigo: '#7AA4D4',
    indigoDeep: '#A8C5E8',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
};

export const sampleRules = [
  { icon: 'currency-inr', label: 'Budget cap: ₹500', tone: 'enforced' },
  { icon: 'weather-sunny', label: 'Climate: hot arid (Rajasthan)', tone: 'matched' },
  { icon: 'flash-off', label: 'No electric tools', tone: 'enforced' },
  { icon: 'map-marker', label: 'Local materials only', tone: 'enforced' },
  { icon: 'water', label: 'Monsoon-safe option available', tone: 'matched' },
  { icon: 'clock-outline', label: 'Build time ≤ 4 hours', tone: 'enforced' },
  { icon: 'leaf', label: 'Source-attributed solution', tone: 'enforced' },
];

export const startingConstraints = [
  { label: 'Budget', value: '₹500', icon: 'currency-inr' },
  { label: 'Location', value: 'Rajasthan', icon: 'map-marker' },
  { label: 'Season', value: 'Summer · hot arid', icon: 'weather-sunny' },
  { label: 'Power', value: 'None', icon: 'flash-off' },
  { label: 'Materials owned', value: 'Empty', icon: 'package-variant' },
  { label: 'Vegetables', value: 'Leafy greens, tomatoes', icon: 'leaf' },
  { label: 'Volume', value: '20 kg/day', icon: 'ruler' },
  { label: 'Build time', value: '≤ 4 hours', icon: 'clock-outline' },
];

export const materials = [
  ['Bada matka', '₹180', 'kumhar'],
  ['Chhota matka', '₹80', 'kumhar'],
  ['River sand', 'free', 'riverside'],
  ['Wet jute cloth', '₹27', 'kabadiwala'],
  ['Water 2L × 2', 'free', 'household'],
];

export const savedSolutions = [
  {
    title: 'Zeer pot',
    meta: 'Vegetable cooler',
    status: 'Validated · 12 users',
    chips: ['₹287 / ₹500', 'No power', '2 hr'],
  },
  {
    title: 'Charcoal filter box',
    meta: 'Heat-safe storage',
    status: 'Validated · 8 users',
    chips: ['₹214 / ₹500', 'Local clay', '1.5 hr'],
  },
];

export const communityPosts = [
  {
    title: 'Sand-cooled storage for summer markets',
    meta: 'Rajasthan · 14 replies',
    body: 'A simple clay-and-sand build that keeps produce from wilting during peak heat.',
  },
  {
    title: 'Low-cost jute wrap for leafy greens',
    meta: 'Gujarat · 9 replies',
    body: 'Uses wet jute, airflow gaps, and shaded placement to keep greens fresh longer.',
  },
];

