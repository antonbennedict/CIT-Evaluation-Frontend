import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { createCriterion, deleteCriterion, updateCriterion } from '../../shared/api/adminApi';
import { getApiErrorMessage } from '../../shared/api/client';

const CriteriaManager = ({ criteria, loading, error, sharedGridSx, cardSurfaceSx }) => {
  const queryClient = useQueryClient();
  const [criterionDialogOpen, setCriterionDialogOpen] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [criterionForm, setCriterionForm] = useState({ title: '' });

  const saveCriterionMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? updateCriterion(id, payload) : createCriterion(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
      enqueueSnackbar(selectedCriterion ? 'Criterion updated.' : 'Criterion added.', { variant: 'success' });
      setCriterionDialogOpen(false);
      setSelectedCriterion(null);
      setCriterionForm({ title: '' });
    },
    onError: (err) => enqueueSnackbar(getApiErrorMessage(err, 'Unable to save criterion.'), { variant: 'error' }),
  });

  const removeCriterionMutation = useMutation({
    mutationFn: (id) => deleteCriterion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
      enqueueSnackbar('Criterion removed.', { variant: 'success' });
    },
    onError: (err) => enqueueSnackbar(getApiErrorMessage(err, 'Unable to delete criterion.'), { variant: 'error' }),
  });

  const openCriterionDialog = (item = null) => {
    setSelectedCriterion(item);
    setCriterionForm(item ? { title: item.title || '' } : { title: '' });
    setCriterionDialogOpen(true);
  };

  const columns = useMemo(
    () => [
      { field: 'title', headerName: 'Criterion', flex: 1.3, minWidth: 200 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 180,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openCriterionDialog(params.row)}>
              Edit
            </Button>
            <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => removeCriterionMutation.mutate(params.row.id)}>
              Delete
            </Button>
          </Stack>
        ),
      },
    ],
    [removeCriterionMutation]
  );

  return (
    <Paper elevation={0} sx={{ ...cardSurfaceSx, p: 2.5, borderColor: '#e2e8f0', mt: 1 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to load criteria. Ensure /api/admin/criteria is available.
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => openCriterionDialog()}>
          Add Criterion
        </Button>
      </Stack>
      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={criteria}
          columns={columns}
          getRowId={(row) => row._rowId || row.id}
          pageSizeOptions={[10, 20]}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={sharedGridSx}
        />
      </Box>

      <Dialog open={criterionDialogOpen} onClose={() => setCriterionDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedCriterion ? 'Edit Criterion' : 'Add Criterion'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={criterionForm.title} onChange={(e) => setCriterionForm((prev) => ({ ...prev, title: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriterionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => saveCriterionMutation.mutate({ id: selectedCriterion?.id, payload: criterionForm })} disabled={!criterionForm.title}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CriteriaManager;
