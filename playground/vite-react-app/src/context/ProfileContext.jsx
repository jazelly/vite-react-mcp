// ProfileContext.js
import React, { createContext, useContext } from 'react';
import { useUserProfileData } from '../hooks/useUserProfileData';

const ProfileContext = createContext();

export const ProfileProvider = ({ userId, children }) => {
  const profileData = useUserProfileData(userId);
  
  return (
    <ProfileContext.Provider value={profileData}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};