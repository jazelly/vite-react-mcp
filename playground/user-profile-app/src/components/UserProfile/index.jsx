import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';
import ProfileNotification from './ProfileNotification';
import { useUsers } from '../../context/UserContext';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { getUserById, updateUser } = useUsers();
  
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    const userData = getUserById(userId);
    if (userData) {
      setProfileData(userData);
      setTempData({...userData});
    } else {
      // Handle user not found - redirect to user list
      navigate('/users');
    }
  }, [userId, getUserById, navigate]);

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
    updateUser(profileData.id, tempData);
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

  const handleBackToList = () => {
    navigate('/users');
  };

  if (!profileData) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
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

// Specifically use a uniquely-suffixed displayName to distinguish from MUI components
UserProfile.displayName = 'UserProfile$$mcp';

export default UserProfile;