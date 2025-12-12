import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, useMediaQuery, Box, Typography } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Supabase import kaldırıldı - artık backend üzerinden API çağrıları yapılıyor

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Raporlar', icon: <DescriptionIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Sidebar({ selected, onSelect }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);

  // Kullanıcı profil bilgilerini al - artık backend API kullanılıyor
  useEffect(() => {
    if (user) {
      setUserProfile({
        first_name: user.firstName,
        last_name: user.lastName
      });
    }
  }, [user]);

  const handleSelect = (item) => {
    onSelect(item);
    navigate(item.path);
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open
      sx={{
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#3C8D40',
          borderRight: '1px solid #2E7D32',
          boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
          overflowX: 'hidden',
          overflowY: 'auto'
        },
      }}
    >
      {/* Logo Alanı */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid #2E7D32',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 0
      }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 50%, #E0E0E0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            flexShrink: 0
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#3C8D40', 
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: 1
            }}
          >
            {userProfile?.first_name?.charAt(0) || 'U'}
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: '#FFFFFF',
            fontSize: '16px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          {userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Kullanıcı'}
        </Typography>
      </Box>

      <List sx={{ pt: 2, overflowX: 'hidden' }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            selected={selected === item.text}
            onClick={() => navigate(item.path)}
            sx={{
              margin: '4px 12px',
              borderRadius: 2,
              '&.Mui-selected': {
                backgroundColor: '#2E7D32',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: '#1B5E20'
                },
                '& .MuiListItemIcon-root': {
                  color: '#FFFFFF'
                }
              },
              '&:hover': {
                backgroundColor: '#4CAF50',
                color: '#FFFFFF',
                '& .MuiListItemIcon-root': {
                  color: '#FFFFFF'
                }
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: selected === item.text ? '#FFFFFF' : '#E8F5E8',
              minWidth: 40
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: selected === item.text ? 600 : 500,
                  fontSize: '15px',
                  color: selected === item.text ? '#FFFFFF' : '#E8F5E8'
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
} 