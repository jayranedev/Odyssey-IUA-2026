// ConstraintTrace.jsx — the "show your work" panel
// Visually prominent: this is the product's defining feature.

const ConstraintTrace = ({ constraints, completeness, rules, onEdit, compact }) => {
  return (
    <aside style={{
      width: compact ? '100%' : 340,
      flexShrink: 0,
      borderLeft: compact ? 'none' : '0.5px solid var(--jg-border)',
      background: 'var(--jg-surface-2)',
      display: 'flex', flexDirection: 'column',
      height: compact ? 'auto' : '100%',
      overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '0.5px solid var(--jg-border)' }}>
        <div className="jg-eyebrow" style={{ marginBottom: 6 }}>Constraint trace</div>
        <h3 className="jg-serif" style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>What I understood</h3>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'var(--jg-charcoal)', lineHeight: 1.5 }}>
          Live extraction from your conversation. Edit any value — I'll re-check the solution against it.
        </p>
      </div>

      {/* extracted constraints */}
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--jg-border)', overflow: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {constraints.map((c, i) => (
            <div key={i} className="jg-anim-up" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: 'var(--jg-surface)',
              border: '0.5px solid var(--jg-border)',
              borderRadius: 10,
              animationDelay: `${i * 40}ms`,
            }}>
              <span style={{
                width: 26, height: 26, borderRadius: 8,
                background: 'color-mix(in oklab, var(--jg-terracotta) 10%, transparent)',
                color: 'var(--jg-terracotta-deep)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{c.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--jg-charcoal)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 }}>{c.label}</div>
                <div className="jg-mono jg-edit" onClick={() => onEdit && onEdit(i)}
                  style={{ fontSize: 13, lineHeight: 1.3, marginTop: 2 }}>
                  {c.value}
                </div>
              </div>
              <button onClick={() => onEdit && onEdit(i)}
                className="jg-btn jg-btn-ghost"
                style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }}>
                <IconEdit size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* completeness */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--jg-border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Constraint completeness</span>
          <span className="jg-mono" style={{ fontSize: 12, color: 'var(--jg-sage-deep)' }}>
            {completeness.have}/{completeness.total} <IconCheck size={12} />
          </span>
        </div>
        <div className="jg-progress"><i style={{ width: `${(completeness.have / completeness.total) * 100}%` }} /></div>
      </div>

      {/* validation rules */}
      <div style={{ padding: '14px 20px 20px', overflow: 'auto', flex: 1 }}>
        <div className="jg-eyebrow" style={{ marginBottom: 10 }}>Validation rules applied</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map((r, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: r.tone === 'enforced'
                  ? 'color-mix(in oklab, var(--jg-sage) 16%, transparent)'
                  : 'color-mix(in oklab, var(--jg-mustard) 14%, transparent)',
                color: r.tone === 'enforced' ? 'var(--jg-sage-deep)' : 'var(--jg-mustard-deep)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{r.icon}</span>
              <span style={{ flex: 1, lineHeight: 1.35 }}>{r.label}</span>
              <span className="jg-mono" style={{
                fontSize: 10.5, padding: '2px 7px', borderRadius: 999,
                color: r.tone === 'enforced' ? 'var(--jg-sage-deep)' : 'var(--jg-mustard-deep)',
                border: '0.5px solid currentColor',
                opacity: 0.85,
              }}>{r.tone === 'enforced' ? 'enforced' : 'matched'}</span>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 16, padding: 12, borderRadius: 10,
                      border: '0.5px dashed var(--jg-border-strong)',
                      fontSize: 12, color: 'var(--jg-charcoal)', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--jg-text)', fontWeight: 500 }}>Why this matters.</strong>{' '}
          Most AI ignores constraints. Here, every solution is filtered through these rules before
          it reaches you. If a rule fails, the solution is rejected — even if it's clever.
        </div>
      </div>
    </aside>
  );
};

window.ConstraintTrace = ConstraintTrace;
