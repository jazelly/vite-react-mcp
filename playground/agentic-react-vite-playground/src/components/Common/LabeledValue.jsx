import React, { memo } from 'react';

const LabeledValue = memo(
  ({
    label,
    value,
    idBase = null,
    containerStyle = {},
    labelStyle = {},
    valueStyle = {},
  }) => {
    const rootId = idBase || undefined;
    const valueId = idBase ? `${idBase}-value` : undefined;

    return (
      <div id={rootId} data-ext-id={rootId} style={containerStyle}>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'rgba(0, 0, 0, 0.6)',
            display: 'block',
            ...labelStyle,
          }}
        >
          {label}
        </span>
        <p
          id={valueId}
          data-ext-id={valueId}
          style={{
            margin: '4px 0 0 0',
            fontSize: '1rem',
            ...valueStyle,
          }}
        >
          {value}
        </p>
      </div>
    );
  },
);

LabeledValue.displayName = 'LabeledValue';

export default LabeledValue;
