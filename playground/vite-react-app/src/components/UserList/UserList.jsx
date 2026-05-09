import React, { useState } from 'react';
import {
  Box,
  Divider,
  Grid,
  List,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TuneIcon from '@mui/icons-material/Tune';
import { useNavigate } from 'react-router-dom';
import UserSearch from './UserSearch';
import UserRow from './UserRow';
import EmptyResult from './EmptyResult';
import { mockUsers } from './mockData';
import {
  AppSurface,
  DataPanel,
  MetricCard,
  PageHeader,
  StatusChip,
  ToolbarSurface,
  VisualBriefing,
} from '../ui/MuiPlaygroundPrimitives';

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const filteredUsers = mockUsers.filter((user) =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppSurface>
      <PageHeader
        eyebrow="Material UI playground"
        title="User Directory"
        description="A customer operations workspace for reviewing high-value accounts, escalation owners, regulated contact data, and service-risk routing while preserving stable React source selection targets."
        icon={<GroupsIcon />}
        actions={<StatusChip color="success" icon={<TaskAltIcon />}>Runtime ready</StatusChip>}
      />

      <VisualBriefing
        imageSrc="/generated/customer-operations-directory.png"
        title="Account quality review cockpit"
        body="The directory models the kind of dense profile workflow used by support operations leads: specialists search across role, region, and responsibility; reviewers open a profile route; and form-level selectors remain available for MCP state and source inspection."
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <StatusChip color="success">Tier 1 contacts verified</StatusChip>
          <StatusChip color="default">Escalation owners assigned</StatusChip>
          <StatusChip color="default">Profile edits audited</StatusChip>
        </Stack>
      </VisualBriefing>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <MetricCard icon={<GroupsIcon />} label="People indexed" value={mockUsers.length} />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard
            icon={<PersonSearchIcon />}
            label="Filtered results"
            value={filteredUsers.length}
            tone="secondary"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <MetricCard icon={<TuneIcon />} label="Selector surface" value="MUI wrapped" tone="warning" />
        </Grid>
      </Grid>

      <ToolbarSurface>
        <Stack spacing={2}>
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5 }}>
            <TuneIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>
                Directory command bar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search by name, role, location, or operating domain; results route to editable profiles with validated contact fields.
              </Typography>
            </Box>
          </Box>
          <UserSearch
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
          />
        </Stack>
      </ToolbarSurface>

      <DataPanel
        title="People workspace"
        subtitle="Every row is a routed MUI list item with nested wrapped metadata for selector tests."
        actions={<StatusChip>{searchTerm ? `Query: ${searchTerm}` : 'All users'}</StatusChip>}
      >
          <List sx={{ bgcolor: 'background.paper' }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <UserRow 
                    user={user} 
                    onClick={() => handleUserClick(user.id)} 
                  />
                  {index < filteredUsers.length - 1 && 
                    <Divider variant="inset" component="li" />
                  }
                </React.Fragment>
              ))
            ) : (
              <EmptyResult />
            )}
          </List>
      </DataPanel>
    </AppSurface>
  );
};


export default UserList;
