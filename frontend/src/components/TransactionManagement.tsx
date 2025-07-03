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
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'borc' | 'odeme' | 'alacak'>('borc');
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
      setError('Müşteri ve tutar alanları zorunludur!');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      setError('Geçersiz tutar!');
      return;
    }

    setLoading(true);
    try {
      let endpoint;
      switch (transactionType) {
        case 'borc':
          endpoint = 'borc-ekle';
          break;
        case 'odeme':
          endpoint = 'odeme-yap';
          break;
        case 'alacak':
          endpoint = 'alacak-ekle';
          break;
      }
      
      const response = await fetch(`http://localhost:5000/customers/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          customer_name: selectedCustomer,
          amount: parsedAmount,
          description: description.trim(),
        }),
      });

      if (response.ok) {
        setSuccess(`${
          transactionType === 'borc' ? 'Borç' : 
          transactionType === 'odeme' ? 'Ödeme' : 
          'Alacak'
        } işlemi başarıyla kaydedildi!`);
        setSelectedCustomer('');
        setAmount('');
        setDescription('');
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
    <Box sx={{ 
      p: 2, 
      height: '100%',
      '& .MuiCard-root': {
        marginRight: '12px'  // Scrollbar için sağdan boşluk
      },
      '& ::-webkit-scrollbar': {
        width: '8px',
        position: 'absolute',
        right: 0
      },
      '& ::-webkit-scrollbar-track': {
        background: 'transparent'
      },
      '& ::-webkit-scrollbar-thumb': {
        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        borderRadius: '4px'
      }
    }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        İşlem Yönetimi
      </Typography>

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 180px)', width: '98%' }}>
        <Grid item xs={12} sx={{ height: '65%' }}>
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
                  transform: 'translateX(4px)',
                  boxShadow: theme.shadows[4],
                },
                p: 2
              }}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Yeni İşlem Ekle
                </Typography>
                <Box 
                  component="form" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        label="Müşteri"
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 } }}
                      >
                        {customers.map((customer) => (
                          <MenuItem key={customer.name} value={customer.name}>
                            {customer.name} - Mevcut Borç: {customer.debt.toLocaleString('tr-TR')} ₺
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>İşlem Tipi</InputLabel>
                        <Select
                          value={transactionType}
                          label="İşlem Tipi"
                          onChange={(e) => setTransactionType(e.target.value as 'borc' | 'odeme' | 'alacak')}
                          sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 } }}
                        >
                          <MenuItem value="borc">Borç Ekle</MenuItem>
                          <MenuItem value="odeme">Ödeme Al</MenuItem>
                          <MenuItem value="alacak">Alacak Ekle</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Tutar"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        sx={{ '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 } }}
                        InputProps={{
                          endAdornment: <Typography variant="caption" sx={{ fontSize: '1rem' }}>₺</Typography>
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    label="Açıklama"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    sx={{ 
                      '& .MuiInputBase-input': { 
                        fontSize: '1rem',
                        lineHeight: 1.5
                      }
                    }}
                    placeholder="İşlem için açıklama ekleyin (opsiyonel)"
                  />

                  <Button
                    variant="contained"
                    onClick={handleAddTransaction}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={24} /> : <AddIcon />}
                    sx={{
                      height: 48,
                      alignSelf: 'flex-end',
                      minWidth: 180,
                      fontSize: '1rem',
                      px: 3
                    }}
                  >
                    {loading ? 'İşleniyor...' : 'İşlemi Kaydet'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12} sx={{ height: '60%' }}>
          <Fade in timeout={1000}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Müşteri Listesi
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {customers.length} müşteri
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Müşteri Adı</TableCell>
                        <TableCell>Ürün</TableCell>
                        <TableCell align="right">Borç</TableCell>
                        <TableCell align="right">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow 
                          key={customer.name}
                          sx={{
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.02)',
                            }
                          }}
                        >
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.product}</TableCell>
                          <TableCell align="right" sx={{ 
                            color: customer.debt > 0 ? theme.palette.error.main : theme.palette.success.main,
                            fontWeight: 600
                          }}>
                            {customer.debt.toLocaleString('tr-TR')} ₺
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="İşlem Geçmişi">
                              <IconButton
                                size="small"
                                onClick={() => handleViewHistory(customer.name)}
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          İşlem Geçmişi
          <IconButton onClick={() => setHistoryDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TableContainer>
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
                    <TableCell>{new Date(transaction.timestamp).toLocaleString('tr-TR')}</TableCell>
                    <TableCell>{transaction.transaction_type === 'borc' ? 'Borç' : transaction.transaction_type === 'odeme' ? 'Ödeme' : 'Alacak'}</TableCell>
                    <TableCell align="right" sx={{
                      color: transaction.transaction_type === 'borc' 
                        ? theme.palette.error.main 
                        : transaction.transaction_type === 'odeme' 
                          ? theme.palette.success.main 
                          : theme.palette.warning.main,
                      fontWeight: 600
                    }}>
                      {transaction.amount.toLocaleString('tr-TR')} ₺
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={() => {
          setError('');
          setSuccess('');
        }}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          variant="filled"
          onClose={() => {
            setError('');
            setSuccess('');
          }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionManagement; 