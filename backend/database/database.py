from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import create_engine
import sqlite3
from pathlib import Path

class Base(DeclarativeBase):
    pass

# SQLite veritabanı yolu
DB_PATH = Path(__file__).parent / 'paytrack.db'
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'

# SQLAlchemy engine ve session oluştur
engine = create_engine(SQLALCHEMY_DATABASE_URI)
db = SQLAlchemy(model_class=Base)

# Database bağlantısı için dependency
def get_db():
    return db.session

class Database:
    def __init__(self):
        self.db_path = Path(__file__).parent / 'paytrack.db'
        self._create_tables()

    def _create_tables(self):
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            urun TEXT NOT NULL,
            borc REAL NOT NULL,
            transactions TEXT
        )
        ''')
        
        conn.commit()
        conn.close()

    def add_customer(self, customer) -> bool:
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                'INSERT INTO customers (user_id, name, urun, borc, transactions) VALUES (?, ?, ?, ?, ?)',
                (customer.user_id, customer.name, customer.urun, customer.borc, '[]')
            )
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error adding customer: {e}")
            return False

    def get_customers(self, user_id: str) -> list:
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute('SELECT name, urun, borc FROM customers WHERE user_id = ?', (user_id,))
            customers = cursor.fetchall()
            
            conn.close()
            
            return [f"{name} | {urun} | Borç: {borc}₺" for name, urun, borc in customers]
        except Exception as e:
            print(f"Error getting customers: {e}")
            return []

    def get_customer_by_name(self, user_id: str, name: str):
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                'SELECT name, urun, borc, transactions FROM customers WHERE user_id = ? AND name = ?',
                (user_id, name)
            )
            result = cursor.fetchone()
            
            conn.close()
            
            if result:
                from ..models.customer import Customer  # Import here to avoid circular import
                name, urun, borc, transactions = result
                customer = Customer(user_id=user_id, name=name, urun=urun, borc=borc)
                customer.transactions = eval(transactions) if transactions else []
                return customer
            
            return None
        except Exception as e:
            print(f"Error getting customer by name: {e}")
            return None

    def update_customer(self, customer) -> bool:
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            cursor.execute(
                'UPDATE customers SET borc = ?, transactions = ? WHERE user_id = ? AND name = ?',
                (customer.borc, str(customer.transactions), customer.user_id, customer.name)
            )
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating customer: {e}")
            return False
