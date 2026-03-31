import React, { useCallback, useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import LogoutIcon from '@mui/icons-material/Logout';
import { createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import FacultyDashboard from './FacultyDashboard';
import EvaluationForm from './EvaluationForm';

const brandColors = {
  primary: '#0c4a8a',
  secondary: '#d97706',
  success: '#0f766e',
  error: '#dc2626',
  background: '#f3f7fb',
  paper: '#ffffff',
  border: '#e2e8f0',
  textPrimary: '#102a43',
  textSecondary: '#486581',
  muted: '#64748b',
};

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brandColors.primary },
    secondary: { main: brandColors.secondary },
    success: { main: brandColors.success },
    error: { main: brandColors.error },
    background: { default: brandColors.background, paper: brandColors.paper },
    text: { primary: brandColors.textPrimary, secondary: brandColors.textSecondary },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h1: { fontSize: '3rem', fontWeight: 800, lineHeight: 1.2 },
    h2: { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 },
    h3: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 },
    h4: { fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontSize: '1.5rem', fontWeight: 750 },
    h6: { fontSize: '1.25rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.9rem', lineHeight: 1.5, color: brandColors.textSecondary },
    button: { fontWeight: 700, textTransform: 'none' },
    caption: { fontSize: '0.75rem', color: brandColors.muted },
    overline: { fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  },
  spacing: 8,
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brandColors.background,
          color: brandColors.textPrimary,
          margin: 0,
          fontSmooth: 'antialiased',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${brandColors.border}`,
          boxShadow: '0 24px 45px rgba(15, 23, 42, 0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: brandColors.paper,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${brandColors.border}`,
        },
      },
    },
  },
});

const appTheme = responsiveFontSizes(baseTheme);

const createEmptySession = () => ({ role: null, email: '', token: '', avatar: '' });

const getStoredSession = () => {
  if (typeof window === 'undefined') {
    return createEmptySession();
  }

  const stored = window.sessionStorage.getItem('citEvalSession');
  if (!stored) return createEmptySession();

  try {
    return JSON.parse(stored);
  } catch {
    return createEmptySession();
  }
};

const App = () => {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (session.role) {
      window.sessionStorage.setItem('citEvalSession', JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem('citEvalSession');
    }
  }, [session]);

  const handleLogin = useCallback((role, email, token, avatar) => {
    if (typeof window !== 'undefined' && role !== 'ADMIN') {
      window.sessionStorage.removeItem('adminToken');
    }
    setSession({ role, email, token: token || '', avatar: avatar || '' });
  }, []);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('adminToken');
    }
    setSession(createEmptySession());
  }, []);

  const renderContent = () => {
    switch (session.role) {
      case 'ADMIN':
        return <AdminDashboard adminToken={session.token} />;
      case 'FACULTY':
        return <FacultyDashboard facultyEmail={session.email} />;
      case 'STUDENT':
        return <EvaluationForm studentEmail={session.email} />;
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  const sessionTitle =
    {
      ADMIN: 'Administrator Control Center',
      FACULTY: 'Faculty Portal',
      STUDENT: 'Student Evaluation Hub',
    }[session.role] ?? 'CIT Evaluation';

  const isAuthenticated = Boolean(session.role);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: { xs: 2, md: 4 } }}>
        {isAuthenticated ? (
          <>
            <Container maxWidth="lg">
              <Paper
                elevation={0}
                sx={{
                  mb: 3,
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  background: 'linear-gradient(138deg, rgba(12, 74, 138, 0.15), rgba(217, 119, 6, 0.12))',
                  border: '1px solid rgba(12, 74, 138, 0.25)',
                }}
              >
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={session.avatar} sx={{ bgcolor: 'primary.main', width: 56, height: 56, fontWeight: 700 }}>
                      {(session.email && session.email[0]?.toUpperCase()) || session.role?.charAt(0) || 'C'}
                    </Avatar>
                    <Box>
                      <Typography variant="overline" color="text.secondary" letterSpacing={1.2}>
                        Active Session
                      </Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">
                        {sessionTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.85 }}>
                        {session.email || 'No email provided'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label={session.role} variant="outlined" color="secondary" sx={{ fontWeight: 700 }} />
                    <Tooltip title="Sign out">
                      <IconButton onClick={handleLogout} size="large" sx={{ bgcolor: 'background.paper' }}>
                        <LogoutIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            </Container>
            <Container maxWidth="lg">{renderContent()}</Container>
          </>
        ) : (
          <Box>{renderContent()}</Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;