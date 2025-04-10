import { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../context/UserContext';

export const useUserProfileData = (userId) => {
  const { getUserById, updateUser } = useUsers();

  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const userData = getUserById(userId);
    if (userData) {
      setProfileData(userData);
      setTempData({ ...userData });
      setIsLoading(false);
    }
    // Only include dependencies that, when changed, should re-run the effect.
    // navigate is stable, getUserById is likely stable from context.
  }, [userId, getUserById]);

  const handleEditToggle = useCallback(() => {
    // Ensure profileData exists before trying to access it
    if (profileData) {
      setTempData({ ...profileData });
      setEditMode((prev) => !prev);
    }
  }, [profileData]); // Depend on profileData

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setTempData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []); // No dependencies needed

  const handleSave = useCallback(() => {
    // Ensure profileData exists before trying to access id
    if (profileData) {
      const success = updateUser(profileData.id, tempData);
      if (success) {
        setProfileData({ ...tempData });
        setEditMode(false);
        return true; // Indicate success
      } else {
        // Handle potential update failure (e.g., show an error)
        console.error('Failed to update user');
        return false; // Indicate failure
      }
    }
    return false; // Indicate failure if profileData is null
  }, [profileData, tempData, updateUser]); // Depend on relevant state/functions

  const handleCancel = useCallback(() => {
    // Ensure profileData exists before trying to access it
    if (profileData) {
      setTempData({ ...profileData });
      setEditMode(false);
    }
  }, [profileData]); // Depend on profileData

  return {
    profileData,
    tempData,
    editMode,
    isLoading,
    handleEditToggle,
    handleInputChange,
    handleSave,
    handleCancel,
  };
};
