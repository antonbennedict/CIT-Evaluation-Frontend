import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  fetchCriteria,
  fetchEvaluationsAdmin,
  fetchProfessors,
} from './shared/api/adminApi';
import { getApiErrorMessage } from './shared/api/client';

import EvaluationTable from './components/admin/EvaluationTable';
import ProfessorManager from './components/admin/ProfessorManager';
import CriteriaManager from './components/admin/CriteriaManager';

const AdminDashboard = ({ adminToken }) => {
  const token = adminToken || sessionStorage.getItem('adminToken');

  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');

  const {
    data: evaluations = [],
    isLoading: evaluationsLoading,
    refetch: refetchEvaluations,
  } = useQuery({
    queryKey: ['admin-evaluations'],
    queryFn: fetchEvaluationsAdmin,
    enabled: Boolean(token),
    onError: (err) => setError(getApiErrorMessage(err, 'Unable to load evaluations.')),
  });

  const {
    data: professors = [],
    isLoading: professorsLoading,
    isError: professorsError,
    refetch: refetchProfessors,
  } = useQuery({
    queryKey: ['admin-professors'],
    queryFn: fetchProfessors,
    enabled: Boolean(token), // Load immediately for stats
    retry: false,
    onError: (err) => setError(getApiErrorMessage(err, 'Unable to load professors.')),
  });

  const {
    data: criteria = [],
    isLoading: criteriaLoading,
    isError: criteriaError,
    refetch: refetchCriteria,
  } = useQuery({
    queryKey: ['admin-criteria'],
    queryFn: fetchCriteria,
    enabled: Boolean(token), // Load immediately for stats
    retry: false,
    onError: (err) => setError(getApiErrorMessage(err, 'Unable to load criteria.')),
  });

  const withStableRowIds = (rows, prefix) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((row, index) => ({
      ...row,
      _rowId: row?.id ?? row?._id ?? `${prefix}-${index}`,
      id: row?.id ?? row?._id ?? `${prefix}-${index}`,
    }));
  };

  const evaluationRows = useMemo(() => withStableRowIds(evaluations, 'evaluation'), [evaluations]);
  const professorRows = useMemo(() => withStableRowIds(professors, 'professor'), [professors]);
  const criteriaRows = useMemo(() => withStableRowIds(criteria, 'criterion'), [criteria]);

  const summaryStats = useMemo(
    () => [
      { label: 'Encrypted Feedback', value: evaluationRows.length, detail: 'Stored submissions' },
      { label: 'Faculty Accounts', value: professorRows.length, detail: 'Managed professors' },
      { label: 'Evaluation Criteria', value: criteriaRows.length, detail: 'Active metrics' },
    ],
    [evaluationRows.length, professorRows.length, criteriaRows.length]
  );

  const sharedGridSx = {
    backgroundColor: '#fff',
    borderRadius: 2.5,
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: '#f4f6fb',
      borderBottom: '1px solid #e2e8f0',
      color: '#1e293b',
    },
    '& .MuiDataGrid-cell': {
      borderBottom: '1px solid #edf2f7',
    },
    '& .MuiDataGrid-row:hover': {
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
    },
    '& .MuiDataGrid-footerContainer': {
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#fff',
    },
  };

  const cardSurfaceSx = {
    borderRadius: 3,
    border: '1px solid rgba(15, 23, 42, 0.08)',
    backgroundColor: '#fff',
    boxShadow: '0 32px 60px rgba(15, 23, 42, 0.08)',
  };

  const isRefreshing = activeTab === 0 ? evaluationsLoading : activeTab === 1 ? professorsLoading : criteriaLoading;
  const refreshButtonLabel = isRefreshing ? 'Refreshing...' : 'Refresh';

  const handleRefresh = () => {
    if (activeTab === 0) return refetchEvaluations();
    if (activeTab === 1) return refetchProfessors();
    if (activeTab === 2) return refetchCriteria();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid #dfe3ec' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="primary.main">Admin Control Center</Typography>
            <Typography variant="body2" color="text.secondary">Manage encrypted evaluations, professors, and criteria.</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip icon={<LockIcon />} label="Encrypted by default" color="success" variant="outlined" />
            <Button
              startIcon={<RefreshIcon />}
              endIcon={isRefreshing ? <CircularProgress size={16} color="inherit" /> : null}
              variant="outlined"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {refreshButtonLabel}
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={3} sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            flexWrap="wrap"
            justifyContent="space-between"
          >
            {summaryStats.map((stat) => (
              <Paper key={stat.label} elevation={0} sx={{ ...cardSurfaceSx, flex: '1 1 180px', minWidth: 180, p: 2.25 }}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ mt: 0.25 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.detail}
                </Typography>
              </Paper>
            ))}
          </Stack>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            TabIndicatorProps={{ sx: { backgroundColor: 'secondary.main', height: 3, borderRadius: 2 } }}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
              },
            }}
          >
            <Tab label="Evaluations" />
            <Tab label="Professors" />
            <Tab label="Criteria" />
          </Tabs>
        </Stack>

        {activeTab === 0 && (
          <EvaluationTable
            evaluations={evaluationRows}
            loading={evaluationsLoading}
            sharedGridSx={sharedGridSx}
            cardSurfaceSx={cardSurfaceSx}
          />
        )}

        {activeTab === 1 && (
          <ProfessorManager
            professors={professorRows}
            loading={professorsLoading}
            error={professorsError}
            sharedGridSx={sharedGridSx}
            cardSurfaceSx={cardSurfaceSx}
          />
        )}

        {activeTab === 2 && (
          <CriteriaManager
            criteria={criteriaRows}
            loading={criteriaLoading}
            error={criteriaError}
            sharedGridSx={sharedGridSx}
            cardSurfaceSx={cardSurfaceSx}
          />
        )}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
