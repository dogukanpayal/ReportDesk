import React from 'react';
import { Box, Typography } from '@mui/material';

export default function HelloWorldPage() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h3">Hello World</Typography>
    </Box>
  );
} 