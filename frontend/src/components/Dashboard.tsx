import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  Fade,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface DashboardProps {
  userId: string;
}

interface DashboardData {
  totalCustomers: number;
  totalDebt: number;
  recentTransactions: number;
}

const Dashboard = ({ userId }: DashboardProps) => {
  const [data, setData] = useState<DashboardData>({
    totalCustomers: 0,
    totalDebt: 0,
    recentTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/dashboard/?user_id=${userId}`);
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Dashboard verisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const cards = [
    {
      title: 'Toplam Müşteri',
      value: data.totalCustomers,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Toplam Borç',
      value: `${data.totalDebt.toLocaleString('tr-TR')} ₺`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
    },
    {
      title: 'Son İşlemler',
      value: data.recentTransactions,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gösterge Paneli
        </Typography>
        <IconButton 
          onClick={fetchDashboardData}
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
        {cards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Fade in timeout={500 + index * 200}>
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
                  <Box sx={{ position: 'relative', height: '140px' }}>
                    {loading ? (
                      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LinearProgress sx={{ width: '80%' }} />
                      </Box>
                    ) : (
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="textSecondary">
                            {card.title}
                          </Typography>
                          <Box sx={{ color: card.color }}>
                            {card.icon}
                          </Box>
                        </Box>
                        <Typography variant="h4" sx={{ mt: 2, fontWeight: 600, color: card.color }}>
                          {card.value}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 