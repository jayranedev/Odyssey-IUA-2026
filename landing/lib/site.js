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
    name: 'Jay Rane',
    role: 'Backend, Pipeline, Mobile, Extension, Integration',
    photo: '/assets/team/member1.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
  {
    name: 'Ashden Mascarenhas',
    role: 'Frontend & Design',
    photo: '/assets/team/member2.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
  {
    name: 'Sumukh Raikar',
    role: 'WhatsApp & Design',
    photo: '/assets/team/member3.jpg',
    github: 'https://github.com/',
    linkedin: '',
    x: '',
  },
];