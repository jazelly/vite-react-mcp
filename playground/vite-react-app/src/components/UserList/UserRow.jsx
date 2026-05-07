import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Box
} from '@mui/material';
import LabeledValue from '../Common/LabeledValue';

const UserRow = ({ user, onClick }) => {
  return (
    <ListItem 
      alignItems="flex-start" 
      button 
      onClick={onClick}
      sx={{ 
        transition: 'background-color 0.3s',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {user.firstName[0]}{user.lastName[0]}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={`${user.firstName} ${user.lastName}`}
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <LabeledValue
              idBase={`user-${user.id}-occupation`}
              label="Role"
              value={user.occupation}
              labelStyle={{ fontSize: '0.7rem' }}
              valueStyle={{ marginTop: '0', fontSize: '0.85rem' }}
            />
            <LabeledValue
              idBase={`user-${user.id}-location`}
              label="Location"
              value={user.location}
              containerStyle={{ marginTop: '4px' }}
              labelStyle={{ fontSize: '0.7rem' }}
              valueStyle={{ marginTop: '0', fontSize: '0.85rem' }}
            />
          </Box>
        }
      />
    </ListItem>
  );
};

export default UserRow;
