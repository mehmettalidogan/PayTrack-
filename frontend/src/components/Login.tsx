import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography,
  Alert,
  Snackbar 
} from '@mui/material';

interface LoginProps {
  onLogin: (userId: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Kullanıcı adı gerekli!');
      setShowError(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user_id);
      } else {
        setError(data.error || 'Bir hata oluştu!');
        setShowError(true);
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
      setShowError(true);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          PayTrack - Giriş
        </Typography>
        
        <TextField
          label="Kullanıcı Adı"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          size="large"
        >
          Giriş Yap
        </Button>

        <Snackbar
          open={showError}
          autoHideDuration={6000}
          onClose={() => setShowError(false)}
        >
          <Alert severity="error" onClose={() => setShowError(false)}>
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default Login; 