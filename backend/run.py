import os
import sys
import logging

# Proje kök dizinini Python path'ine ekle
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_root)

# Logging ayarları
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

from backend.app.main import app

if __name__ == "__main__":
    print("\n=== PayTrack Backend Başlatılıyor ===")
    print(f"Proje dizini: {project_root}")
    
    # Reports klasörünü oluştur
    reports_dir = os.path.join(project_root, 'backend', 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    print(f"Reports dizini: {os.path.abspath(reports_dir)}")
    
    # Reports klasörü yazma izinlerini kontrol et
    try:
        test_file = os.path.join(reports_dir, 'test.txt')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
        print("Reports dizini yazılabilir ✓")
    except Exception as e:
        print(f"HATA: Reports dizinine yazılamıyor! {str(e)}")
        sys.exit(1)
    
    # Flask uygulamasını başlat
    print("\nFlask uygulaması başlatılıyor...")
    print("Backend URL: http://localhost:5000")
    print("Log seviyesi: DEBUG")
    print("\nÇıkmak için: CTRL+C\n")
    sys.stdout.flush()
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        use_reloader=True
    ) 