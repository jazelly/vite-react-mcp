import React, { createContext, useState, useContext } from 'react';

// Mock data
const initialUsers = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    bio: 'Software developer with a passion for React and UI/UX design.',
    location: 'San Francisco, CA',
    occupation: 'Senior Frontend Developer'
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 987-6543',
    bio: 'Full stack developer specialized in Node.js and React.',
    location: 'New York, NY',
    occupation: 'Full Stack Developer'
  },
  {
    id: 3,
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    phone: '(555) 555-5555',
    bio: 'UX designer with 5 years of experience in mobile and web applications.',
    location: 'Austin, TX',
    occupation: 'UX Designer'
  },
  {
    id: 4,
    firstName: 'Sarah',
    lastName: 'Williams',
    email: 'sarah.w@example.com',
    phone: '(555) 222-3333',
    bio: 'Project manager with a background in software development.',
    location: 'Seattle, WA',
    occupation: 'Project Manager'
  },
  {
    id: 5,
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    phone: '(555) 444-9999',
    bio: 'DevOps engineer specializing in cloud infrastructure and CI/CD pipelines.',
    location: 'Chicago, IL',
    occupation: 'DevOps Engineer'
  }
];

// Create context
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState(initialUsers);

  const updateUser = (userId, updatedData) => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, ...updatedData } : user
    ));
  };

  const getUserById = (userId) => {
    return users.find(user => user.id === parseInt(userId)) || null;
  };

  const value = {
    users,
    updateUser,
    getUserById
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};