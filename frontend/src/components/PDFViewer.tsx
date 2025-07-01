import React, { useRef, useState, useEffect } from 'react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useReactToPrint } from 'react-to-print';

interface PDFViewerProps {
  customerName: string;
}

interface PDFFile {
  filename: string;
  url: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ customerName }) => {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // PDF listesini yükle
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await fetch(`http://localhost:5000/pdf/list/${customerName}`);
        const data = await response.json();
        
        if (data.success) {
          setPdfs(data.pdfs);
          if (data.pdfs.length > 0) {
            setSelectedPdf(`http://localhost:5000${data.pdfs[0].url}`);
          }
        } else {
          setError(data.error || 'PDF listesi alınamadı');
        }
      } catch (err) {
        setError('PDF listesi yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchPdfs();
  }, [customerName]);

  // Yazdırma işlemi
  const handlePrint = useReactToPrint({
    content: () => iframeRef.current,
  });

  // PDF indirme işlemi
  const handleDownload = () => {
    if (selectedPdf) {
      window.open(selectedPdf, '_blank');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (pdfs.length === 0) {
    return (
      <Box p={2}>
        <Typography>Bu müşteri için henüz PDF raporu oluşturulmamış.</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, my: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">PDF Raporları</Typography>
        <Box>
          <Button
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            variant="contained"
            sx={{ mr: 1 }}
          >
            Yazdır
          </Button>
          <Button
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            variant="outlined"
          >
            İndir
          </Button>
        </Box>
      </Box>

      {/* PDF Görüntüleyici */}
      <Box
        sx={{
          width: '100%',
          height: '600px',
          overflow: 'hidden',
          border: '1px solid #ccc',
          borderRadius: 1,
        }}
      >
        {selectedPdf && (
          <iframe
            ref={iframeRef}
            src={selectedPdf}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="PDF Viewer"
          />
        )}
      </Box>

      {/* PDF Listesi */}
      <Box mt={2}>
        {pdfs.map((pdf) => (
          <Button
            key={pdf.filename}
            onClick={() => setSelectedPdf(`http://localhost:5000${pdf.url}`)}
            variant={selectedPdf === `http://localhost:5000${pdf.url}` ? 'contained' : 'text'}
            sx={{ mr: 1, mb: 1 }}
          >
            {pdf.filename}
          </Button>
        ))}
      </Box>
    </Paper>
  );
};

export default PDFViewer; 