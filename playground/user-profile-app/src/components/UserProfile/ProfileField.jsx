import React, { memo } from 'react';
import { useProfile } from '../../context/ProfileContext';

const ProfileField = memo(({ 
  label, 
  name, 
  editMode,
  multiline = false,
  rows = 1
}) => {
  const { tempData, profileData, handleInputChange } = useProfile();
  const value = editMode ? tempData[name] : profileData[name];
  if (editMode) {
    const commonProps = {
      'data-ext-id': `profile-field-${name}`,
      id: `profile-field-${name}`,
      name: name,
      value: value,
      onChange: handleInputChange,
      style: {
        width: '100%',
        padding: '16.5px 14px',
        borderRadius: '4px',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
        fontSize: '1rem',
        marginTop: '8px',
        marginBottom: '4px'
      }
    };

    return (
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor={`profile-field-${name}`} style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>{label}</label>
        {multiline ? (
          <textarea
            {...commonProps}
            rows={rows}
          />
        ) : (
          <input
            {...commonProps}
            type="text"
          />
        )}
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <span style={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)', display: 'block' }}>{label}</span>
      <p style={{ margin: '4px 0 0 0', fontSize: '1rem' }}>{value}</p>
    </div>
  );
});
ProfileField.displayName = 'ProfileField';

export default ProfileField; 