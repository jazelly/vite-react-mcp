import React, { useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BadgeIcon from '@mui/icons-material/Badge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MailIcon from '@mui/icons-material/Mail';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PlaceIcon from '@mui/icons-material/Place';
import ProfileHeader from './ProfileHeader';
import ProfileContent from './ProfileContent';
import ProfileNotification from './ProfileNotification';
import { useUserProfileData } from '../../hooks/useUserProfileData';
import { ProfileProvider } from '../../context/ProfileContext';
import {
  AppSurface,
  DataPanel,
  MetricCard,
  PageHeader,
  StatusChip,
  VisualBriefing,
} from '../ui/MuiPlaygroundPrimitives';
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
    return <AppSurface><Box sx={{ p: 4, textAlign: 'center' }}>Loading...</Box></AppSurface>;
  }

  if (!profileData) {
     return null;
  }

  return (
    <AppSurface>
      <PageHeader
        eyebrow="Profile operations"
        title="User Profile"
        description="An editable account-owner record with contact governance, escalation responsibility, and durable field-level selectors for component state and source-code inspection."
        icon={<ManageAccountsIcon />}
        actions={
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
            variant="outlined"
          >
            Back to User List
          </Button>
        }
      />

      <VisualBriefing
        imageSrc="/generated/customer-operations-directory.png"
        title="Profile governance scenario"
        body={`${profileData.firstName} ${profileData.lastName} is modeled as a real operating owner, not a placeholder user. The profile route captures contact data, team responsibility, biography context, edit state, save/cancel actions, and snackbar feedback in a nested MUI tree.`}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MetricCard icon={<BadgeIcon />} label="Role" value={profileData.occupation} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard icon={<PlaceIcon />} label="Location" value={profileData.location} tone="secondary" />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard icon={<MailIcon />} label="Contact" value="Verified" tone="success" />
        </Grid>
      </Grid>

      <DataPanel
        title={`${profileData.firstName} ${profileData.lastName}`}
        subtitle="Editable employee profile with stable field IDs used by MCP selector tests."
        actions={
          <StatusChip color={editMode ? 'warning' : 'success'} icon={<CheckCircleIcon />}>
            {editMode ? 'Editing' : 'Saved'}
          </StatusChip>
        }
      >
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
      </DataPanel>
      
      <ProfileNotification 
        open={openSnackbar}
        onClose={handleCloseSnackbar}
      />
    </AppSurface>
  );
};

// Specifically use a uniquely-suffixed displayName to distinguish from MUI components
UserProfile.displayName = 'UserProfile';

export default UserProfile;
