import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

/** Reusable statistics card component */
function StatCard({ label, value, icon, color = '#1976d2', bgcolor = '#e3f2fd' }) {
  return (
    <Card sx={{ bgcolor, borderRadius: 2, boxShadow: 2, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {icon && (
          <Box sx={{ fontSize: 48, opacity: 0.8, color, display: 'flex' }}>
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h4" fontWeight={700}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatCard;
