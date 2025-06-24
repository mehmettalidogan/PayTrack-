from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from .customer import Customer

def save_pdf(customer: Customer):
    filename = f"{customer.name}_borc_raporu.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    y = height - 50
    c.setFont("Helvetica", 12)

    c.drawString(50, y, f"Müşteri: {customer.name}")
    y -= 20
    c.drawString(50, y, f"Ürün: {customer.urun}")
    y -= 20
    c.drawString(50, y, f"Toplam Borç: {customer.borc:.2f} TL")
    y -= 30
    c.drawString(50, y, "İşlem Geçmişi:")
    y -= 20

    for t in customer.transactions[-10:]:
        c.drawString(60, y, t[:90])
        y -= 15
        if y < 100:
            c.showPage()
            y = height - 50

    c.save() 