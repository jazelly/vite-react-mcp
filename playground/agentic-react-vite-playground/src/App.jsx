import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { UserProfile, UserList } from './components';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { UserProvider } from './context/UserContext';

const theme = createTheme({
  shape: {
    borderRadius: 8,
  },
  palette: {
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    primary: {
      main: '#0f766e',
    },
    secondary: {
      main: '#7c3aed',
    },
    success: {
      main: '#15803d',
    },
    warning: {
      main: '#b45309',
    },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h3: {
      fontSize: 'clamp(2rem, 4vw, 3.2rem)',
      fontWeight: 800,
      letterSpacing: 0,
      lineHeight: 1,
    },
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    button: {
      fontWeight: 800,
      letterSpacing: 0,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const App = function () {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/users" element={<UserList />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/" element={<Navigate to="/users" replace />} />
              <Route path="*" element={<Navigate to="/users" replace />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
// For babel test
