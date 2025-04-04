import React from 'react';
import { Box, Typography, Avatar, IconButton, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ProfileHeader = ({ 
  profileData, 
  editMode, 
  onEditToggle, 
  onSave, 
  onCancel 
}) => {
  return (
    <>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              fontSize: '2rem'
            }}
          >
            {profileData.firstName[0]}{profileData.lastName[0]}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="h5">
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {profileData.occupation}
            </Typography>
          </Box>
        </Box>
        
        {!editMode ? (
          <IconButton 
            color="primary" 
            onClick={onEditToggle}
            aria-label="edit profile"
          >
            <EditIcon />
          </IconButton>
        ) : (
          <Box>
            <IconButton 
              color="primary" 
              onClick={onSave}
              aria-label="save profile"
              sx={{ mr: 1 }}
            >
              <SaveIcon />
            </IconButton>
            <IconButton 
              color="error" 
              onClick={onCancel}
              aria-label="cancel edit"
            >
              <CancelIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      <Divider />
    </>
  );
};

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader; 