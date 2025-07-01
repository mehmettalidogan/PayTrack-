import sys
import os

# Projenin kök dizinini Python path'ine ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(project_root)

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