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
import { createProfessor, deleteProfessor, updateProfessor } from '../../shared/api/adminApi';
import { getApiErrorMessage } from '../../shared/api/client';

const DEFAULT_PROFESSOR_FORM = { name: '', email: '', department: '', isActive: true };

const ProfessorManager = ({ professors, loading, error, sharedGridSx, cardSurfaceSx }) => {
  const queryClient = useQueryClient();
  const [profDialogOpen, setProfDialogOpen] = useState(false);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [professorForm, setProfessorForm] = useState(DEFAULT_PROFESSOR_FORM);

  const saveProfessorMutation = useMutation({
    mutationFn: ({ id, payload }) => (id ? updateProfessor(id, payload) : createProfessor(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professors'] });
      enqueueSnackbar(selectedProfessor ? 'Professor updated.' : 'Professor added.', { variant: 'success' });
      setProfDialogOpen(false);
      setSelectedProfessor(null);
      setProfessorForm(DEFAULT_PROFESSOR_FORM);
    },
    onError: (err) => enqueueSnackbar(getApiErrorMessage(err, 'Unable to save professor.'), { variant: 'error' }),
  });

  const removeProfessorMutation = useMutation({
    mutationFn: (id) => deleteProfessor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professors'] });
      enqueueSnackbar('Professor removed.', { variant: 'success' });
    },
    onError: (err) => enqueueSnackbar(getApiErrorMessage(err, 'Unable to delete professor.'), { variant: 'error' }),
  });

  const openProfessorDialog = (item = null) => {
    setSelectedProfessor(item);
    setProfessorForm(item ? {
      name: item.name || '',
      email: item.email || '',
      department: item.department || '',
      isActive: item.isActive ?? true,
    } : DEFAULT_PROFESSOR_FORM);
    setProfDialogOpen(true);
  };

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Professor Name', flex: 1.2, minWidth: 160 },
      { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
      { field: 'department', headerName: 'Department', flex: 1, minWidth: 150 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 200,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openProfessorDialog(params.row)}>
              Edit
            </Button>
            <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => removeProfessorMutation.mutate(params.row.id)}>
              Delete
            </Button>
          </Stack>
        ),
      },
    ],
    [removeProfessorMutation]
  );

  return (
    <Paper elevation={0} sx={{ ...cardSurfaceSx, p: 2.5, borderColor: '#e2e8f0', mt: 1 }}>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to load professors. Ensure /api/admin/professors is available.
        </Alert>
      )}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => openProfessorDialog()}>
          Add Professor
        </Button>
      </Stack>
      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={professors}
          columns={columns}
          getRowId={(row) => row._rowId || row.id}
          pageSizeOptions={[10, 20]}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          sx={sharedGridSx}
        />
      </Box>

      <Dialog open={profDialogOpen} onClose={() => setProfDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedProfessor ? 'Edit Professor' : 'Add Professor'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={professorForm.name} onChange={(e) => setProfessorForm((prev) => ({ ...prev, name: e.target.value }))} fullWidth />
            <TextField label="Email" value={professorForm.email} onChange={(e) => setProfessorForm((prev) => ({ ...prev, email: e.target.value }))} fullWidth />
            <TextField label="Department" value={professorForm.department} onChange={(e) => setProfessorForm((prev) => ({ ...prev, department: e.target.value }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => saveProfessorMutation.mutate({ id: selectedProfessor?.id, payload: professorForm })}
            disabled={!professorForm.name || !professorForm.email}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProfessorManager;
