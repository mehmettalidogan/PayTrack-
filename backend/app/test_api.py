import requests
import json

BASE_URL = "http://localhost:5000"

def test_api():
    # 1. Test ana sayfa
    print("\n1. Ana sayfa testi:")
    response = requests.get(f"{BASE_URL}/")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    # 2. Kullanıcı oluştur
    print("\n2. Kullanıcı oluşturma testi:")
    response = requests.post(
        f"{BASE_URL}/users/",
        json={"username": "test_user"}
    )
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    user_id = response.json().get("user_id")

    # 3. Müşteri ekle
    print("\n3. Müşteri ekleme testi:")
    response = requests.post(
        f"{BASE_URL}/customers/",
        json={
            "user_id": user_id,
            "name": "Ahmet",
            "urun": "Ekmek",
            "borc": 50.0
        }
    )
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    # 4. Borç ekle
    print("\n4. Borç ekleme testi:")
    response = requests.post(
        f"{BASE_URL}/customers/borc-ekle/",
        json={
            "user_id": user_id,
            "customer_name": "Ahmet",
            "miktar": 25.0,
            "aciklama": "İlave borç"
        }
    )
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    # 5. Müşterileri listele
    print("\n5. Müşteri listeleme testi:")
    response = requests.get(f"{BASE_URL}/customers/", params={"user_id": user_id})
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    # 6. Ödeme yap
    print("\n6. Ödeme yapma testi:")
    response = requests.post(
        f"{BASE_URL}/customers/odeme-yap/",
        json={
            "user_id": user_id,
            "customer_name": "Ahmet",
            "miktar": 30.0,
            "aciklama": "Kısmi ödeme"
        }
    )
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    # 7. Son durumu kontrol et
    print("\n7. Son durum kontrolü:")
    response = requests.get(f"{BASE_URL}/customers/", params={"user_id": user_id})
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_api() 