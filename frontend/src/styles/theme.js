import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#3C8D40', // Logo yeşili
      light: '#4CAF50',
      dark: '#2E7D32',
      contrastText: '#FFFFFF'
    },
    secondary: { 
      main: '#1C1F2A', // Koyu gri
      light: '#2C2F3A',
      dark: '#0C0F1A',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#F5F5F5', // Açık gri
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1C1F2A',
      secondary: '#666666'
    }
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '32px',
      fontWeight: 600,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '28px',
      fontWeight: 600,
      lineHeight: 1.3
    },
    h3: {
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h4: {
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: 1.4
    },
    h5: {
      fontSize: '18px',
      fontWeight: 500,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '16px',
      fontWeight: 500,
      lineHeight: 1.4
    },
    body1: {
      fontSize: '16px',
      lineHeight: 1.6
    },
    body2: {
      fontSize: '14px',
      lineHeight: 1.6
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px'
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500
        }
      }
    }
  }
});

export default theme; 