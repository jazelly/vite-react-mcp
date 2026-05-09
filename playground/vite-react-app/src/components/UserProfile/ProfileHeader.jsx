import React from 'react';
import { Avatar, Box, Divider, IconButton, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkIcon from '@mui/icons-material/Work';
import LabeledValue from '../Common/LabeledValue';

const ProfileHeader = ({ 
  profileData, 
  editMode, 
  onEditToggle, 
  onSave, 
  onCancel 
}) => {
  return (
    <>
      <Box
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'space-between',
          p: 2.5,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            variant="rounded"
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.main',
              boxShadow: '0 18px 36px rgba(15, 118, 110, 0.22)',
              fontSize: '2rem',
              fontWeight: 800,
            }}
          >
            {profileData.firstName[0]}{profileData.lastName[0]}
          </Avatar>
          <Box>
            <Typography variant="h5">
              {profileData.firstName} {profileData.lastName}
            </Typography>
            <LabeledValue
              idBase="profile-header-occupation"
              label={<><WorkIcon fontSize="inherit" /> Role</>}
              value={profileData.occupation}
              containerStyle={{ marginTop: '6px' }}
              labelStyle={{ alignItems: 'center', display: 'flex', gap: '4px', fontSize: '0.72rem' }}
              valueStyle={{ marginTop: '2px', fontSize: '0.95rem', fontWeight: 700 }}
            />
          </Box>
        </Stack>
        
        {!editMode ? (
          <IconButton 
            color="primary" 
            onClick={onEditToggle}
            aria-label="edit profile"
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <EditIcon />
          </IconButton>
        ) : (
          <Stack direction="row" spacing={1}>
            <IconButton 
              color="primary" 
              onClick={onSave}
              aria-label="save profile"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <SaveIcon />
            </IconButton>
            <IconButton 
              color="error" 
              onClick={onCancel}
              aria-label="cancel edit"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <CancelIcon />
            </IconButton>
          </Stack>
        )}
      </Box>
      <Divider />
    </>
  );
};

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader; 
