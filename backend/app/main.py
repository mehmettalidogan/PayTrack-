import sys
import os
import subprocess

# Proje kök dizinini Python path'ine ekle
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.database.database import db
from backend.models.user import User
from backend.models.customer import Customer, Transaction
from backend.models.pdf_generator import save_pdf, delete_old_pdfs
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Absolute path to the database file
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "paytrack.db"))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# PDF dosyalarının bulunduğu dizin
PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')

# Flask-SQLAlchemy'yi başlat
db.init_app(app)

# Veritabanı tablolarını oluştur
with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return jsonify({
        "message": "PayTrack API çalışıyor",
        "endpoints": {
            "POST /users/": "Yeni kullanıcı oluştur",
            "POST /customers/": "Yeni müşteri ekle",
            "GET /customers/": "Müşterileri listele",
            "POST /customers/borc-ekle/": "Borç ekle",
            "POST /customers/odeme-yap/": "Ödeme yap"
        }
    })

@app.route("/users/", methods=["POST"])
def create_user():
    data = request.get_json()
    username = data.get("username")
    
    if not username:
        return jsonify({"error": "Kullanıcı adı gerekli"}), 400
    
    existing_user = db.session.query(User).filter(User.username == username).first()
    if existing_user:
        return jsonify({"error": "Kullanıcı adı zaten kullanımda"}), 400
    
    user = User(username=username)
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        "message": "Kullanıcı başarıyla oluşturuldu",
        "user_id": user.id
    })

@app.route("/customers/", methods=["GET", "POST"])
def handle_customers():
    if request.method == 'GET':
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id gerekli!'}), 400
        
        try:
            customers = db.session.query(Customer).filter_by(user_id=user_id).all()
            return jsonify([str(customer) for customer in customers])
        except Exception as e:
            return jsonify({'error': f'Müşteriler alınırken bir hata oluştu: {str(e)}'}), 500
    
    elif request.method == 'POST':
        data = request.json
        required_fields = ['user_id', 'name', 'urun', 'borc']
        
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Eksik alanlar var!'}), 400
        
        try:
            customer = Customer(
                user_id=data['user_id'],
                name=data['name'],
                urun=data['urun'],
                borc=float(data['borc'])
            )
            db.session.add(customer)
            db.session.commit()
            return jsonify({'message': 'Müşteri başarıyla eklendi!'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Müşteri eklenirken bir hata oluştu: {str(e)}'}), 500

@app.route('/customers/borc-ekle/', methods=['POST'])
def add_debt():
    data = request.json
    required_fields = ['user_id', 'customer_name', 'amount']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Eksik alanlar var!'}), 400
    
    try:
        customer = db.session.query(Customer).filter_by(
            user_id=data['user_id'],
            name=data['customer_name']
        ).first()
        
        if not customer:
            return jsonify({'error': 'Müşteri bulunamadı!'}), 404
        
        amount = float(data['amount'])
        description = data.get('description', '')  # Açıklama alanını al
        customer.add_transaction('borc', amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), description)
        db.session.commit()
        
        return jsonify({'message': 'Borç başarıyla eklendi!'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Borç eklenirken bir hata oluştu: {str(e)}'}), 500

@app.route("/customers/odeme-yap/", methods=["POST"])
def make_payment():
    data = request.get_json()
    user_id = data.get("user_id")
    customer_name = data.get("customer_name")
    amount = data.get("amount")
    description = data.get("description", "")  # Açıklama alanını al
    
    if not all([user_id, customer_name, amount]):
        return jsonify({"error": "user_id, customer_name ve amount alanları gerekli"}), 400
    
    try:
        amount = float(amount)
        customer = db.session.query(Customer).filter_by(
            user_id=user_id,
            name=customer_name
        ).first()
        
        if not customer:
            return jsonify({"error": "Müşteri bulunamadı"}), 404
        
        customer.add_transaction('odeme', amount, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), description)
        db.session.commit()
        
        return jsonify({"message": "Ödeme başarıyla kaydedildi"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Ödeme yapılırken bir hata oluştu: {str(e)}"}), 500

@app.route("/generate-pdf/", methods=["POST"])
def generate_pdf():
    data = request.json
    required_fields = ['user_id', 'customer_name']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Eksik alanlar var!'}), 400
    
    try:
        customer = db.session.query(Customer).filter_by(
            user_id=data['user_id'],
            name=data['customer_name']
        ).first()
        
        if not customer:
            return jsonify({'error': 'Müşteri bulunamadı!'}), 404
        
        pdf_path = save_pdf(customer)
        filename = os.path.basename(pdf_path)
        
        return jsonify({
            'message': 'PDF başarıyla oluşturuldu!',
            'filename': filename,
            'url': f'/pdf/{filename}'
        })
    except Exception as e:
        return jsonify({'error': f'PDF oluşturulurken bir hata oluştu: {str(e)}'}), 500

@app.route('/dashboard/', methods=['GET'])
def get_dashboard_data():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id gerekli!'}), 400
    
    try:
        customers = db.session.query(Customer).filter_by(user_id=user_id).all()
        total_customers = len(customers)
        total_debt = sum(customer.borc for customer in customers)
        
        # Son işlemleri topla
        recent_transactions = []
        for customer in customers:
            recent_transactions.extend(customer.get_recent_transactions())
        
        recent_transactions.sort(key=lambda x: x.timestamp, reverse=True)
        recent_transactions = recent_transactions[:10]  # Son 10 işlem
        
        return jsonify({
            'totalCustomers': total_customers,
            'totalDebt': total_debt,
            'recentTransactions': len(recent_transactions),
            'transactions': [{
                'customerName': t.customer.name,
                'type': t.transaction_type,
                'amount': t.amount,
                'date': t.timestamp
            } for t in recent_transactions]
        })
    except Exception as e:
        return jsonify({'error': f'Veriler alınırken bir hata oluştu: {str(e)}'}), 500

@app.route('/login/', methods=['POST'])
def login():
    data = request.json
    required_fields = ['username', 'password']
    
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Eksik alanlar var!'}), 400
    
    try:
        # Basit bir doğrulama - gerçek uygulamada güvenli bir şekilde yapılmalı
        if data['username'] == 'admin' and data['password'] == 'admin':
            return jsonify({
                'message': 'Giriş başarılı!',
                'user_id': 'admin'
            })
        else:
            return jsonify({'error': 'Geçersiz kullanıcı adı veya şifre!'}), 401
    except Exception as e:
        return jsonify({'error': f'Giriş yapılırken bir hata oluştu: {str(e)}'}), 500

@app.route('/pdf/<filename>')
def get_pdf(filename):
    """PDF dosyasını indir"""
    return send_from_directory(PDF_DIR, filename)

@app.route('/pdf/list/<customer_name>')
def list_pdfs(customer_name):
    """Müşteriye ait en son PDF'i listele"""
    try:
        # Reports klasörünü kontrol et
        reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'reports')
        
        # Müşterinin tüm PDF'lerini bul ve tarihe göre sırala
        pdfs = sorted(
            [f for f in os.listdir(reports_dir) if f.startswith(f'rapor_{customer_name}_')],
            key=lambda x: os.path.getmtime(os.path.join(reports_dir, x)),
            reverse=True
        )
        
        if pdfs:
            latest_pdf = pdfs[0]  # En son oluşturulan PDF
            
            # Eski PDF'leri sil
            for old_pdf in pdfs[1:]:
                try:
                    old_pdf_path = os.path.join(reports_dir, old_pdf)
                    subprocess.run(['del', '/F', '/Q', old_pdf_path], shell=True, check=True)
                except:
                    pass  # Hata olursa devam et
            
            return jsonify({
                'success': True,
                'pdfs': [{'filename': latest_pdf, 'url': f'/pdf/{latest_pdf}'}]
            })
        
        return jsonify({
            'success': True,
            'pdfs': []
        })
    except Exception as e:
        print(f"PDF listeleme hatası: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/customers/transactions/<customer_name>', methods=['GET'])
def get_customer_transactions(customer_name):
    """Müşterinin işlem geçmişini döndürür"""
    try:
        customer = db.session.query(Customer).filter_by(name=customer_name).first()
        
        if not customer:
            return jsonify({'error': 'Müşteri bulunamadı!'}), 404
        
        transactions = customer.get_transaction_history()
        return jsonify({
            'success': True,
            'transactions': [t.to_dict() for t in transactions]
        })
    except Exception as e:
        return jsonify({'error': f'İşlem geçmişi alınırken bir hata oluştu: {str(e)}'}), 500

@app.route("/test-log")
def test_log():
    print("Test log: Backend çalışıyor!")
    return jsonify({"message": "Test başarılı, terminal loglarını kontrol et!"})

@app.route('/customers/<customer_name>', methods=['DELETE'])
def delete_customer(customer_name):
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id gerekli!'}), 400
    
    try:
        customer = db.session.query(Customer).filter_by(
            user_id=user_id,
            name=customer_name
        ).first()
        
        if not customer:
            return jsonify({'error': 'Müşteri bulunamadı!'}), 404
        
        # Müşteriyi sil
        db.session.delete(customer)
        db.session.commit()
        
        return jsonify({'message': 'Müşteri başarıyla silindi!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Müşteri silinirken bir hata oluştu: {str(e)}'}), 500

if __name__ == "__main__":
    print(f"Database path: {db_path}")
    app.run(debug=True, host='0.0.0.0')
