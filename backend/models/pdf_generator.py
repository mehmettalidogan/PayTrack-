from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import datetime
from .customer import Customer

def save_pdf(customer: Customer):
    """Müşteri bilgilerini PDF olarak kaydeder"""
    # PDF dosya adını oluştur
    filename = f"rapor_{customer.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(os.path.dirname(__file__), '..', 'reports', filename)
    
    # Reports klasörünü oluştur
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # PDF dokümanını oluştur
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    
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
        ['Rapor Tarihi:', datetime.now().strftime('%d.%m.%Y %H:%M')]
    ]
    
    t = Table(customer_info, colWidths=[120, 300])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
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
    if customer.transactions:
        elements.append(Paragraph('İşlem Geçmişi', styles['CustomHeading']))
        elements.append(Spacer(1, 10))
        
        # Tablo başlıkları
        transaction_data = [['Tarih', 'İşlem Tipi', 'Tutar']]
        
        # İşlem verileri
        for transaction in customer.get_transaction_history():
            transaction_data.append([
                transaction.timestamp,
                'Borç Ekleme' if transaction.transaction_type == 'borc' else 'Ödeme',
                f"{transaction.amount:.2f} ₺"
            ])
        
        t = Table(transaction_data, colWidths=[150, 150, 120])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
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
        'Bu rapor otomatik olarak oluşturulmuştur.',
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#999999'),
            alignment=1
        )
    ))
    
    # PDF'i oluştur
    doc.build(elements)
    return filepath 