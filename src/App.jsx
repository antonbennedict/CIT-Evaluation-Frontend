import React, { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import Login from './Login';
import EvaluationForm from './EvaluationForm';
import FacultyDashboard from './FacultyDashboard';
import AdminDashboard from './AdminDashboard';

const theme = createTheme({
  palette: {
    primary: { main: '#004a99' }, // UA Blue
    secondary: { main: '#fbc02d' }, // UA Gold
    background: { default: '#f4f6f8' }
  },
  typography: { fontFamily: 'Roboto, Arial, sans-serif' }
});

function App() {
  const [user, setUser] = useState(null); // { role, email }
  const CLIENT_ID = "412778302941-hdsq9o9c3j4de2af3vbcsrfh6647v7c2.apps.googleusercontent.com";

  const handleLogout = () => setUser(null);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {user && (
          <AppBar position="static" elevation={0}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>UA CIT-EVAL</Typography>
              <Box sx={{ textAlign: 'right', mr: 2 }}>
                <Typography variant="caption" display="block" sx={{ lineHeight: 1 }}>Logged in as:</Typography>
                <Typography variant="body2" fontWeight="bold">{user.email}</Typography>
              </Box>
              <Button color="inherit" onClick={handleLogout} variant="outlined" size="small">Logout</Button>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ minHeight: '100vh', py: 4 }}>
          {!user ? (
            <Login onLogin={(role, email) => setUser({ role, email })} />
          ) : (
            <Container>
              {user.role === 'STUDENT' && <EvaluationForm studentEmail={user.email} />}
              {user.role === 'FACULTY' && <FacultyDashboard facultyEmail={user.email} />}
              {user.role === 'ADMIN' && <AdminDashboard />}
            </Container>
          )}
        </Box>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;