import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

const ProfileField = ({ 
  label, 
  name, 
  value, 
  editMode, 
  onChange, 
  multiline = false,
  rows = 1
}) => {
  if (editMode) {
    return (
      <TextField
        fullWidth
        label={label}
        name={name}
        value={value}
        onChange={onChange}
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
};

ProfileField.displayName = 'ProfileField$$mcp';

export default ProfileField; 