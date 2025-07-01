from datetime import datetime
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from ..database.database import Base, db
import random

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    urun: Mapped[str] = mapped_column(String(100))
    borc: Mapped[float] = mapped_column(Float, default=0.0)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    # İlişkiler
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="customer")
    user: Mapped["User"] = relationship(back_populates="customers")
    
    def __init__(self, name: str, urun: str, borc: float, user_id: int):
        self.name = name
        self.urun = urun
        self.borc = borc
        self.user_id = user_id
        self.transactions = []  # [{type: 'borc'|'odeme', amount: float, date: str}]

    def add_transaction(self, transaction_type: str, amount: float, date: str):
        """Müşteriye yeni bir işlem ekler"""
        if transaction_type not in ['borc', 'odeme']:
            raise ValueError("İşlem tipi 'borc' veya 'odeme' olmalıdır!")
        
        transaction = Transaction(
            amount=float(amount),
            transaction_type=transaction_type,
            description=f"{'Borç' if transaction_type == 'borc' else 'Ödeme'} işlemi",
            customer_id=self.id
        )
        db.session.add(transaction)
        
        if transaction_type == 'borc':
            self.borc += amount
        else:  # odeme
            self.borc -= amount
            if self.borc < 0:
                self.borc = 0.0
        
        db.session.commit()

    def get_recent_transactions(self, limit: int = 5) -> list:
        """Son işlemleri döndürür"""
        return sorted(
            [t for t in self.transactions],
            key=lambda x: x.timestamp,
            reverse=True
        )[:limit]

    def get_total_debt(self) -> float:
        """Toplam borç miktarını döndürür"""
        return self.borc

    def get_transaction_history(self) -> list:
        """Tüm işlem geçmişini döndürür"""
        return sorted([t for t in self.transactions], key=lambda x: x.timestamp)

    def __str__(self) -> str:
        return f"{self.name} | {self.urun} | Borç: {self.borc}₺"

    def customer_id(self) -> str:
        """Her müşteri için benzersiz bir id oluşturur"""
        while True:
            code = str(random.randint(10000, 99999))
            already_exist = db.session.query(Customer).filter_by(user_id=self.user_id, customer_code=code).first()
            if not already_exist:
                return code

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    timestamp: Mapped[str] = mapped_column(
        String(50), 
        default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    amount: Mapped[float] = mapped_column(Float)
    transaction_type: Mapped[str] = mapped_column(String(20))  # "borc" veya "odeme"
    description: Mapped[str] = mapped_column(String(200), default="")
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))

    # İlişkiler
    customer: Mapped["Customer"] = relationship(back_populates="transactions") 