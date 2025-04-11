import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  Divider,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserSearch from './UserSearch';
import UserRow from './UserRow';
import EmptyResult from './EmptyResult';
import { mockUsers } from './mockData';

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const filteredUsers = mockUsers.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.occupation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          User Directory
        </Typography>
        
        <Paper elevation={3} sx={{ mb: 4 }}>
          <UserSearch 
            searchTerm={searchTerm}
            handleSearchChange={handleSearchChange}
          />
          
          <Divider />
          
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
        </Paper>
      </Box>
    </Container>
  );
};


export default UserList;