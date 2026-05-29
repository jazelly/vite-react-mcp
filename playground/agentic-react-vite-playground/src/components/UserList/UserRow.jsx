import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlaceIcon from '@mui/icons-material/Place';
import LabeledValue from '../Common/LabeledValue';

const UserRow = ({ user, onClick }) => {
  return (
    <ListItem
      alignItems="flex-start"
      button
      onClick={onClick}
      secondaryAction={<ChevronRightIcon color="action" />}
      sx={{
        px: 2.5,
        py: 2,
        transition: 'background-color 0.2s, transform 0.2s',
        '&:hover': {
          backgroundColor: 'rgba(15, 118, 110, 0.06)',
          transform: 'translateX(2px)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: 'primary.main',
            boxShadow: '0 12px 24px rgba(15, 118, 110, 0.18)',
            height: 48,
            width: 48,
          }}
        >
          {user.firstName[0]}{user.lastName[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Box component="span" sx={{ fontWeight: 800 }}>
              {user.firstName} {user.lastName}
            </Box>
            <Chip label="Active" size="small" color="success" variant="outlined" />
          </Stack>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.75, sm: 3 }}>
              <LabeledValue
                idBase={`user-${user.id}-occupation`}
                label={<><ApartmentIcon fontSize="inherit" /> Role</>}
                value={user.occupation}
                labelStyle={{ alignItems: 'center', display: 'flex', gap: '4px', fontSize: '0.72rem' }}
                valueStyle={{ marginTop: '0', fontSize: '0.9rem', fontWeight: 700 }}
              />
              <LabeledValue
                idBase={`user-${user.id}-location`}
                label={<><PlaceIcon fontSize="inherit" /> Location</>}
                value={user.location}
                labelStyle={{ alignItems: 'center', display: 'flex', gap: '4px', fontSize: '0.72rem' }}
                valueStyle={{ marginTop: '0', fontSize: '0.9rem', fontWeight: 700 }}
              />
            </Stack>
          </Box>
        }
      />
    </ListItem>
  );
};

export default UserRow;
