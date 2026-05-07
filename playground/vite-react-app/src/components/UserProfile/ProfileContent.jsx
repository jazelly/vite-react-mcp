import React from 'react';
import { Box, Button, Grid, CardContent } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ProfileField from './ProfileField';
import { useProfile } from '../../context/ProfileContext';

const ProfileContent = () => {
  const { profileData, editMode, handleEditToggle, handleSave, handleCancel } = useProfile();

  if (!profileData) {
    return <Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <>
    <CardContent>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="First Name"
            name="firstName"
            editMode={editMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Last Name"
            name="lastName"
            editMode={editMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Email"
            name="email"
            editMode={editMode}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <ProfileField 
            label="Phone"
            name="phone"
            editMode={editMode}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ProfileField 
            label="Location"
            name="location"
            editMode={editMode}
          />
        </Grid>

        <Grid item xs={12}>
          <ProfileField 
            label="Occupation"
            name="occupation"
            editMode={editMode}
          />
        </Grid>
        
        <Grid item xs={12}>
          <ProfileField 
            label="Bio"
            name="bio"
            editMode={editMode}
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


export default ProfileContent; 