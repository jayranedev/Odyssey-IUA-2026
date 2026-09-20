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
    
    if (label === 'portfolio') {
      try {
        const domain = new URL(href).hostname;
        const proxyUrl = `/api/favicon?domain=${domain}`;
        return (
          <div 
            style={{ 
              width: 20, 
              height: 20, 
              backgroundColor: 'currentColor', 
              WebkitMaskImage: `url(${proxyUrl})`,
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: `url(${proxyUrl})`,
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
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar">
        <div className="brand-mark">JUGAAD GPT</div>
        <a href={site.appUrl} className="button button-primary">
          Open App
        </a>
      </header>

      <section className="hero">
        <p className="eyebrow">Constraint-first AI</p>
        <h1>
          AI jugaad solutions for
          <span>real Indian constraints</span>
        </h1>
        <p className="lede">
          Tell it your problem, your budget in rupees, and what&apos;s lying around. Get one specific,
          buildable fix, with a ₹ bill-of-materials, build steps, and honest failure modes.
        </p>

        <div className="prompt-card">
          <div className="prompt-label">Try this prompt</div>
          <p className="prompt-text">
            &quot;I have <span>₹500</span>, <span>no electricity</span>, and vegetables rotting in my shop in{' '}
            <span>Rajasthan</span>.&quot;
          </p>
          <div className="prompt-result">
            → Zeer-pot evaporative cooler: 2 clay matkas, sand, jute sack — <strong>₹380 total</strong>,
            drops veggie temp ~10°C. No power needed.
          </div>
          <a href={`${site.appUrl}/chat`} className="button button-secondary prompt-button">
            Ask it yourself — free →
          </a>
        </div>
      </section>

      <section className="section" aria-labelledby="get-it">
        <h2 id="get-it" className="section-title">
          Use it anywhere
        </h2>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              🌐
            </div>
            <h3>Try in Browser</h3>
            <p>
              The full workshop: chat, photo-of-materials scanning, blueprints, and the jugaad archive.
              5 free jugaads a day — log in for 25.
            </p>
            <a href={site.appUrl} className="button button-secondary">
              Open web app
            </a>
          </article>

          <article className="feature-card feature-card-highlight" id="android-card">
            <div className="feature-icon" aria-hidden="true">
              🤖
            </div>
            <h3>Android App</h3>
            <p>
              Native app with voice input, camera scrap-scanning, and offline blueprint viewing. Direct APK
              — no Play Store needed.
            </p>
            <a href={site.apkUrl} className="button button-secondary">
              Download APK
            </a>
          </article>

          <article className="feature-card">
            <div className="feature-icon" aria-hidden="true">
              🧩
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
              <li>Click <strong>Load unpacked</strong> → select the folder</li>
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
        <p>JugaadGPT · zero paid APIs · made with scrap and stubbornness</p>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  );
}