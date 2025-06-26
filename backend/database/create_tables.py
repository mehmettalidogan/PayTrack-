import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.database.database import Base, engine
from backend.models.user import User
from backend.models.customer import Customer, Transaction

def init_db():
    # Tüm tabloları oluştur
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Veritabanı tabloları oluşturuluyor...")
    init_db()
    print("Veritabanı tabloları başarıyla oluşturuldu!") 