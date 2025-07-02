from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import os
import glob
import shutil
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def delete_old_pdfs(customer_name, reports_dir):
    """Müşteriye ait tüm eski PDF'leri sil"""
    pattern = os.path.join(reports_dir, f"rapor_{customer_name}*.pdf")
    old_pdfs = glob.glob(pattern)
    
    for pdf in old_pdfs:
        try:
            if os.path.exists(pdf):
                try:
                    with open(pdf, 'r+b') as f:
                        f.close()
                except:
                    pass
                try:
                    os.remove(pdf)
                except:
                    try:
                        os.unlink(pdf)
                    except:
                        try:
                            shutil.rmtree(pdf, ignore_errors=True)
                        except:
                            pass
        except Exception as e:
            logger.error(f"PDF silinirken hata: {pdf} - {str(e)}")

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
        delete_old_pdfs(customer.name, reports_dir)
        logger.info("Eski PDF'ler silindi")
        
        # Yeni PDF dosya adını oluştur
        filename = f"rapor_{customer.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = os.path.join(reports_dir, filename)
        logger.info(f"Yeni PDF dosya yolu: {filepath}")
        
        # Dizin izinlerini kontrol et
        if not os.access(reports_dir, os.W_OK):
            logger.error(f"HATA: {reports_dir} dizinine yazma izni yok!")
            raise PermissionError(f"{reports_dir} dizinine yazma izni yok!")
        
        # PDF dokümanını oluştur
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        logger.info("PDF dokümanı oluşturuldu")
        
        # Stil tanımlamaları
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1976D2')
        ))
        styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=20,
            textColor=colors.HexColor('#333333')
        ))
        styles.add(ParagraphStyle(
            name='CustomBody',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            textColor=colors.HexColor('#666666')
        ))
        
        # PDF içeriğini oluştur
        elements = []
        
        # Başlık
        elements.append(Paragraph('Müşteri Raporu', styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Müşteri Bilgileri
        customer_info = [
            ['Müşteri Adı:', customer.name],
            ['Ürün:', customer.urun],
            ['Toplam Borç:', f"{customer.borc:.2f} ₺"],
            ['Son Güncelleme:', datetime.now().strftime('%d.%m.%Y %H:%M')]
        ]
        
        t = Table(customer_info, colWidths=[120, 300])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EEEEEE')),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F5F5F5')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 30))
        
        # İşlem Geçmişi
        transactions = customer.get_transaction_history()
        logger.info(f"İşlem geçmişi alındı: {len(transactions)} işlem bulundu")
        
        if transactions:
            elements.append(Paragraph('İşlem Geçmişi', styles['CustomHeading']))
            elements.append(Spacer(1, 10))
            
            # Tablo başlıkları
            transaction_data = [['Tarih', 'İşlem Tipi', 'Tutar']]
            
            # İşlem verileri - tarihe göre sırala (yeniden eskiye)
            transactions.sort(key=lambda x: x.timestamp, reverse=True)
            
            for transaction in transactions:
                # timestamp hem string hem datetime olabilir, kontrol et
                timestamp = transaction.timestamp
                if isinstance(timestamp, str):
                    try:
                        timestamp = datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                    except ValueError:
                        try:
                            timestamp = datetime.strptime(timestamp, '%Y-%m-%d %H:%M')
                        except Exception:
                            timestamp = datetime.now()
                
                transaction_data.append([
                    timestamp.strftime('%d.%m.%Y %H:%M'),
                    'Borç Ekleme' if transaction.transaction_type == 'borc' else 'Ödeme',
                    f"{transaction.amount:.2f} ₺"
                ])
            
            t = Table(transaction_data, colWidths=[140, 140, 140])
            t.setStyle(TableStyle([
                ('FONTSIZE', (0, 0), (-1, -1), 11),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#FFFFFF')),  # Başlık rengi
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#666666')),  # İçerik rengi
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976D2')),  # Başlık arka plan
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#EEEEEE')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph('Henüz işlem geçmişi bulunmamaktadır.', styles['CustomBody']))
        
        # Alt Bilgi
        elements.append(Spacer(1, 40))
        elements.append(Paragraph(
            f'Bu rapor {datetime.now().strftime("%d.%m.%Y %H:%M")} tarihinde güncellenmiştir.',
            ParagraphStyle(
                'Footer',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#999999'),
                alignment=1
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