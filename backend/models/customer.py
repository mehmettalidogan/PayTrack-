from datetime import datetime

class Customer:
    def __init__(self, name, urun, borc=0.0, transactions=None):
        self.name = name
        self.urun = urun
        self.borc = float(borc)
        self.transactions = transactions or []

    def borc_ekle(self, miktar, aciklama=""):
        self.borc += float(miktar)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        self.transactions.append(f"[{timestamp}] Borç eklendi: {miktar:.2f}₺" + (f" ({aciklama})" if aciklama else ""))

    def odeme_yap(self, miktar, aciklama=""):
        self.borc -= float(miktar)
        if self.borc < 0:
            self.borc = 0.0
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        self.transactions.append(f"[{timestamp}] Ödeme yapıldı: {miktar:.2f}₺" + (f" ({aciklama})" if aciklama else "")) 