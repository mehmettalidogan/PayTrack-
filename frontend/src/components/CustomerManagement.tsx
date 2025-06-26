import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar
} from '@mui/material';

interface Customer {
  name: string;
  product: string;
  debt: number;
}

interface CustomerManagementProps {
  userId: string;
}

const CustomerManagement = ({ userId }: CustomerManagementProps) => {
  // Form states
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [initialDebt, setInitialDebt] = useState('0');
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Error handling
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [success, setSuccess] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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
        setError(data.error || 'Müşteri listesi alınamadı!');
        setShowError(true);
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
      setShowError(true);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [userId]);

  const handleAddCustomer = async () => {
    if (!name.trim() || !product.trim()) {
      setError('Müşteri adı ve ürün gerekli!');
      setShowError(true);
      return;
    }

    try {
      const debt = parseFloat(initialDebt);
      if (isNaN(debt)) {
        setError('Geçersiz borç miktarı!');
        setShowError(true);
        return;
      }

      const response = await fetch('http://localhost:5000/customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          name,
          urun: product,
          borc: debt
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Müşteri başarıyla eklendi!');
        setShowSuccess(true);
        setName('');
        setProduct('');
        setInitialDebt('0');
        fetchCustomers();
      } else {
        setError(data.error || 'Müşteri eklenirken bir hata oluştu!');
        setShowError(true);
      }
    } catch (err) {
      setError('API\'ye bağlanılamadı!');
      setShowError(true);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Yeni Müşteri Formu */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Yeni Müşteri Ekle
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Müşteri Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Ürün"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                fullWidth
              />
              <TextField
                label="Başlangıç Borcu"
                type="number"
                value={initialDebt}
                onChange={(e) => setInitialDebt(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleAddCustomer}
                fullWidth
              >
                Müşteri Ekle
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Müşteri Listesi */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Müşteri Listesi
              </Typography>
              <Button onClick={fetchCustomers}>
                Listeyi Yenile
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Müşteri Adı</TableCell>
                    <TableCell>Ürün</TableCell>
                    <TableCell align="right">Borç</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.product}</TableCell>
                      <TableCell align="right">{customer.debt.toLocaleString('tr-TR')} ₺</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

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

export default CustomerManagement; 