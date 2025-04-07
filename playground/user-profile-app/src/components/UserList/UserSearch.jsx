import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const UserSearch = ({ searchTerm, handleSearchChange }) => {
  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        placeholder="Search users..."
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

UserSearch.displayName = 'UserSearch$$mcp';

export default UserSearch;