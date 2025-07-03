import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Fade,
  useTheme,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  InputAdornment,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import PDFViewer from './PDFViewer';

interface CustomerManagementProps {
  userId: string;
}

interface Customer {
  name: string;
  product: string;
  debt: number;
}

interface NewCustomer {
  name: string;
  product: string;
  debt: string | number;
}

const CustomerManagement = ({ userId }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    name: '',
    product: '',
    debt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);
  const theme = useTheme();

  const fetchCustomers = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [userId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'searchTerm') {
      setSearchTerm(value);
    } else if (name === 'debt') {
      setNewCustomer(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setNewCustomer(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
  };

  const resetForm = () => {
    setNewCustomer({ name: '', product: '', debt: '' });
    setSearchTerm('');
    setSelectedCustomer(null);
    setPdfDialogOpen(false);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.product || !newCustomer.debt) {
      setError('Tüm alanları doldurun!');
      return;
    }

    const parsedDebt = parseFloat(newCustomer.debt.toString());
    if (isNaN(parsedDebt)) {
      setError('Geçersiz borç tutarı!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name: newCustomer.name,
          urun: newCustomer.product,
          borc: parsedDebt,
        }),
      });

      if (response.ok) {
        setSuccess('Müşteri başarıyla eklendi!');
        resetForm();
        fetchCustomers();
      } else {
        const data = await response.json();
        setError(data.error || 'Müşteri eklenirken bir hata oluştu!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async (customerName: string) => {
    setPdfGenerating(customerName);
    try {
      console.log('PDF oluşturma isteği gönderiliyor...');
      const response = await fetch('http://localhost:5000/generate-pdf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          customer_name: customerName,
        }),
      });

      const data = await response.json();
      console.log('PDF oluşturma yanıtı:', data);

      if (response.ok) {
        setSuccess('PDF başarıyla oluşturuldu!');
        setSelectedCustomer(customerName);
        setPdfDialogOpen(true);
      } else {
        setError(data.error || 'PDF oluşturulurken bir hata oluştu!');
        console.error('PDF oluşturma hatası:', data.error);
      }
    } catch (err) {
      console.error('PDF oluşturma işleminde hata:', err);
      setError('PDF oluşturulurken bir hata oluştu! Lütfen tekrar deneyin.');
    } finally {
      setPdfGenerating(null);
    }
  };

  const handleViewPdf = (customerName: string) => {
    setSelectedCustomer(customerName);
    setPdfDialogOpen(true);
  };

  const handleDeleteCustomer = async (customerName: string) => {
    if (!window.confirm(`${customerName} isimli müşteriyi silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeletingCustomer(customerName);
    try {
      const response = await fetch(`http://localhost:5000/customers/${customerName}?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Müşteri başarıyla silindi!');
        resetForm();
        await fetchCustomers();
      } else {
        const data = await response.json();
        setError(data.error || 'Müşteri silinirken bir hata oluştu!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setDeletingCustomer(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Müşteri Yönetimi
        </Typography>
        <IconButton 
          onClick={fetchCustomers}
          disabled={loading}
          sx={{
            animation: loading ? 'spin 1s linear infinite' : 'none',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 180px)' }}>
        <Grid item xs={12} sx={{ height: '40%' }}>
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
                }
              }}
            >
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  Yeni Müşteri Ekle
                </Typography>
                <Box 
                  component="form" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 2,
                    flex: 1,
                    alignItems: 'center'
                  }}
                >
                  <TextField
                    label="Müşteri Adı"
                    name="name"
                    value={newCustomer.name}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label="Ürün"
                    name="product"
                    value={newCustomer.product}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    fullWidth
                    size="small"
                    autoComplete="off"
                  />
                  <TextField
                    label="Borç"
                    name="debt"
                    type="number"
                    value={newCustomer.debt}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    fullWidth
                    size="small"
                    autoComplete="off"
                    InputProps={{
                      endAdornment: <Typography variant="caption">₺</Typography>
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddCustomer}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    sx={{
                      height: 40,
                      minWidth: 150,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {loading ? 'Ekleniyor...' : 'Müşteri Ekle'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Müşteri Ara..."
            name="searchTerm"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            autoComplete="off"
            sx={{ mb: 2 }}
            placeholder="İsim veya ürüne göre ara"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
          />
        </Grid>

        <Grid item xs={12} sx={{ height: '60%', overflowY: 'auto' }}>
          <Card sx={{ height: '100%', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Müşteri Listesi ({filteredCustomers.length})
              </Typography>
              <TextField
                size="small"
                placeholder="Müşteri veya ürün ara..."
                name="searchTerm"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                autoComplete="off"
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 'calc(100% - 60px)', backgroundColor: 'transparent' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Müşteri Adı</TableCell>
                    <TableCell>Ürün</TableCell>
                    <TableCell>Borç</TableCell>
                    <TableCell align="right">İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.name}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.product}</TableCell>
                      <TableCell sx={{ color: customer.debt > 0 ? 'error.main' : 'success.main' }}>
                        {customer.debt.toLocaleString('tr-TR')} ₺
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="PDF Oluştur">
                            <IconButton
                              onClick={() => handleGeneratePdf(customer.name)}
                              disabled={pdfGenerating === customer.name}
                            >
                              {pdfGenerating === customer.name ? (
                                <CircularProgress size={24} />
                              ) : (
                                <PdfIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Müşteriyi Sil">
                            <IconButton
                              onClick={() => handleDeleteCustomer(customer.name)}
                              disabled={deletingCustomer === customer.name}
                              color="error"
                            >
                              {deletingCustomer === customer.name ? (
                                <CircularProgress size={24} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedCustomer} - PDF Raporu
            </Typography>
            <IconButton onClick={() => setPdfDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <PDFViewer customerName={selectedCustomer} />
          )}
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

export default CustomerManagement; 