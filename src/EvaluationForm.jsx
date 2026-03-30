import React, { useState } from 'react';
import axios from 'axios';
import { Buffer } from 'buffer';
import { TextField, MenuItem, Slider, Box, Typography, Button, Paper } from '@mui/material';

const SECTIONS = ["1-A", "1-B", "1-C", "2-A", "2-B", "2-C", "3-A", "3-B", "4-A"];
const FACULTIES = [
  { name: "Prof. Madalipay", email: "madalipay@ua.edu.ph" },
  { name: "Prof. Galang", email: "galang@ua.edu.ph" },
  { name: "Prof. Alonzo", email: "alonzo@ua.edu.ph" }
];

const EvaluationForm = ({ studentEmail }) => {
  const [formData, setFormData] = useState({
    studentNumber: '',
    facultyEmail: '',
    section: '',
    rating: 7.5,
    comment: ''
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.facultyEmail || !formData.section) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const keyRes = await axios.get('http://localhost:8080/api/keys/handshake');
      const serverKeyData = Buffer.from(keyRes.data, 'base64');
      const studentKeyPair = await window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
      const serverPubKey = await window.crypto.subtle.importKey("spki", serverKeyData, { name: "ECDH", namedCurve: "P-256" }, false, []);
      const sharedSecret = await window.crypto.subtle.deriveKey({ name: "ECDH", public: serverPubKey }, studentKeyPair.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, sharedSecret, new TextEncoder().encode(formData.comment));
      const studentPubKeyExport = await window.crypto.subtle.exportKey("spki", studentKeyPair.publicKey);

      const payload = {
        studentNumber: formData.studentNumber,
        facultyEmail: formData.facultyEmail,
        section: formData.section,
        rating: formData.rating,
        ciphertext: Buffer.from(encryptedData).toString('base64'),
        studentPublicKey: Buffer.from(studentPubKeyExport).toString('base64'),
        iv: Buffer.from(iv).toString('base64')
      };

      await axios.post('http://localhost:8080/api/evaluations', payload);
      alert("Success! Evaluation submitted anonymously.");
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting evaluation.");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>Faculty Evaluation</Typography>
      
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
        <TextField label="Student ID" fullWidth required onChange={e => setFormData({...formData, studentNumber: e.target.value})} />

        <TextField select label="Your Section" value={formData.section} fullWidth required onChange={e => setFormData({...formData, section: e.target.value})}>
          {SECTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>

        <TextField select label="Faculty to Evaluate" value={formData.facultyEmail} fullWidth required onChange={e => setFormData({...formData, facultyEmail: e.target.value})}>
          {FACULTIES.map(f => <MenuItem key={f.email} value={f.email}>{f.name}</MenuItem>)}
        </TextField>

        <Box>
          <Typography gutterBottom>Rating: <b>{formData.rating} / 10</b></Typography>
          <Slider value={formData.rating} min={0} max={10} step={0.1} valueLabelDisplay="auto" onChange={(e, val) => setFormData({...formData, rating: val})} />
        </Box>

        <TextField label="Confidential Feedback" multiline rows={3} fullWidth required onChange={e => setFormData({...formData, comment: e.target.value})} />

        <Button variant="contained" size="large" onClick={handleSend} sx={{ py: 1.5 }}>Submit Encrypted Form</Button>
      </Box>
    </Paper>
  );
};

export default EvaluationForm;