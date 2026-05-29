import React, { memo } from 'react';
import { Paper, TextField } from '@mui/material';
import { useProfile } from '../../context/ProfileContext';
import LabeledValue from '../Common/LabeledValue';

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
    };

    return (
      <TextField
        {...commonProps}
        fullWidth
        label={label}
        margin="dense"
        multiline={multiline}
        rows={multiline ? rows : undefined}
        type="text"
        variant="outlined"
      />
    );
  }
  
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 2 }}>
      <LabeledValue
        idBase={`profile-display-${name}`}
        label={label}
        value={value}
        valueStyle={{ fontWeight: 700 }}
      />
    </Paper>
  );
});
ProfileField.displayName = 'ProfileField';

export default ProfileField; 
