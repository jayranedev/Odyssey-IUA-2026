import React from 'react';
import { AppShell } from './AppShell';
import { IconArchive, IconFolder, IconClock, IconStar } from './Icons2';

export const ArchiveScreen = () => {
  return (
    <AppShell active="archive" bgClass="jg2-bg-paper">
      <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>
        
        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1 className="jg2-section-title" style={{
            fontSize: 30, padding: '0 0 4px', borderBottom: '2px solid var(--jg2-ink)',
            display: 'inline-block',
          }}>
            THE ARCHIVE
          </h1>
          <div className="jg2-hand" style={{ marginTop: 8, fontSize: 18, color: 'var(--jg2-graphite)' }}>
            Past builds, failed experiments, and saved blueprints.
          </div>
        </div>

        {/* Project Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          <ArchiveCard 
            title="Solar-Cycle Frame" 
            date="24 OCT 2023" 
            status="Completed" 
            tags={['Blueprint', 'Verified']} 
            starred 
          />
          <ArchiveCard 
            title="Manual Grain Thresher" 
            date="12 SEP 2023" 
            status="In Progress" 
            tags={['Workshop', 'Draft']} 
          />
          <ArchiveCard 
            title="Bamboo Water Filter" 
            date="05 AUG 2023" 
            status="Failed" 
            tags={['Experiment']} 
          />
          <ArchiveCard 
            title="Pedal-Powered Irrigation Pump" 
            date="18 JUL 2023" 
            status="Completed" 
            tags={['Blueprint', 'Verified']} 
            starred 
          />
        </div>

      </div>
    </AppShell>
  );
};

const ArchiveCard = ({ title, date, status, tags, starred }) => {
  return (
    <div className="jg2-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '16px 16px 12px',
        borderBottom: '1px dashed rgba(14,44,90,0.3)',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {starred ? <IconStar size={16} stroke={2} style={{ color: 'var(--jg2-yellow)' }}/> : <IconArchive size={16} stroke={1.8} style={{ color: 'var(--jg2-mute)' }}/>}
          <span className="jg2-eyebrow">{status}</span>
        </div>
        <span className="jg2-mono" style={{ fontSize: 11, color: 'var(--jg2-mute)' }}>{date}</span>
      </div>
      <div style={{ padding: '16px', flex: 1 }}>
        <h3 style={{ 
          fontFamily: "'Archivo Black', sans-serif", fontSize: 16, 
          color: 'var(--jg2-ink)', margin: '0 0 12px 0', lineHeight: 1.3 
        }}>
          {title}
        </h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(tag => (
            <span key={tag} className="jg2-chip" style={{ fontSize: 10, padding: '2px 8px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(20, 30, 60, 0.04)',
        borderTop: '1px solid var(--jg2-ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button className="jg2-btn-navy" style={{ padding: '6px 12px', fontSize: 11 }}>
          Open Project
        </button>
        <IconFolder size={16} stroke={1.5} style={{ color: 'var(--jg2-ink)' }}/>
      </div>
    </div>
  );
};
