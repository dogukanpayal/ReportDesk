import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar
} from '@mui/material';

const DeleteUserConfirmModal = ({ open, onClose, user, onConfirm }) => {
  if (!user) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >

      
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: '#f57c00',
              mb: 2
            }}
          >
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'K'}
          </Avatar>
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            {user.firstName} {user.lastName}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user.email}
          </Typography>
          
          <Box 
            sx={{ 
              bgcolor: '#f5f5f5', 
              px: 2, 
              py: 0.5, 
              borderRadius: 1, 
              display: 'inline-block'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {user.role === 'Yonetici' ? 'Yönetici' : 'Çalışan'}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>{user.firstName} {user.lastName}</strong> adlı kullanıcıyı silmek istediğinizden emin misiniz?
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button 
          onClick={onClose} 
          color="inherit"
        >
          İptal
        </Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color="error"
        >
          Kullanıcıyı Sil
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteUserConfirmModal;
