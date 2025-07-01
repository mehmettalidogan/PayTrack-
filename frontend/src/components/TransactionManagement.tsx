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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface TransactionManagementProps {
  userId: string;
}

interface Customer {
  name: string;
  product: string;
  debt: number;
}

interface Transaction {
  timestamp: string;
  amount: number;
  transaction_type: string;
  description: string;
}

const TransactionManagement = ({ userId }: TransactionManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'borc' | 'odeme'>('borc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
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

  const fetchTransactions = async (customerName: string) => {
    try {
      const response = await fetch(`http://localhost:5000/customers/transactions/${customerName}`);
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions);
      } else {
        setError('İşlem geçmişi alınamadı!');
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
      const endpoint = transactionType === 'borc' ? 'borc-ekle' : 'odeme-yap';
      const response = await fetch(`http://localhost:5000/customers/${endpoint}/`, {
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
        setSuccess(`${transactionType === 'borc' ? 'Borç' : 'Ödeme'} işlemi başarıyla kaydedildi!`);
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

  const handleViewHistory = async (customerName: string) => {
    await fetchTransactions(customerName);
    setHistoryDialogOpen(true);
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
                  <FormControl fullWidth size="small">
                    <InputLabel>İşlem Tipi</InputLabel>
                    <Select
                      value={transactionType}
                      label="İşlem Tipi"
                      onChange={(e) => setTransactionType(e.target.value as 'borc' | 'odeme')}
                    >
                      <MenuItem value="borc">Borç Ekle</MenuItem>
                      <MenuItem value="odeme">Ödeme Al</MenuItem>
                    </Select>
                  </FormControl>
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
                        border: `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.02)',
                          transform: 'translateX(4px)',
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {customer.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
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
                      <Tooltip title="İşlem Geçmişi">
                        <IconButton
                          onClick={() => handleViewHistory(customer.name)}
                          size="small"
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* İşlem Geçmişi Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Typography variant="h6">
            İşlem Geçmişi
          </Typography>
          <IconButton
            onClick={() => setHistoryDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>İşlem Tipi</TableCell>
                  <TableCell align="right">Tutar</TableCell>
                  <TableCell>Açıklama</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.timestamp}</TableCell>
                    <TableCell>
                      {transaction.transaction_type === 'borc' ? 'Borç Ekleme' : 'Ödeme'}
                    </TableCell>
                    <TableCell align="right" sx={{
                      color: transaction.transaction_type === 'borc'
                        ? theme.palette.error.main
                        : theme.palette.success.main,
                      fontWeight: 600
                    }}>
                      {transaction.amount.toLocaleString('tr-TR')} ₺
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionManagement; 