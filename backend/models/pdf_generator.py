from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import os
import glob
import shutil
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# PDF dosyalarının bulunduğu dizin
PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')

def delete_old_pdfs():
    """24 saatten eski PDF dosyalarını siler"""
    try:
        now = datetime.now()
        for pdf in os.listdir(PDF_DIR):
            if pdf.endswith('.pdf'):
                pdf_path = os.path.join(PDF_DIR, pdf)
                file_time = datetime.fromtimestamp(os.path.getctime(pdf_path))
                if (now - file_time).days >= 1:
                    os.remove(pdf_path)
                    logger.info(f"Eski PDF silindi: {pdf}")
    except Exception as e:
        logger.error(f"PDF silinirken hata: {str(e)}")

def parse_timestamp(timestamp_str):
    """Timestamp string'ini datetime objesine çevirir"""
    try:
        # Önce tam format ile dene
        return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        try:
            # Eğer saniye yoksa bu format ile dene
            return datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M')
        except ValueError as e:
            logger.error(f"Timestamp ayrıştırma hatası: {str(e)}")
            raise

def save_pdf(customer):
    """Müşteri bilgilerini PDF olarak kaydeder"""
    logger.info("\n=== PDF OLUŞTURMA BAŞLADI ===")
    try:
        # Reports klasörünü oluştur
        reports_dir = os.path.join(os.path.dirname(__file__), '..', 'reports')
        reports_dir = os.path.abspath(reports_dir)
        os.makedirs(reports_dir, exist_ok=True)
        logger.info(f"PDF raporları dizini: {reports_dir}")
        
        # Önce eski PDF'leri sil
        delete_old_pdfs()
        logger.info("Eski PDF'ler silindi")
        
        # Yeni PDF dosya adını oluştur
        filename = f"rapor_{customer.name.lower()}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(PDF_DIR, filename)
        logger.info(f"Yeni PDF dosya yolu: {filepath}")
        
        # Dizin izinlerini kontrol et
        if not os.access(reports_dir, os.W_OK):
            logger.error(f"HATA: {reports_dir} dizinine yazma izni yok!")
            raise PermissionError(f"{reports_dir} dizinine yazma izni yok!")

        # Stil tanımlamaları
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            alignment=1  # Center alignment
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=10
        )
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=5
        )

        # PDF dokümanını oluştur
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=20*mm,
            leftMargin=20*mm,
            topMargin=20*mm,
            bottomMargin=20*mm
        )

        # PDF içeriğini oluştur
        elements = []

        # Başlık
        elements.append(Paragraph('Müşteri Borç Raporu', title_style))
        elements.append(Spacer(1, 10*mm))

        # Müşteri bilgileri
        elements.append(Paragraph(f'Müşteri: {customer.name}', heading_style))
        elements.append(Paragraph(f'Ürün: {customer.urun}', heading_style))
        elements.append(Paragraph(f'Güncel Borç: {customer.borc:.2f} ₺', heading_style))
        elements.append(Spacer(1, 10*mm))

        # İşlem geçmişi başlığı
        elements.append(Paragraph('İşlem Geçmişi', heading_style))
        elements.append(Spacer(1, 5*mm))

        # İşlemler tablosu
        table_data = [['Tarih', 'İşlem Tipi', 'Tutar', 'Açıklama']]
        
        # İşlemleri tarihe göre sırala
        sorted_transactions = sorted(
            customer.transactions,
            key=lambda x: parse_timestamp(x.timestamp),
            reverse=True
        )
        
        for transaction in sorted_transactions:
            if transaction.transaction_type == 'borc':
                islem_tipi = 'Borç Ekleme'
            elif transaction.transaction_type == 'odeme':
                islem_tipi = 'Ödeme'
            else:  # alacak
                islem_tipi = 'Alacak'
            
            # String timestamp'i datetime'a çevir ve formatla
            tarih = parse_timestamp(transaction.timestamp).strftime('%d/%m/%Y %H:%M')
            table_data.append([
                tarih,
                islem_tipi,
                f'{transaction.amount:.2f} ₺',
                transaction.description or '-'
            ])

        # Tablo stilleri
        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Tutar sağa yaslı
            ('ALIGN', (3, 1), (3, -1), 'LEFT'),   # Açıklama sola yaslı
        ])

        # Tablo genişlikleri (A4 genişliği ~210mm, kenar boşlukları çıkarılınca ~170mm)
        col_widths = [45*mm, 35*mm, 35*mm, 55*mm]
        table = Table(table_data, colWidths=col_widths)
        table.setStyle(table_style)
        elements.append(table)

        # Rapor tarihi
        elements.append(Spacer(1, 10*mm))
        elements.append(Paragraph(
            f'Rapor Tarihi: {datetime.now().strftime("%d/%m/%Y %H:%M")}',
            ParagraphStyle(
                'RaporTarihi',
                parent=styles['Normal'],
                fontSize=9,
                alignment=2  # Right alignment
            )
        ))

        # PDF'i oluştur
        try:
            doc.build(elements)
            logger.info(f"PDF başarıyla oluşturuldu: {filepath}")
            
            # Dosyanın gerçekten oluşturulup oluşturulmadığını kontrol et
            if os.path.exists(filepath):
                file_size = os.path.getsize(filepath)
                logger.info(f"PDF dosyası kontrol edildi: {file_size} bytes")
            else:
                logger.error(f"HATA: PDF dosyası oluşturuldu ama dosya bulunamıyor: {filepath}")
                raise FileNotFoundError(f"PDF dosyası bulunamıyor: {filepath}")
                
        except Exception as e:
            logger.error(f"PDF oluşturulurken hata: {str(e)}")
            raise e
        
        logger.info("=== PDF OLUŞTURMA TAMAMLANDI ===\n")
        return filepath
        
    except Exception as e:
        logger.error(f"PDF oluşturma işleminde kritik hata: {str(e)}")
        raise e 