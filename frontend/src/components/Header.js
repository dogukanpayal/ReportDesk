import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

export default function Header({ title, onMenuClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        backgroundColor: '#3C8D40',
        color: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        width: '100%',
        top: 0,
        zIndex: 1200 // NavigationDrawer'dan düşük olmalı
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        px: isMobile ? 1.5 : 3, 
        width: '100%',
        minHeight: isMobile ? '56px' : '64px'
      }}>
        {/* Sol - Hamburger Menu */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ 
            mr: isMobile ? 1 : 2,
            p: isMobile ? 1 : 1.5, // Mobilde daha büyük touch area
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            },
            '&:active': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)'
            }
          }}
        >
          <MenuIcon sx={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }} />
        </IconButton>

        {/* Orta - Başlık */}
        <Typography 
          variant={isMobile ? 'h6' : 'h5'}
          sx={{ 
            fontWeight: 600,
            color: '#FFFFFF',
            textAlign: 'center',
            flexGrow: 1,
            fontSize: isMobile ? '1rem' : '1.5rem',
            px: isMobile ? 1 : 2
          }}
        >
          {title}
        </Typography>

        {/* Sağ - Boş alan (denge için) */}
        <Box sx={{ width: isMobile ? 48 : 56 }} />
      </Toolbar>
    </AppBar>
  );
} 