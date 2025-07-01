import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface TransactionManagementProps {
  userId: string;
}

interface Customer {
  name: string;
  product: string;
  debt: number;
}

const TransactionManagement = ({ userId }: TransactionManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const theme = useTheme();

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`http://localhost:5000/customers/?user_id=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        const parsedCustomers = data.map((customerStr: string) => {
          const [name, product, debtStr] = customerStr.split(' | ');
          const debt = parseFloat(debtStr.replace('Borç: ', '').replace('₺', ''));
          return { name, product, debt };
        });
        setCustomers(parsedCustomers);
      } else {
        setError('Müşteri listesi alınamadı!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [userId]);

  const handleAddTransaction = async () => {
    if (!selectedCustomer || !amount) {
      setError('Tüm alanları doldurun!');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      setError('Geçersiz tutar!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/customers/borc-ekle/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          customer_name: selectedCustomer,
          amount: parsedAmount,
        }),
      });

      if (response.ok) {
        setSuccess('İşlem başarıyla kaydedildi!');
        setSelectedCustomer('');
        setAmount('');
        fetchCustomers();
      } else {
        const data = await response.json();
        setError(data.error || 'İşlem kaydedilirken bir hata oluştu!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        İşlem Yönetimi
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Fade in timeout={800}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(6px)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yeni İşlem Ekle
                </Typography>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    select
                    label="Müşteri"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    fullWidth
                    size="small"
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer.name} value={customer.name}>
                        {customer.name} - Mevcut Borç: {customer.debt.toLocaleString('tr-TR')} ₺
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Tutar"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      endAdornment: <Typography variant="caption">₺</Typography>
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddTransaction}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    sx={{
                      height: 40,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'İşlem Kaydediliyor...' : 'İşlemi Kaydet'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} md={6}>
          <Fade in timeout={1000}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Müşteri Listesi
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {customers.map((customer) => (
                    <Box
                      key={customer.name}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                        }
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {customer.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {customer.product}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          mt: 1,
                          color: customer.debt > 0 ? theme.palette.error.main : theme.palette.success.main,
                          fontWeight: 600
                        }}
                      >
                        Borç: {customer.debt.toLocaleString('tr-TR')} ₺
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        TransitionComponent={Fade}
      >
        <Alert 
          severity="error" 
          onClose={() => setError('')}
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        TransitionComponent={Fade}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess('')}
          variant="filled"
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionManagement; 