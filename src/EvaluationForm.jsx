import React, { useMemo, useState, useEffect } from 'react';
import {
  TextField, MenuItem, Box, Typography, Button, Paper,
  Stack, Chip, Divider, Alert, Stepper, Step, StepLabel,
  Card, CardContent, Slider, CircularProgress, Autocomplete,
  Fade, Zoom
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';
import { useQuery } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import {
  DEFAULT_CRITERIA,
  fetchHandshakeKey,
  fetchPublicCriteria,
  fetchPublicProfessors,
  submitEvaluation,
} from './shared/api/evaluationApi';
import { getApiErrorMessage } from './shared/api/client';

const UA_BLUE = '#003366';
const UA_GOLD = '#FFCC00';

const SECTIONS = ['1-A', '1-B', '1-C', '2-A', '2-B', '2-C', '3-A', '3-B', '4-A'];
const STEPS = ['Selection', 'Assessment', 'Secure Feedback'];

const EvaluationForm = ({ studentEmail }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    studentNumber: '',
    facultyEmail: '',
    section: '',
    rating: 7.5,
    comment: '',
  });
  const [criterionScores, setCriterionScores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handshakeStatus, setHandshakeStatus] = useState('idle'); // idle, performing, completed

  const { data: professorsData } = useQuery({
    queryKey: ['public-professors'],
    queryFn: fetchPublicProfessors,
    retry: 0,
  });

  const { data: criteriaData } = useQuery({
    queryKey: ['public-criteria'],
    queryFn: fetchPublicCriteria,
    retry: 0,
  });

  const professors = useMemo(() => Array.isArray(professorsData) ? professorsData : [], [professorsData]);
  const criteria = useMemo(() => Array.isArray(criteriaData) && criteriaData.length > 0 ? criteriaData : DEFAULT_CRITERIA, [criteriaData]);

  // Crypto Helpers (Preserving your existing logic)
  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSend = async () => {
    setIsSubmitting(true);
    setHandshakeStatus('performing');
    
    try {
      // 1. Fetch Server Public Key (Handshake Start)
      const keyData = await fetchHandshakeKey();
      const serverKeyData = base64ToArrayBuffer(keyData);

      // 2. Generate Student Key Pair (ECDH)
      const studentKeyPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey']
      );

      // 3. Import Server Public Key
      const serverPubKey = await window.crypto.subtle.importKey(
        'spki',
        serverKeyData,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        []
      );

      // 4. Derive Shared Secret
      const sharedSecret = await window.crypto.subtle.deriveKey(
        { name: 'ECDH', public: serverPubKey },
        studentKeyPair.privateKey,
        { name: 'AES-GCM', length: 128 },
        false,
        ['encrypt']
      );

      // 5. Encrypt Comment
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        sharedSecret,
        new TextEncoder().encode(formData.comment)
      );

      const studentPubKeyExport = await window.crypto.subtle.exportKey('spki', studentKeyPair.publicKey);

      const scores = criteria.map((c) => ({
        criterionId: c.id,
        score: Math.round(criterionScores[c.id] ?? 5),
      }));

      const payload = {
        studentNumber: formData.studentNumber,
        facultyEmail: formData.facultyEmail,
        section: formData.section,
        rating: formData.rating,
        studentEmail: studentEmail || '',
        ciphertext: arrayBufferToBase64(encryptedData),
        studentPublicKey: arrayBufferToBase64(studentPubKeyExport),
        iv: arrayBufferToBase64(iv),
        scores: scores,
      };

      await submitEvaluation(payload);
      setHandshakeStatus('completed');
      enqueueSnackbar('Success! Evaluation submitted anonymously.', { variant: 'success' });
      
      // Reset after a delay
      setTimeout(() => {
        setActiveStep(0);
        setFormData({ studentNumber: '', facultyEmail: '', section: '', rating: 7.5, comment: '' });
        setCriterionScores({});
        setIsSubmitting(false);
        setHandshakeStatus('idle');
      }, 2000);

    } catch (err) {
      setIsSubmitting(false);
      setHandshakeStatus('idle');
      enqueueSnackbar(getApiErrorMessage(err, 'Submission failed.'), { variant: 'error' });
    }
  };

  const isStep1Valid = formData.studentNumber && formData.facultyEmail && formData.section;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      {/* Header Card */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          mb: 4, 
          background: `linear-gradient(135deg, ${UA_BLUE} 0%, #001a33 100%)`,
          color: 'white',
          borderBottom: `4px solid ${UA_GOLD}`,
          textAlign: 'center'
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <SchoolIcon sx={{ fontSize: 40, color: UA_GOLD, mb: 1 }} />
          <Typography variant="h4" fontWeight={900}>Faculty Evaluation</Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            Your feedback is private, anonymous, and secured by Diffie-Hellman encryption.
          </Typography>
        </Stack>
      </Paper>

      {/* Stepper */}
      <Box sx={{ mb: 5, px: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label) => (
            <Step key={label} sx={{ 
              '& .MuiStepLabel-label.Mui-active': { color: UA_BLUE, fontWeight: 800 },
              '& .MuiStepIcon-root.Mui-active': { color: UA_BLUE },
              '& .MuiStepIcon-root.Mui-completed': { color: '#2e7d32' }
            }}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form Content */}
      <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          
          {/* STEP 1: Selection */}
          {activeStep === 0 && (
            <Fade in={activeStep === 0}>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={800} color={UA_BLUE}>
                  1. Identification & Faculty Selection
                </Typography>
                <TextField
                  fullWidth
                  label="Student Number"
                  placeholder="e.g. 2023-12345"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                />
                <Autocomplete
                  options={professors}
                  getOptionLabel={(option) => option.name || option.email}
                  renderInput={(params) => <TextField {...params} label="Select Professor" />}
                  onChange={(_, newValue) => setFormData({ ...formData, facultyEmail: newValue?.email || '' })}
                />
                <TextField
                  select
                  fullWidth
                  label="Your Section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                >
                  {SECTIONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
                
                <Box sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    disabled={!isStep1Valid}
                    onClick={handleNext}
                    sx={{ bgcolor: UA_BLUE, px: 4, py: 1.2, borderRadius: 2 }}
                  >
                    Continue to Assessment
                  </Button>
                </Box>
              </Stack>
            </Fade>
          )}

          {/* STEP 2: Assessment */}
          {activeStep === 1 && (
            <Fade in={activeStep === 1}>
              <Stack spacing={4}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color={UA_BLUE}>
                    2. Performance Metrics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rate the professor on a scale of 1 to 10 for each criterion.
                  </Typography>
                </Box>

                {criteria.map((c) => (
                  <Box key={c.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700}>{c.title}</Typography>
                      <Chip 
                        label={criterionScores[c.id] || 5} 
                        size="small" 
                        sx={{ bgcolor: UA_BLUE, color: 'white', fontWeight: 800 }} 
                      />
                    </Stack>
                    <Slider
                      value={criterionScores[c.id] || 5}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      onChange={(_, value) => setCriterionScores({ ...criterionScores, [c.id]: value })}
                      sx={{ color: UA_BLUE }}
                    />
                  </Box>
                ))}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleNext}
                    sx={{ bgcolor: UA_BLUE, px: 4, py: 1.2, borderRadius: 2 }}
                  >
                    Provide Comments
                  </Button>
                </Box>
              </Stack>
            </Fade>
          )}

          {/* STEP 3: Secure Feedback */}
          {activeStep === 2 && (
            <Fade in={activeStep === 2}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color={UA_BLUE}>
                    3. Secure Feedback
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your comment will be encrypted locally before being transmitted to our servers.
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Your feedback (Anonymous)"
                  placeholder="Share your experience with this professor..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  variant="outlined"
                  sx={{ bgcolor: '#fcfcfc' }}
                />

                {/* Handshake Visualizer */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2.5, 
                    borderRadius: 3, 
                    bgcolor: handshakeStatus === 'completed' ? '#f0fdf4' : '#f8fafc',
                    border: handshakeStatus === 'completed' ? '1px solid #bcf0da' : '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}
                >
                  {handshakeStatus === 'idle' && (
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                      <SecurityIcon color="primary" />
                      <Typography variant="body2" fontWeight={600}>
                        Ready for Diffie-Hellman Handshake
                      </Typography>
                    </Stack>
                  )}

                  {handshakeStatus === 'performing' && (
                    <Stack spacing={1.5} alignItems="center">
                      <CircularProgress size={24} sx={{ color: UA_BLUE }} />
                      <Typography variant="body2" fontWeight={700} color={UA_BLUE}>
                        Establishing Secure Key Exchange...
                      </Typography>
                    </Stack>
                  )}

                  {handshakeStatus === 'completed' && (
                    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                      <CheckCircleIcon color="success" />
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        Encrypted & Submitted Successfully
                      </Typography>
                    </Stack>
                  )}
                </Paper>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                  <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                    disabled={!formData.comment || isSubmitting}
                    onClick={handleSend}
                    sx={{ 
                      bgcolor: UA_GOLD, 
                      color: UA_BLUE, 
                      px: 5, 
                      py: 1.5, 
                      borderRadius: 2,
                      fontWeight: 800,
                      '&:hover': { bgcolor: '#e6b800' }
                    }}
                  >
                    {isSubmitting ? 'Encrypting...' : 'Secure Submission'}
                  </Button>
                </Box>
              </Stack>
            </Fade>
          )}
        </CardContent>
      </Card>
      
      {/* Privacy Badge */}
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mt: 4, opacity: 0.6 }}>
        <ShieldIcon fontSize="small" />
        <Typography variant="caption" fontWeight={600}>
          End-to-End Encrypted evaluation session.
        </Typography>
      </Stack>
    </Box>
  );
};

export default EvaluationForm;
