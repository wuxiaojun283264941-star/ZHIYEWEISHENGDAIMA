import React from 'react';
import { Typography, Box } from '@mui/material';

/** Reusable page header with title and optional actions */
function PageHeader({ title, actions }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" fontWeight={600}>{title}</Typography>
      {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
    </Box>
  );
}

export default PageHeader;
