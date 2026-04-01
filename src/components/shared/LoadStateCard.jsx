import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';

const LoadStateCard = ({
  icon,
  title,
  description,
  actionLabel = 'Try again',
  onAction,
  severity = 'neutral',
  minHeight = 220,
}) => {
  const accent = severity === 'error' ? '#dc2626' : severity === 'warning' ? '#b45309' : '#0c4a8a';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        borderRadius: 3,
        border: '1px dashed #cbd5e1',
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <Stack spacing={1.5} alignItems="center" textAlign="center" sx={{ maxWidth: 420 }}>
        <Box sx={{ color: accent, opacity: 0.85 }}>{icon}</Box>
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {onAction && (
          <Button
            variant="outlined"
            startIcon={<AutorenewRoundedIcon />}
            onClick={onAction}
            sx={{ mt: 1, fontWeight: 700 }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default LoadStateCard;
