// Search results page mock — provides realistic context for the injected pill.
// A neutral search engine UI (not branded) so the JugaadGPT pill reads as
// the design subject, not the page.

const SearchResultsMock = () => (
  <div style={{
    width: 880, height: 560, background: '#fff',
    borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    color: '#202124', position: 'relative',
  }}>
    {/* fake browser chrome */}
    <div style={{ height: 36, background: '#f1f3f4', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FF5F57' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#FFBD2E' }} />
        <span style={{ width: 11, height: 11, borderRadius: 999, background: '#28C840' }} />
      </div>
      <div style={{ flex: 1, height: 22, background: '#fff', borderRadius: 4, marginLeft: 14, padding: '0 10px',
                    display: 'flex', alignItems: 'center', fontSize: 11, color: '#5f6368' }}>
        google.com/search?q=keep+vegetables+fresh+without+fridge
      </div>
      {/* extension toolbar — shows our icon with the alert dot */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ width: 22, height: 22, borderRadius: 4, background: '#e5e7eb' }} />
        <ExtIcon size={22} variant="alert" />
      </div>
    </div>

    {/* search header */}
    <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontFamily: 'serif', fontSize: 22, color: '#4285F4', fontWeight: 500 }}>g</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                    border: '1px solid #dfe1e5', borderRadius: 24, padding: '6px 14px' }}>
        <IconSearch size={14} stroke="#5f6368" />
        <span style={{ fontSize: 13, color: '#202124' }}>keep vegetables fresh without fridge</span>
      </div>
    </div>

    {/* fake results */}
    <div style={{ padding: '14px 24px', fontSize: 13, color: '#202124', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {[
        { url: 'wikihow.com › keep-veg-fresh', t: '8 ways to keep vegetables fresh without refrigeration', d: 'Wrap in damp cotton, store in earthen pots, keep in a cool corner away from direct sun…' },
        { url: 'thekitchn.com › no-fridge-storage', t: 'How root cellars work: storing produce without electricity', d: 'A simple cellar dug 4 ft below ground stays at 10–13 °C year-round. Best for…' },
        { url: 'reddit.com › r/Frugal › comments', t: '[Q] Living off-grid, vegetables spoiling in a day', d: '127 comments — top reply: "look up zeer pots, they work surprisingly well in dry heat…"' },
      ].map((r, i) => (
        <div key={i}>
          <div style={{ fontSize: 11, color: '#5f6368' }}>{r.url}</div>
          <div style={{ fontSize: 17, color: '#1a0dab', marginTop: 2, marginBottom: 4 }}>{r.t}</div>
          <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.45 }}>{r.d}</div>
        </div>
      ))}
    </div>

    {/* injected pill — bottom-right */}
    <div style={{ position: 'absolute', right: 18, bottom: 18 }}>
      <InjectedPill />
    </div>
  </div>
);

window.SearchResultsMock = SearchResultsMock;
