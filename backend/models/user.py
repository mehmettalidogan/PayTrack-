from datetime import datetime
from .customer import Customer

class User:
    def __init__(self, username):
        self.username = username
        self.customers = []

    def musteri_ekle(self, name, urun, borc=0.0):
        customer = Customer(name, urun, borc)
        customer.transactions.append(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] Yeni müşteri kaydedildi. Borç: {borc:.2f}₺")
        self.customers.append(customer)
        return customer

    def musteri_bul(self, name):
        for c in self.customers:
            if c.name.lower() == name.lower():
                return c
        return None

    def borc_ekle(self, customer_name, miktar, aciklama=""):
        customer = self.musteri_bul(customer_name)
        if customer:
            customer.borc_ekle(miktar, aciklama)
            return True
        return False

    def odeme_yap(self, customer_name, miktar, aciklama=""):
        customer = self.musteri_bul(customer_name)
        if customer:
            customer.odeme_yap(miktar, aciklama)
            return True
        return False

    def borclari_listele(self):
        return [
            f"{c.name} | {c.urun} | Borç: {c.borc:.2f}₺"
            for c in self.customers
        ] 