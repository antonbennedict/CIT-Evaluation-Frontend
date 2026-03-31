import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiClient } from './shared/api/client';
import { decryptEvaluation } from './shared/api/adminApi';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
    Rating,
    Avatar
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';

const FacultyDashboard = ({ facultyEmail }) => {
    const [evals, setEvals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [decrypting, setDecrypting] = useState(false);
    const [error, setError] = useState('');

    // UA Branding Colors
    const UA_BLUE = '#003366';
    const UA_GOLD = '#FFCC00';

    const fetchAndDecryptEvaluations = useCallback(async () => {
        if (!facultyEmail) {
            setError('Faculty email is unavailable. Please log in again.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            // 1. Fetch the evaluations
            const res = await apiClient.get('/api/evaluations', {
                params: { facultyEmail: facultyEmail }
            });
            
            const rawEvals = Array.isArray(res.data) ? res.data : [];
            setEvals(rawEvals);
            setLoading(false);

            // 2. Automatically trigger decryption for all messages
            if (rawEvals.length > 0) {
                setDecrypting(true);
                const decryptedResults = await Promise.all(
                    rawEvals.map(async (ev) => {
                        try {
                            // Call the same decryption service used by Admin
                            const decryptedText = await decryptEvaluation(ev.id);
                            return { ...ev, decryptedComment: decryptedText };
                        } catch (err) {
                            console.error(`Failed to decrypt ID ${ev.id}:`, err);
                            return { ...ev, decryptedComment: "[Decryption Error]" };
                        }
                    })
                );
                setEvals(decryptedResults);
                setDecrypting(false);
            }
        } catch (err) {
            console.error("Evaluation fetch error:", err);
            setError('Unable to load evaluations. Please check your connection.');
            setLoading(false);
        }
    }, [facultyEmail]);

    useEffect(() => {
        fetchAndDecryptEvaluations();
    }, [fetchAndDecryptEvaluations]);

    const stats = useMemo(() => {
        if (evals.length === 0) return { avg: 0, count: 0 };
        const sum = evals.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        return {
            avg: (sum / evals.length).toFixed(1),
            count: evals.length
        };
    }, [evals]);

    return (
        <Box sx={{ py: 2 }}>
            {/* UA Header with Logo Placeholder */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 3, 
                    borderRadius: 4, 
                    mb: 4, 
                    background: `linear-gradient(135deg, ${UA_BLUE} 0%, #001a33 100%)`,
                    color: 'white',
                    borderBottom: `4px solid ${UA_GOLD}`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Pattern Background */}
                <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, transform: 'rotate(15deg)' }}>
                    <AssessmentIcon sx={{ fontSize: 200 }} />
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
                    <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar 
                            sx={{ 
                                width: 80, 
                                height: 80, 
                                bgcolor: 'white', 
                                p: 1, 
                                border: `2px solid ${UA_GOLD}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            src="https://www.ua.edu.ph/wp-content/uploads/2023/04/UA-Logo-New.png" // UA Logo URL
                        >
                            UA
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.02em' }}>
                                Faculty Portal
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                                University of the Assumption
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                Logged in as: <b>{facultyEmail}</b>
                            </Typography>
                        </Box>
                    </Stack>
                    
                    <Button 
                        startIcon={<RefreshIcon />} 
                        variant="contained" 
                        onClick={fetchAndDecryptEvaluations}
                        sx={{ 
                            borderRadius: 2, 
                            fontWeight: 800, 
                            bgcolor: UA_GOLD, 
                            color: UA_BLUE,
                            '&:hover': { bgcolor: '#e6b800' },
                            px: 3
                        }}
                    >
                        Refresh Results
                    </Button>
                </Stack>
            </Paper>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' } }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Box sx={{ p: 1, bgcolor: 'rgba(0, 51, 102, 0.08)', borderRadius: 2 }}>
                                    <AssessmentIcon color="primary" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>Performance Score</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight={900} color={UA_BLUE}>
                                {stats.avg} <Typography component="span" variant="h5" color="text.secondary">/ 10</Typography>
                            </Typography>
                            <Rating value={parseFloat(stats.avg) / 2} precision={0.1} readOnly sx={{ mt: 1 }} />
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #e2e8f0', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 24px rgba(0,0,0,0.08)' } }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Box sx={{ p: 1, bgcolor: 'rgba(217, 119, 6, 0.08)', borderRadius: 2 }}>
                                    <ChatBubbleOutlineIcon color="secondary" />
                                </Box>
                                <Typography variant="h6" fontWeight={700}>Student Participation</Typography>
                            </Stack>
                            <Typography variant="h2" fontWeight={900} color="secondary.main">
                                {stats.count}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Validated evaluations submitted this semester
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 4, height: '100%', bgcolor: '#f8fafc', border: `1px dashed ${UA_BLUE}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                <SecurityIcon color="success" />
                                <Typography variant="subtitle2" fontWeight={800} color="success.main">
                                    Privacy Policy Enabled
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                Diffie-Hellman Shared Secret is used to automatically decrypt student feedback for your viewing. 
                                <b> Student identities remain hidden to ensure honest feedback.</b>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Feedback Feed */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3, px: 1 }}>
                <VisibilityIcon sx={{ color: UA_BLUE }} />
                <Typography variant="h5" fontWeight={800} sx={{ color: UA_BLUE }}>
                    Detailed Student Feedback
                </Typography>
                {decrypting && <CircularProgress size={20} sx={{ ml: 2 }} />}
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
                    <CircularProgress size={60} thickness={4} sx={{ color: UA_BLUE }} />
                    <Typography sx={{ mt: 2 }} color="text.secondary" fontWeight={600}>Fetching evaluations...</Typography>
                </Box>
            ) : evals.length === 0 ? (
                <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '1px dashed #e2e8f0', bgcolor: 'white' }}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="h5" color="text.secondary" fontWeight={700}>No entries found</Typography>
                    <Typography variant="body1" color="text.disabled">Your students haven't submitted any evaluations yet.</Typography>
                </Paper>
            ) : (
                <Stack spacing={2.5}>
                    {evals.map((ev, index) => (
                        <Card key={ev.id || index} sx={{ borderRadius: 4, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                            <Box sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: '#f1f5f9', color: UA_BLUE }}>
                                            <LockIcon size="small" />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={800} color={UA_BLUE}>
                                                Anonymous Participant
                                            </Typography>
                                            <Typography variant="caption" sx={{ bgcolor: 'rgba(0, 51, 102, 0.05)', px: 1, py: 0.3, borderRadius: 1, fontWeight: 700 }}>
                                                Section: {ev.section}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="h5" fontWeight={900} color={UA_BLUE}>
                                            {ev.rating}
                                            <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>/10</Typography>
                                        </Typography>
                                        <Rating value={ev.rating / 2} size="small" readOnly />
                                    </Box>
                                </Stack>
                                
                                <Paper 
                                    elevation={0} 
                                    sx={{ 
                                        mt: 2.5, 
                                        p: 2.5, 
                                        bgcolor: '#f8fafc', 
                                        borderRadius: 3,
                                        borderLeft: `5px solid ${UA_GOLD}`,
                                        position: 'relative'
                                    }}
                                >
                                    <Typography variant="body1" sx={{ fontStyle: 'italic', color: '#1e293b', lineHeight: 1.7, fontSize: '1.05rem' }}>
                                        "{ev.decryptedComment || (decrypting ? "Decrypting message..." : ev.ciphertext) || 'No comment provided.'}"
                                    </Typography>
                                </Paper>
                            </Box>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    );
};

export default FacultyDashboard;
