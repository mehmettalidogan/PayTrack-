import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.database.database import db
from backend.models.user import User
from backend.models.customer import Customer, Transaction

app = Flask(__name__)
CORS(app)  # CORS desteği eklendi

# Absolute path to the database file
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "paytrack.db"))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

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

@app.route("/customers/", methods=["POST"])
def create_customer():
    data = request.get_json()
    user_id = data.get("user_id")
    name = data.get("name")
    urun = data.get("urun")
    borc = float(data.get("borc", 0.0))
    
    if not all([user_id, name, urun]):
        return jsonify({"error": "user_id, name ve urun alanları gerekli"}), 400
    
    user = db.session.query(User).filter(User.id == user_id).first()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    customer = user.musteri_ekle(name, urun, borc)
    return jsonify({
        "message": "Müşteri başarıyla eklendi",
        "customer_id": customer.id
    })

@app.route("/customers/borc-ekle/", methods=["POST"])
def add_debt():
    data = request.get_json()
    user_id = data.get("user_id")
    customer_name = data.get("customer_name")
    miktar = data.get("miktar")
    aciklama = data.get("aciklama", "")
    
    if not all([user_id, customer_name, miktar]):
        return jsonify({"error": "user_id, customer_name ve miktar alanları gerekli"}), 400
    
    try:
        miktar = float(miktar)
    except ValueError:
        return jsonify({"error": "Geçersiz miktar"}), 400
    
    user = db.session.query(User).filter(User.id == user_id).first()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    success = user.borc_ekle(customer_name, miktar, aciklama)
    if not success:
        return jsonify({"error": "Müşteri bulunamadı"}), 404
    
    return jsonify({"message": "Borç başarıyla eklendi"})

@app.route("/customers/odeme-yap/", methods=["POST"])
def make_payment():
    data = request.get_json()
    user_id = data.get("user_id")
    customer_name = data.get("customer_name")
    miktar = data.get("miktar")
    aciklama = data.get("aciklama", "")
    
    if not all([user_id, customer_name, miktar]):
        return jsonify({"error": "user_id, customer_name ve miktar alanları gerekli"}), 400
    
    try:
        miktar = float(miktar)
    except ValueError:
        return jsonify({"error": "Geçersiz miktar"}), 400
    
    user = db.session.query(User).filter(User.id == user_id).first()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    success = user.odeme_yap(customer_name, miktar, aciklama)
    if not success:
        return jsonify({"error": "Müşteri bulunamadı"}), 404
    
    return jsonify({"message": "Ödeme başarıyla kaydedildi"})

@app.route("/customers/", methods=["GET"])
def list_customers():
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id parametresi gerekli"}), 400
    
    user = db.session.query(User).filter(User.id == user_id).first()
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    return jsonify(user.borclari_listele())

if __name__ == "__main__":
    print(f"Database path: {db_path}")
    app.run(debug=True, host='0.0.0.0')
