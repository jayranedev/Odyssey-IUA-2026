import { site, teamMembers } from '../lib/site';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'JugaadGPT',
      description:
        'AI that generates practical, low-cost jugaad solutions grounded in real Indian constraints — budget in rupees, available materials, power availability, and local climate.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Android, Web',
      url: site.siteUrl,
      image: new URL(site.ogImage, site.siteUrl).toString(),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
    {
      '@type': 'Organization',
      name: 'JugaadGPT Team',
      url: site.siteUrl,
      logo: new URL('/assets/icon-512.png', site.siteUrl).toString(),
    },
  ],
};

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function TeamCard({ member }) {
  const socialLinks = [
    ['github', member.github],
    ['portfolio', member.portfolio],
    ['linkedin', member.linkedin],
    ['x', member.x],
  ].filter(([, href]) => href);

  const getIcon = (label, href) => {
    if (label === 'github') return <GithubIcon />;
    if (label === 'linkedin') return <LinkedinIcon />;
    if (label === 'x') return <XIcon />;
    
    // For portfolio site favicon
    if (label === 'portfolio') {
      try {
        const domain = new URL(href).hostname;
        return (
          <div 
            style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'currentColor', 
              WebkitMaskImage: `url(https://www.google.com/s2/favicons?domain=${domain}&sz=64)`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: `url(https://www.google.com/s2/favicons?domain=${domain}&sz=64)`,
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center'
            }}
          />
        );
      } catch (e) {
        return <GlobeIcon />;
      }
    }
    return <GlobeIcon />;
  };

  return (
    <article className="team-card">
      <div className="team-photo-wrap">
        <img className="team-photo" src={member.photo} alt={member.name} loading="lazy" />
      </div>
      <div className="team-copy">
        <h3>{member.name}</h3>
        <p>{member.role}</p>
      </div>
      <div className="team-links" aria-label={`${member.name} social links`}>
        {socialLinks.map(([label, href]) => (
          <a 
            key={label} 
            href={href} 
            target="_blank" 
            rel="noreferrer" 
            className="team-link" 
            aria-label={`${label} link`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}
          >
            {getIcon(label, href)}
          </a>
        ))}
      </div>
    </article>
  );
}

export default function Page() {
  return (
    <main className="site-shell">
      <header className="hero">
        <h1 className="hero-title">
          Tell JugaadGPT your problem,
          <br />
          budget in ₹, and what&apos;s lying around.
        </h1>
        <p className="hero-subtitle">
          Get a buildable fix with a rupee bill-of-materials.
          <br />
          Ground zero for real Indian constraint-first engineering.
        </p>

        <div className="hero-actions">
          <a href={site.appUrl} className="button button-primary">
            Open Workshop UI
          </a>
        </div>
      </header>

      <section className="section section-platform" aria-labelledby="platform">
        <h2 id="platform" className="section-title">
          Three ways to build
        </h2>
        <div className="platform-grid">
          <article className="platform-card">
            <div className="platform-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3>Web App</h3>
            <p>The main workshop interface. Log problems, scan items, and generate constraint-bound blueprints.</p>
            <a href={site.appUrl} className="button button-secondary">
              Launch App
            </a>
          </article>
          <article className="platform-card">
            <div className="platform-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h3>Android APK</h3>
            <p>
              Take the workshop to the field. Native performance and offline-first capabilities for scanning parts
              anywhere.
            </p>
            <a href={site.apkUrl} className="button button-secondary">
              Download .apk
            </a>
          </article>
          <article className="platform-card">
            <div className="platform-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3>Browser Extension</h3>
            <p>
              Ask JugaadGPT about any page you&apos;re on. Install the extension and load it unpacked in
              Chrome or Chromium.
            </p>
            <ol className="install-steps">
              <li>Download &amp; unzip the extension</li>
              <li>Open <span>chrome://extensions</span></li>
              <li>Enable <strong>Developer mode</strong></li>
              <li>Click <strong>Load unpacked</strong> &rarr; select the folder</li>
            </ol>
            <a href={site.extensionZipUrl} className="button button-secondary">
              Download .zip
            </a>
          </article>
        </div>
      </section>

      <section className="section section-how" aria-labelledby="how">
        <h2 id="how" className="section-title">
          Constraints first, not last
        </h2>
        <div className="how-grid">
          <div className="how-step">
            <div className="how-number">01</div>
            <p>
              It extracts your <strong>budget, power, materials, and climate</strong> before thinking of a
              single solution.
            </p>
          </div>
          <div className="how-step">
            <div className="how-number">02</div>
            <p>
              It grounds the answer in a library of <strong>real documented Indian jugaad</strong> — not
              generic advice.
            </p>
          </div>
          <div className="how-step">
            <div className="how-number">03</div>
            <p>
              A deterministic validator <strong>rejects anything over budget</strong> or needing power you
              don&apos;t have — and makes it retry.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="team">
        <h2 id="team" className="section-title">
          Built by
        </h2>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      <footer className="footer">
        <a href={site.githubUrl} className="footer-link" target="_blank" rel="noreferrer">
          GitHub — source, APK releases &amp; extension zip
        </a>
        <p>JugaadGPT ✦ zero paid APIs ✦ made with scrap and stubbornness</p>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  );
}
