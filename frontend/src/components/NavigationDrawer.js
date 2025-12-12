import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as ReportsIcon,
  Settings as SettingsIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['Yonetici'] // Sadece yöneticiler görebilir
  },
  {
    text: 'Raporlar',
    icon: <ReportsIcon />,
    path: '/reports'
  },
  {
    text: 'Kullanıcılar',
    icon: <PeopleIcon />,
    path: '/users',
    roles: ['Yonetici'] // Sadece yöneticiler görebilir
  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings'
  }
];

export default function NavigationDrawer({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md breakpoint'e kadar mobil
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debug: Kullanıcı bilgilerini log'la
  console.log('=== NavigationDrawer Debug ===');
  console.log('User object:', user);
  console.log('User firstName:', user?.firstName);
  console.log('User lastName:', user?.lastName);
  console.log('User role:', user?.role);
  console.log('User email:', user?.email);
  console.log('=== End NavigationDrawer Debug ===');

  const drawerWidth = isMobile ? '100%' : 280; // Mobilde tam genişlik

  const drawerContent = (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* User Profile Section */}
      <Box sx={{ 
        p: isMobile ? 2 : 3, 
        textAlign: 'center', 
        borderBottom: '1px solid #E0E0E0',
        backgroundColor: '#f8f9fa'
      }}>
        <Avatar
          sx={{
            width: isMobile ? 56 : 64,
            height: isMobile ? 56 : 64,
            backgroundColor: '#3C8D40',
            margin: '0 auto 16px',
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 600
          }}
        >
          {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'K'}
        </Avatar>
        <Typography 
          variant={isMobile ? 'subtitle1' : 'h6'} 
          sx={{ 
            fontWeight: 600, 
            color: '#1C1F2A', 
            mb: 1,
            fontSize: isMobile ? '1rem' : '1.25rem'
          }}
        >
          {user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}`
            : 'Kullanıcı'
          }
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#666', 
            textTransform: 'capitalize', 
            mb: 0.5,
            fontSize: isMobile ? '0.875rem' : '1rem'
          }}
        >
          {user?.role || 'Rol'}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#888', 
            fontSize: isMobile ? '11px' : '12px',
            wordBreak: 'break-word'
          }}
        >
          {user?.email || 'Email yok'}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ 
        pt: isMobile ? 1 : 2, 
        pb: isMobile ? 1 : 2,
        flex: 1,
        overflow: 'auto'
      }}>
        {menuItems.map((item) => {
          // Rol kontrolü - eğer roles belirtilmişse ve kullanıcı bu rollerden birine sahip değilse gösterme
          if (item.roles && (!user || !item.roles.includes(user.role))) {
            return null;
          }
          
          const isActive = location.pathname.startsWith(item.path);
          const fullUrl = `${window.location.origin}${item.path}`;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component="a"
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  // Normal tıklamada mevcut sekmede aç
                  e.preventDefault();
                  // Mobilde drawer'ı kapat
                  if (isMobile) {
                    onClose();
                  }
                  // Drawer'ı kapatmadan sayfa değiştir
                  navigate(item.path);
                }}
                sx={{
                  mx: isMobile ? 1 : 2,
                  mb: isMobile ? 0.5 : 1,
                  borderRadius: isMobile ? 1 : 2,
                  backgroundColor: isActive ? '#E8F5E8' : 'transparent',
                  color: isActive ? '#3C8D40' : '#1C1F2A',
                  textDecoration: 'none',
                  minHeight: isMobile ? '48px' : '56px',
                  '&:hover': {
                    backgroundColor: isActive ? '#D4EDD4' : '#F5F5F5',
                    transform: isMobile ? 'none' : 'translateX(4px)',
                    boxShadow: isMobile ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiListItemIcon-root': {
                    color: isActive ? '#3C8D40' : '#666',
                    transition: 'color 0.3s ease',
                    minWidth: isMobile ? 36 : 40,
                  },
                  '& .MuiListItemText-root': {
                    transition: 'all 0.3s ease',
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: isMobile ? 36 : 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    fontWeight: isActive ? 600 : 500,
                    '& .MuiTypography-root': {
                      fontSize: isMobile ? '14px' : '16px',
                      transition: 'font-weight 0.3s ease'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile/Temporary Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose} // Mobilde drawer kapanabilsin
          ModalProps={{
            keepMounted: true, // Better mobile performance
            disableScrollLock: false, // Scroll'u kilitle
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '320px', // Mobilde maksimum genişlik
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
              backgroundColor: '#FFFFFF',
              zIndex: 1300
            },
            '& .MuiBackdrop-root': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay rengi
            }
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop/Persistent Drawer */}
      {!isMobile && (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              backgroundColor: '#FFFFFF',
              position: 'fixed',
              height: '100vh'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}
