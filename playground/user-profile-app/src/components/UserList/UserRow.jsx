import React from 'react';
import { 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Typography 
} from '@mui/material';

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
          <React.Fragment>
            <Typography
              sx={{ display: 'block' }}
              component="span"
              variant="body2"
              color="text.primary"
            >
              {user.occupation}
            </Typography>
            {user.location}
          </React.Fragment>
        }
      />
    </ListItem>
  );
};

UserRow.displayName = 'UserRow$$mcp';

export default UserRow;