import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const ProfileNotification = ({ 
  open, 
  onClose 
}) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={6000} 
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity="success" sx={{ width: '100%' }}>
        Profile updated successfully!
      </Alert>
    </Snackbar>
  );
};

ProfileNotification.displayName = 'ProfileNotification$$mcp';

export default ProfileNotification; 