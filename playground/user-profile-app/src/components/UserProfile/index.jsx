import React, { useState } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';
import ProfileNotification from './ProfileNotification';
import { useUserProfileData } from '../../hooks/useUserProfileData';
import { ProfileProvider } from '../../context/ProfileContext';
const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const {
    profileData,
    editMode,
    isLoading,
    handleEditToggle,
    handleSave: handleSaveFromHook,
    handleCancel,
  } = useUserProfileData(userId);

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleSave = () => {
    const success = handleSaveFromHook();
    if (success) {
        setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleBackToList = () => {
    navigate('/users');
  };

  if (isLoading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  if (!profileData) {
     return null;
  }

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 800, mx: 'auto' }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={handleBackToList}
        sx={{ mb: 2 }}
      >
        Back to User List
      </Button>
      
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        User Profile
      </Typography>
      
      <Paper elevation={3} sx={{ mb: 4 }}>
        <ProfileHeader 
          profileData={profileData}
          editMode={editMode}
          onEditToggle={handleEditToggle}
          onSave={handleSave}
          onCancel={handleCancel}
        />
        <ProfileProvider userId={userId}>
          <ProfileContent />
        </ProfileProvider>
      </Paper>
      
      <ProfileNotification 
        open={openSnackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

// Specifically use a uniquely-suffixed displayName to distinguish from MUI components
UserProfile.displayName = 'UserProfile';

export default UserProfile;