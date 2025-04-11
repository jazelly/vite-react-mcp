import React, { memo } from 'react';
import { Box, Typography, TextField } from '@mui/material';
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
    return (
      <TextField
        data-ext-id={`profile-field-${name}`}
        fullWidth
        label={label}
        name={name}
        value={value}
        onChange={handleInputChange}
        margin="normal"
        variant="outlined"
        multiline={multiline}
        rows={rows}
      />
    );
  }
  
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
});

export default ProfileField; 