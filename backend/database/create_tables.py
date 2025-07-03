import sqlite3
import os

def create_tables():
    # Veritabanı dosyasının yolu
    db_path = os.path.join(os.path.dirname(__file__), 'paytrack.db')
    
    # Eğer veritabanı dosyası varsa sil
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Veritabanına bağlan
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Users tablosunu oluştur
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    )
    ''')
    
    # Customers tablosunu oluştur
    cursor.execute('''
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        urun TEXT NOT NULL,
        borc REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Transactions tablosunu oluştur
    cursor.execute('''
    CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        transaction_type TEXT NOT NULL,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
    ''')
    
    # Değişiklikleri kaydet ve bağlantıyı kapat
    conn.commit()
    conn.close()
    
    print("Veritabanı tabloları başarıyla oluşturuldu!")

if __name__ == "__main__":
    create_tables() 