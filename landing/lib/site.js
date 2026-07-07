export const site = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://jugaadgpt.example.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.jugaadgpt.example.com',
  apkUrl:
    process.env.NEXT_PUBLIC_APK_URL ||
    'https://github.com/jayranedev/Odyssey-IUA-2026/releases/latest',
  extensionZipUrl:
    process.env.NEXT_PUBLIC_EXTENSION_ZIP_URL ||
    'https://github.com/jayranedev/Odyssey-IUA-2026/releases/latest',
  githubUrl: 'https://github.com/jayranedev/Odyssey-IUA-2026',
  ogImage: '/assets/og-image.png',
};

export const teamMembers = [
  {
    name: 'Team Member One',
    role: 'Backend & Pipeline',
    photo: '/assets/team/member1.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
  {
    name: 'Team Member Two',
    role: 'Frontend & Design',
    photo: '/assets/team/member2.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
  {
    name: 'Team Member Three',
    role: 'Mobile & Extension',
    photo: '/assets/team/member3.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
  {
    name: 'Team Member Four',
    role: 'Data & Ops',
    photo: '/assets/team/member4.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
];