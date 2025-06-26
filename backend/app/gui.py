import tkinter as tk
from tkinter import ttk, messagebox
import requests
import json

class PayTrackGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("PayTrack")
        self.root.geometry("800x600")
        
        # API URL
        self.BASE_URL = "http://localhost:5000"
        
        # Kullanıcı girişi
        self.user_id = None
        self.setup_user_login()
        
    def setup_user_login(self):
        # Kullanıcı girişi frame
        login_frame = ttk.LabelFrame(self.root, text="Kullanıcı Girişi", padding=10)
        login_frame.pack(fill="x", padx=10, pady=5)
        
        ttk.Label(login_frame, text="Kullanıcı Adı:").pack(side="left", padx=5)
        self.username_entry = ttk.Entry(login_frame)
        self.username_entry.pack(side="left", padx=5)
        
        ttk.Button(login_frame, text="Giriş Yap", command=self.login).pack(side="left", padx=5)
        
    def setup_main_interface(self):
        # Ana arayüz frame'leri
        self.create_customer_frame()
        self.create_transaction_frame()
        self.create_customer_list_frame()
        
    def create_customer_frame(self):
        # Müşteri ekleme frame
        customer_frame = ttk.LabelFrame(self.root, text="Yeni Müşteri Ekle", padding=10)
        customer_frame.pack(fill="x", padx=10, pady=5)
        
        # Müşteri adı
        ttk.Label(customer_frame, text="Müşteri Adı:").grid(row=0, column=0, padx=5, pady=2)
        self.customer_name_entry = ttk.Entry(customer_frame)
        self.customer_name_entry.grid(row=0, column=1, padx=5, pady=2)
        
        # Ürün
        ttk.Label(customer_frame, text="Ürün:").grid(row=1, column=0, padx=5, pady=2)
        self.product_entry = ttk.Entry(customer_frame)
        self.product_entry.grid(row=1, column=1, padx=5, pady=2)
        
        # Başlangıç borcu
        ttk.Label(customer_frame, text="Başlangıç Borcu:").grid(row=2, column=0, padx=5, pady=2)
        self.initial_debt_entry = ttk.Entry(customer_frame)
        self.initial_debt_entry.grid(row=2, column=1, padx=5, pady=2)
        self.initial_debt_entry.insert(0, "0")
        
        # Ekle butonu
        ttk.Button(customer_frame, text="Müşteri Ekle", command=self.add_customer).grid(row=3, column=0, columnspan=2, pady=10)
        
    def create_transaction_frame(self):
        # İşlem frame
        transaction_frame = ttk.LabelFrame(self.root, text="Borç/Ödeme İşlemleri", padding=10)
        transaction_frame.pack(fill="x", padx=10, pady=5)
        
        # Müşteri adı
        ttk.Label(transaction_frame, text="Müşteri Adı:").grid(row=0, column=0, padx=5, pady=2)
        self.transaction_customer_entry = ttk.Entry(transaction_frame)
        self.transaction_customer_entry.grid(row=0, column=1, padx=5, pady=2)
        
        # Miktar
        ttk.Label(transaction_frame, text="Miktar:").grid(row=1, column=0, padx=5, pady=2)
        self.amount_entry = ttk.Entry(transaction_frame)
        self.amount_entry.grid(row=1, column=1, padx=5, pady=2)
        
        # Açıklama
        ttk.Label(transaction_frame, text="Açıklama:").grid(row=2, column=0, padx=5, pady=2)
        self.description_entry = ttk.Entry(transaction_frame)
        self.description_entry.grid(row=2, column=1, padx=5, pady=2)
        
        # İşlem butonları
        button_frame = ttk.Frame(transaction_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=10)
        
        ttk.Button(button_frame, text="Borç Ekle", command=self.add_debt).pack(side="left", padx=5)
        ttk.Button(button_frame, text="Ödeme Yap", command=self.make_payment).pack(side="left", padx=5)
        
    def create_customer_list_frame(self):
        # Müşteri listesi frame
        list_frame = ttk.LabelFrame(self.root, text="Müşteri Listesi", padding=10)
        list_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Yenile butonu
        ttk.Button(list_frame, text="Listeyi Yenile", command=self.refresh_customer_list).pack(pady=5)
        
        # Liste
        self.customer_list = ttk.Treeview(list_frame, columns=("name", "product", "debt"), show="headings")
        self.customer_list.heading("name", text="Müşteri Adı")
        self.customer_list.heading("product", text="Ürün")
        self.customer_list.heading("debt", text="Borç")
        self.customer_list.pack(fill="both", expand=True)
        
    def login(self):
        username = self.username_entry.get().strip()
        if not username:
            messagebox.showerror("Hata", "Kullanıcı adı gerekli!")
            return
            
        try:
            response = requests.post(
                f"{self.BASE_URL}/users/",
                json={"username": username}
            )
            data = response.json()
            
            if response.status_code == 200:
                self.user_id = data["user_id"]
                messagebox.showinfo("Başarılı", "Giriş yapıldı!")
                self.setup_main_interface()
            else:
                messagebox.showerror("Hata", data.get("error", "Bir hata oluştu!"))
                
        except requests.exceptions.RequestException as e:
            messagebox.showerror("Hata", f"API'ye bağlanılamadı: {str(e)}")
            
    def add_customer(self):
        if not self.user_id:
            messagebox.showerror("Hata", "Önce giriş yapmalısınız!")
            return
            
        name = self.customer_name_entry.get().strip()
        product = self.product_entry.get().strip()
        debt = self.initial_debt_entry.get().strip()
        
        if not all([name, product]):
            messagebox.showerror("Hata", "Müşteri adı ve ürün gerekli!")
            return
            
        try:
            debt = float(debt)
        except ValueError:
            messagebox.showerror("Hata", "Geçersiz borç miktarı!")
            return
            
        try:
            response = requests.post(
                f"{self.BASE_URL}/customers/",
                json={
                    "user_id": self.user_id,
                    "name": name,
                    "urun": product,
                    "borc": debt
                }
            )
            data = response.json()
            
            if response.status_code == 200:
                messagebox.showinfo("Başarılı", "Müşteri eklendi!")
                self.refresh_customer_list()
                # Form temizleme
                self.customer_name_entry.delete(0, tk.END)
                self.product_entry.delete(0, tk.END)
                self.initial_debt_entry.delete(0, tk.END)
                self.initial_debt_entry.insert(0, "0")
            else:
                messagebox.showerror("Hata", data.get("error", "Bir hata oluştu!"))
                
        except requests.exceptions.RequestException as e:
            messagebox.showerror("Hata", f"API'ye bağlanılamadı: {str(e)}")
            
    def add_debt(self):
        self._make_transaction("borc-ekle")
        
    def make_payment(self):
        self._make_transaction("odeme-yap")
        
    def _make_transaction(self, transaction_type):
        if not self.user_id:
            messagebox.showerror("Hata", "Önce giriş yapmalısınız!")
            return
            
        customer_name = self.transaction_customer_entry.get().strip()
        amount = self.amount_entry.get().strip()
        description = self.description_entry.get().strip()
        
        if not all([customer_name, amount]):
            messagebox.showerror("Hata", "Müşteri adı ve miktar gerekli!")
            return
            
        try:
            amount = float(amount)
        except ValueError:
            messagebox.showerror("Hata", "Geçersiz miktar!")
            return
            
        try:
            response = requests.post(
                f"{self.BASE_URL}/customers/{transaction_type}/",
                json={
                    "user_id": self.user_id,
                    "customer_name": customer_name,
                    "miktar": amount,
                    "aciklama": description
                }
            )
            data = response.json()
            
            if response.status_code == 200:
                messagebox.showinfo("Başarılı", data.get("message", "İşlem başarılı!"))
                self.refresh_customer_list()
                # Form temizleme
                self.transaction_customer_entry.delete(0, tk.END)
                self.amount_entry.delete(0, tk.END)
                self.description_entry.delete(0, tk.END)
            else:
                messagebox.showerror("Hata", data.get("error", "Bir hata oluştu!"))
                
        except requests.exceptions.RequestException as e:
            messagebox.showerror("Hata", f"API'ye bağlanılamadı: {str(e)}")
            
    def refresh_customer_list(self):
        if not self.user_id:
            messagebox.showerror("Hata", "Önce giriş yapmalısınız!")
            return
            
        try:
            response = requests.get(
                f"{self.BASE_URL}/customers/",
                params={"user_id": self.user_id}
            )
            data = response.json()
            
            if response.status_code == 200:
                # Listeyi temizle
                for item in self.customer_list.get_children():
                    self.customer_list.delete(item)
                    
                # Yeni verileri ekle
                for customer_str in data:
                    name, product, debt_str = customer_str.split(" | ")
                    debt = debt_str.replace("Borç: ", "").replace("₺", "")
                    self.customer_list.insert("", "end", values=(name, product, debt))
            else:
                messagebox.showerror("Hata", data.get("error", "Bir hata oluştu!"))
                
        except requests.exceptions.RequestException as e:
            messagebox.showerror("Hata", f"API'ye bağlanılamadı: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = PayTrackGUI(root)
    root.mainloop() 