import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Button, Typography, Box, Chip, Container 
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

const AdminDashboard = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [decrypted, setDecrypted] = useState({});

  const fetchAll = () => {
    axios.get('http://localhost:8080/api/evaluations/admin/all')
      .then(res => setEvaluations(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDecrypt = async (id) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/evaluations/${id}/decrypt`);
      setDecrypted(prev => ({ ...prev, [id]: res.data }));
    } catch (err) {
      // If the tag mismatch happens, we show a friendlier message
      setDecrypted(prev => ({ ...prev, [id]: "Error: Server keys reset. Cannot decrypt old data." }));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
          System Audit Dashboard
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><b>Student ID</b></TableCell>
                <TableCell><b>Faculty</b></TableCell>
                <TableCell><b>Section</b></TableCell>
                <TableCell><b>Rating</b></TableCell>
                <TableCell><b>Feedback (Encrypted)</b></TableCell>
                <TableCell align="center"><b>Action</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluations.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.studentNumber}</TableCell>
                  <TableCell>{row.facultyEmail}</TableCell>
                  <TableCell>{row.section}</TableCell>
                  <TableCell>
                    <Chip label={row.rating} color={row.rating >= 7.5 ? "success" : "warning"} size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, color: decrypted[row.id] ? 'black' : 'text.disabled' }}>
                    {decrypted[row.id] || "••••••••••••"}
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<LockOpenIcon />}
                      onClick={() => handleDecrypt(row.id)}
                      disabled={!!decrypted[row.id]}
                    >
                      Decrypt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;