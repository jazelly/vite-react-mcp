import React from 'react';
import { Box, Button, Grid, CardContent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ProfileField from './ProfileField';

const ProfileContent = ({
  profileData,
  tempData,
  editMode,
  handleInputChange,
  handleEditToggle,
  handleSave,
  handleCancel
}) => {
  return (
    <>
    <CardContent>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="First Name"
            name="firstName"
            value={editMode ? tempData.firstName : profileData.firstName}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Last Name"
            name="lastName"
            value={editMode ? tempData.lastName : profileData.lastName}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Email"
            name="email"
            value={editMode ? tempData.email : profileData.email}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Phone"
            name="phone"
            value={editMode ? tempData.phone : profileData.phone}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ProfileField 
            label="Location"
            name="location"
            value={editMode ? tempData.location : profileData.location}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>

        <Grid item xs={12}>
          <ProfileField 
            label="Occupation"
            name="occupation"
            value={editMode ? tempData.occupation : profileData.occupation}
            editMode={editMode}
            onChange={handleInputChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ProfileField 
            label="Bio"
            name="bio"
            value={editMode ? tempData.bio : profileData.bio}
            editMode={editMode}
            onChange={handleInputChange}
            multiline={true}
            rows={4}
          />
        </Grid>
      </Grid>

      {!editMode && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleEditToggle}
            startIcon={<EditIcon />}
          >
            Edit Profile
          </Button>
        </Box>
      )}

      {editMode && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            startIcon={<SaveIcon />}
          >
            Save Changes
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            onClick={handleCancel}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
        </Box>
      )}
    </CardContent>
    </>
  );
};

ProfileContent.displayName = 'ProfileContent';

export default ProfileContent; 