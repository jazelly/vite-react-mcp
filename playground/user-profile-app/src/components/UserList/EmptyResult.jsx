import React from 'react';
import { ListItem, ListItemAvatar, ListItemText, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const EmptyResult = () => {
  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar>
          <PersonIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary="No users found"
        secondary="Try adjusting your search criteria"
      />
    </ListItem>
  );
};


export default EmptyResult;