import type { ReactElement } from 'react';

export function LegacyRuntimeBadge(): ReactElement {
  return (
    <div
      style={{
        minHeight: 96,
        border: '1px solid #dbe3ef',
        borderRadius: 8,
        background: '#ffffff',
        padding: 20,
      }}
    >
      <span
        style={{
          display: 'block',
          color: '#64748b',
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        Legacy dependency
      </span>
      <strong
        style={{
          display: 'block',
          color: '#111827',
          fontSize: 20,
          lineHeight: 1.2,
        }}
      >
        React 17 package present
      </strong>
    </div>
  );
}
