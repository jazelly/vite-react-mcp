import React from 'react';
import { InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const UserSearch = ({ searchTerm, handleSearchChange }) => {
  return (
    <TextField
      fullWidth
      label="Search users"
      placeholder="Try developer, Austin, or DevOps"
      variant="outlined"
      value={searchTerm}
      onChange={handleSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="primary" />
          </InputAdornment>
        ),
      }}
    />
  );
};


export default UserSearch;
