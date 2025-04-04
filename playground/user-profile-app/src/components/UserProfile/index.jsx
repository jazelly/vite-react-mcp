import React, { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';
import ProfileNotification from './ProfileNotification';

const UserProfile = () => {
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    bio: 'Software developer with a passion for React and UI/UX design.',
    location: 'San Francisco, CA',
    occupation: 'Senior Frontend Developer'
  });

  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({...profileData});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleEditToggle = () => {
    setTempData({...profileData});
    setEditMode(!editMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setProfileData({...tempData});
    setEditMode(false);
    setOpenSnackbar(true);
  };

  const handleCancel = () => {
    setTempData({...profileData});
    setEditMode(false);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ py: 4, px: 2, maxWidth: 800, mx: 'auto' }}>
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
        
        <ProfileContent 
          profileData={profileData}
          tempData={tempData}
          editMode={editMode}
          handleInputChange={handleInputChange}
          handleEditToggle={handleEditToggle}
          handleSave={handleSave}
          handleCancel={handleCancel}
        />
      </Paper>
      
      <ProfileNotification 
        open={openSnackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

UserProfile.displayName = 'UserProfile';

export default UserProfile; 