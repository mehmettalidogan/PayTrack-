import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';

interface TransactionManagementProps {
  userId: string;
  onTransactionComplete: () => void;
}

const TransactionManagement = ({ userId, onTransactionComplete }: TransactionManagementProps) => {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTransaction = async (type: 'borc-ekle' | 'odeme-yap') => {
    if (!customerName.trim() || !amount.trim()) {
      setError('Müşteri adı ve miktar gerekli!');
      setShowError(true);
      return;
    }

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue)) {
        setError('Geçersiz miktar!');
        setShowError(true);
        return;
      }

      const response = await fetch(`http://localhost:5000/customers/${type}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          customer_name: customerName,
          miktar: amountValue,
          aciklama: description
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'İşlem başarılı!');
        setShowSuccess(true);
        setCustomerName('');
        setAmount('');
        setDescription('');
        onTransactionComplete();
      } else {
        setError(data.error || 'İşlem sırasında bir hata oluştu!');
        setShowError(true);
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
      setShowError(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Borç/Ödeme İşlemleri
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Müşteri Adı"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Miktar"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Açıklama"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleTransaction('borc-ekle')}
              fullWidth
            >
              Borç Ekle
            </Button>
          </Grid>
          
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => handleTransaction('odeme-yap')}
              fullWidth
            >
              Ödeme Yap
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionManagement; 