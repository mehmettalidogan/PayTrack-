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
} from '@mui/material';
import {
  Add as AddIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
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

const CustomerManagement = ({ userId }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    product: '',
    debt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
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

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.product || !newCustomer.debt) {
      setError('Tüm alanları doldurun!');
      return;
    }

    const parsedDebt = parseFloat(newCustomer.debt);
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
        setNewCustomer({ name: '', product: '', debt: '' });
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

      if (response.ok) {
        setSuccess('PDF başarıyla oluşturuldu!');
        setSelectedCustomer(customerName);
        setPdfDialogOpen(true);
      } else {
        const data = await response.json();
        setError(data.error || 'PDF oluşturulurken bir hata oluştu!');
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
    } finally {
      setPdfGenerating(null);
    }
  };

  const handleViewPdf = (customerName: string) => {
    setSelectedCustomer(customerName);
    setPdfDialogOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
                  Yeni Müşteri Ekle
                </Typography>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Müşteri Adı"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Ürün"
                    value={newCustomer.product}
                    onChange={(e) => setNewCustomer({ ...newCustomer, product: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Borç"
                    type="number"
                    value={newCustomer.debt}
                    onChange={(e) => setNewCustomer({ ...newCustomer, debt: e.target.value })}
                    fullWidth
                    size="small"
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

        <Grid item xs={12} md={8}>
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
                          {customer.product} | Borç: {customer.debt}₺
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="PDF Görüntüle">
                          <IconButton
                            onClick={() => handleViewPdf(customer.name)}
                            size="small"
                          >
                            <PdfIcon />
                          </IconButton>
                        </Tooltip>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleGeneratePdf(customer.name)}
                          disabled={pdfGenerating === customer.name}
                          startIcon={
                            pdfGenerating === customer.name 
                              ? <CircularProgress size={20} /> 
                              : <PdfIcon />
                          }
                        >
                          {pdfGenerating === customer.name ? 'Oluşturuluyor...' : 'PDF Oluştur'}
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* PDF Dialog */}
      <Dialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Typography variant="h6">
            {selectedCustomer} - PDF Raporları
          </Typography>
          <IconButton
            onClick={() => setPdfDialogOpen(false)}
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
          {selectedCustomer && (
            <PDFViewer customerName={selectedCustomer} />
          )}
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

export default CustomerManagement; 