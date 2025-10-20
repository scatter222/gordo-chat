import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7289da',
      light: '#99aab5',
      dark: '#5865f2',
    },
    secondary: {
      main: '#3ba55d',
      light: '#43b581',
      dark: '#2d7d46',
    },
    background: {
      default: '#202225',
      paper: '#2f3136',
    },
    text: {
      primary: '#dcddde',
      secondary: '#b9bbbe',
    },
    error: {
      main: '#ed4245',
    },
    warning: {
      main: '#faa61a',
    },
    info: {
      main: '#00b0ff',
    },
    success: {
      main: '#3ba55d',
    },
    divider: '#40444b',
  },
  typography: {
    fontFamily: '"Whitney", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: '#5865f2',
          '&:hover': {
            backgroundColor: '#4752c4',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#40444b',
            '& fieldset': {
              borderColor: '#40444b',
            },
            '&:hover fieldset': {
              borderColor: '#686d73',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7289da',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2f3136',
          backgroundImage: 'none',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#393c43',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid #202225',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#40444b',
          '&:hover': {
            backgroundColor: '#4a4e57',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#40444b',
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5865f2',
      light: '#7289da',
      dark: '#4752c4',
    },
    secondary: {
      main: '#3ba55d',
      light: '#43b581',
      dark: '#2d7d46',
    },
    background: {
      default: '#ffffff',
      paper: '#f2f3f5',
    },
    text: {
      primary: '#2e3338',
      secondary: '#4f5660',
    },
    divider: '#e3e5e8',
  },
  typography: theme.typography,
  shape: theme.shape,
  components: {
    ...theme.components,
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#e3e5e8',
            '& fieldset': {
              borderColor: '#e3e5e8',
            },
            '&:hover fieldset': {
              borderColor: '#c7ccd1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5865f2',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#f2f3f5',
          backgroundImage: 'none',
        },
      },
    },
  },
});