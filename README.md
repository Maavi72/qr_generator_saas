# 🚀 QR Code Generator SaaS

A full-stack **QR Code Generator SaaS** built with **Django REST Framework + React**, featuring authentication, static & dynamic QR codes, Stripe payments, and analytics.

---

## 🔥 Features

### 🔐 Authentication

* User Registration & Login (JWT आधारित)
* Secure API access with tokens

### 🔳 QR Code System

* Generate **Static QR Codes** (Free users)
* Generate **Dynamic QR Codes** (PRO users)
* Download QR images
* Update/Delete QR codes

### 💎 PRO Features

* Editable QR destination (dynamic QR)
* Upgrade to PRO via Stripe payments
* Access to premium features

### 💳 Payment Integration

* Stripe Checkout integration
* Webhook-based payment verification
* Automatic user upgrade (`is_pro = True`)

### 📊 Analytics (Dynamic QR Only)

* Track QR scans
* Device & usage insights
* Scan count per QR

### 🎨 Frontend UI

* Built with React
* Clean dashboard interface
* Dark mode support (optional)
* Responsive design

---

## 🏗️ Tech Stack

### Backend

* Django
* Django REST Framework
* SimpleJWT
* Stripe

### Frontend

* React
* Axios

### Other Tools

* QRCode (Python)
* Pillow (Image handling)

---

## 📂 Project Structure

```
qr_saas/
│
├── accounts/        # Authentication system
├── qr/              # QR code logic
├── payments/        # Stripe integration
├── media/           # Generated QR images
├── manage.py
│
frontend/
├── src/
├── components/
├── pages/
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```
git clone https://github.com/your-username/qr-saas.git
cd qr-saas
```

---

### 2️⃣ Backend Setup

```
python -m venv env
env\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

---

### 3️⃣ Frontend Setup

```
cd frontend
npm install
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in backend:

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## 💳 Stripe Testing

Use test card:

```
4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

Run webhook listener:

```
stripe listen --forward-to localhost:8000/api/payment/webhook/
```

---

## 📡 API Endpoints

### Auth

* POST `/api/register/`
* POST `/api/login/`

### QR Codes

* POST `/api/qr/create-static/`
* POST `/api/qr/create-dynamic/`
* GET `/api/qr/`
* DELETE `/api/qr/{id}/`

### Analytics

* GET `/api/qr/{id}/analytics/`

### Payments

* POST `/api/payment/create-checkout/`
* POST `/api/payment/webhook/`

---

## 🧠 Key Concepts Implemented

* JWT Authentication
* File handling (QR image generation)
* Stripe payment flow (Checkout + Webhook)
* Role-based access (Free vs PRO users)
* API design with DRF
* Full-stack integration (React + Django)

---

## 🚀 Future Improvements

* Advanced analytics (charts & graphs)
* Custom QR styling (colors, logo)
* Subscription-based payments
* Deployment (AWS / Vercel / Render)

---

## 👨‍💻 Author

Ahmed Muavia

---

## ⭐ Contribute

Pull requests are welcome. For major changes, please open an issue first.

---

## 📜 License

This project is open-source and free to use.
