import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.models import Customer, User, save_pdf

def main():
    # Kullanıcı oluştur
    user = User("admin")
    
    while True:
        print("\n=== PayTrack Müşteri Takip Sistemi ===")
        print("1. Yeni Müşteri Ekle")
        print("2. Borç Ekle")
        print("3. Ödeme Al")
        print("4. Müşteri Listele")
        print("5. Müşteri Detay Görüntüle")
        print("6. PDF Raporu Oluştur")
        print("0. Çıkış")
        
        secim = input("\nSeçiminiz (0-6): ")
        
        if secim == "1":
            ad = input("Müşteri Adı: ")
            urun = input("Ürün: ")
            try:
                borc = float(input("Başlangıç Borç: "))
                user.musteri_ekle(ad, urun, borc)
                print(f"\n✓ {ad} isimli müşteri başarıyla eklendi!")
            except ValueError:
                print("\n❌ Hata: Geçersiz borç miktarı!")
                
        elif secim == "2":
            ad = input("Müşteri Adı: ")
            try:
                miktar = float(input("Borç Miktarı: "))
                aciklama = input("Açıklama (opsiyonel): ")
                if user.borc_ekle(ad, miktar, aciklama):
                    print(f"\n✓ {ad} için {miktar}₺ borç eklendi!")
                else:
                    print("\n❌ Hata: Müşteri bulunamadı!")
            except ValueError:
                print("\n❌ Hata: Geçersiz miktar!")
                
        elif secim == "3":
            ad = input("Müşteri Adı: ")
            try:
                miktar = float(input("Ödeme Miktarı: "))
                aciklama = input("Açıklama (opsiyonel): ")
                if user.odeme_yap(ad, miktar, aciklama):
                    print(f"\n✓ {ad} için {miktar}₺ ödeme alındı!")
                else:
                    print("\n❌ Hata: Müşteri bulunamadı!")
            except ValueError:
                print("\n❌ Hata: Geçersiz miktar!")
                
        elif secim == "4":
            print("\n=== Müşteri Listesi ===")
            for i, musteri in enumerate(user.borclari_listele(), 1):
                print(f"{i}. {musteri}")
                
        elif secim == "5":
            ad = input("Müşteri Adı: ")
            musteri = user.musteri_bul(ad)
            if musteri:
                print(f"\n=== {musteri.name} Detayları ===")
                print(f"Ürün: {musteri.urun}")
                print(f"Toplam Borç: {musteri.borc:.2f}₺")
                print("\nİşlem Geçmişi:")
                for islem in musteri.transactions:
                    print(islem)
            else:
                print("\n❌ Hata: Müşteri bulunamadı!")
                
        elif secim == "6":
            ad = input("Müşteri Adı: ")
            musteri = user.musteri_bul(ad)
            if musteri:
                try:
                    save_pdf(musteri)
                    print(f"\n✓ PDF raporu oluşturuldu: {musteri.name}_borc_raporu.pdf")
                except Exception as e:
                    print(f"\n❌ Hata: PDF oluşturulamadı! {str(e)}")
            else:
                print("\n❌ Hata: Müşteri bulunamadı!")
                
        elif secim == "0":
            print("\nProgramdan çıkılıyor...")
            break
            
        else:
            print("\n❌ Hata: Geçersiz seçim!")
            
        input("\nDevam etmek için Enter'a basın...")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nProgram sonlandırıldı.")
    except Exception as e:
        print(f"\n❌ Beklenmeyen bir hata oluştu: {str(e)}")
