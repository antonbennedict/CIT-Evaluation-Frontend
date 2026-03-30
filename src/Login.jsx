import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { Container, Paper, Typography, Box, Divider, TextField, Button } from '@mui/material';
import LockPersonIcon from '@mui/icons-material/LockPerson';

const Login = ({ onLogin }) => {
  const [adminView, setAdminView] = useState(false);
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });

  const onSuccess = (res) => {
    const decoded = jwtDecode(res.credential);
    if (decoded.email.endsWith("@ua.edu.ph")) {
      const isFaculty = decoded.email.includes('faculty') || decoded.email.includes('prof');
      onLogin(isFaculty ? 'FACULTY' : 'STUDENT', decoded.email);
    } else {
      alert("Unauthorized: Please use your @ua.edu.ph GSuite account.");
    }
  };

  const handleAdminAuth = () => {
    if (adminCreds.user === 'admin' && adminCreds.pass === 'root') {
      onLogin('ADMIN', 'admin@system');
    } else {
      alert("Invalid Admin Credentials");
    }
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, textAlign: 'center', mt: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">CIT-EVAL Login</Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>University of the Assumption</Typography>

        {!adminView ? (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <GoogleLogin onSuccess={onSuccess} onError={() => alert("Login Failed")} />
            </Box>
            <Divider sx={{ my: 2 }}>System Audit</Divider>
            <Button startIcon={<LockPersonIcon />} size="small" onClick={() => setAdminView(true)}>
              Administrator Portal
            </Button>
          </Box>
        ) : (
          <Box>
            <TextField fullWidth label="Username" margin="normal" size="small" 
              onChange={e => setAdminCreds({...adminCreds, user: e.target.value})} />
            <TextField fullWidth label="Password" type="password" margin="normal" size="small"
              onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})} />
            <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleAdminAuth}>Login as Admin</Button>
            <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => setAdminView(false)}>Back</Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Login;