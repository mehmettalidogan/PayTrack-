from datetime import datetime
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from ..database.database import Base, db

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    urun: Mapped[str] = mapped_column(String(100))
    borc: Mapped[float] = mapped_column(Float, default=0.0)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    # İlişkiler
    user = relationship("User", back_populates="customers")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="customer")

    def borc_ekle(self, miktar: float, aciklama: str = "") -> None:
        self.borc += float(miktar)
        transaction = Transaction(
            amount=float(miktar),
            transaction_type="borc",
            description=aciklama,
            customer_id=self.id
        )
        db.session.add(transaction)
        db.session.commit()

    def odeme_yap(self, miktar: float, aciklama: str = "") -> None:
        self.borc -= float(miktar)
        if self.borc < 0:
            self.borc = 0.0
        transaction = Transaction(
            amount=float(miktar),
            transaction_type="odeme",
            description=aciklama,
            customer_id=self.id
        )
        db.session.add(transaction)
        db.session.commit()

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