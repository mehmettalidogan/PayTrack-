from datetime import datetime
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from ..database.database import Base, db
from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    
    # İlişkiler
    customers: Mapped[List["Customer"]] = relationship(back_populates="user")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @classmethod
    def create_user(cls, username: str, password: str) -> "User":
        user = cls(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user

    def musteri_ekle(self, name: str, urun: str, borc: float = 0.0) -> "Customer":
        from .customer import Customer
        
        customer = Customer(
            name=name,
            urun=urun,
            borc=float(borc),
            user_id=self.id
        )
        db.session.add(customer)
        db.session.commit()
        db.session.refresh(customer)
        
        # İlk transaction'ı oluştur
        if borc > 0:
            customer.add_transaction('borc', borc, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        return customer

    def musteri_bul(self, name: str) -> Optional["Customer"]:
        return db.session.query(Customer).filter(
            Customer.user_id == self.id,
            Customer.name.ilike(f"%{name}%")
        ).first()

    def borc_ekle(self, customer_name: str, miktar: float, aciklama: str = "") -> bool:
        customer = self.musteri_bul(customer_name)
        if customer:
            customer.add_transaction('borc', miktar, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            return True
        return False

    def odeme_yap(self, customer_name: str, miktar: float, aciklama: str = "") -> bool:
        customer = self.musteri_bul(customer_name)
        if customer:
            customer.add_transaction('odeme', miktar, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            return True
        return False

    def borclari_listele(self) -> List[str]:
        customers = db.session.query(Customer).filter(Customer.user_id == self.id).all()
        return [str(c) for c in customers] 