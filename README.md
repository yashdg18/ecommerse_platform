<<<<<<< HEAD
# ◆ ShopLux — E-Commerce REST API

A production-ready Node.js/Express REST API for an e-commerce platform with JWT auth, Cloudinary image uploads, Stripe payments, and MongoDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Images | Cloudinary |
| Payments | Stripe |
| Security | Helmet, CORS, Mongo-Sanitize, Rate Limiting |

## API Endpoints

### Users `/api/v1/user`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login & receive JWT |
| GET | `/profile` | ✅ | Get logged-in user profile |
| GET | `/logout` | ✅ | Logout user |
| PUT | `/profile-update` | ✅ | Update profile details |
| PUT | `/update-password` | ✅ | Change password |
| PUT | `/update-picture` | ✅ | Update profile picture |
| POST | `/reset-password` | ❌ | Forgot password reset |

### Products `/api/v1/product`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/get-all` | ❌ | Get all products (supports `?keyword=`) |
| GET | `/top` | ❌ | Get top 3 rated products |
| GET | `/:id` | ❌ | Get single product |
| POST | `/create` | 🔐 Admin | Create product with image |
| PUT | `/:id` | 🔐 Admin | Update product details |
| PUT | `/image/:id` | 🔐 Admin | Add product image |
| DELETE | `/delete-image/:id` | 🔐 Admin | Remove product image |
| DELETE | `/delete/:id` | 🔐 Admin | Delete product |
| PUT | `/:id/review` | ✅ | Add product review |

### Categories `/api/v1/cat`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/get-all` | ❌ | Get all categories |
| POST | `/create` | 🔐 Admin | Create category |
| PUT | `/:id` | 🔐 Admin | Update category |
| DELETE | `/:id` | 🔐 Admin | Delete category |

### Orders `/api/v1/order`
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/create` | ✅ | Place new order |
| GET | `/my-orders` | ✅ | Get user's orders |
| GET | `/all-orders` | 🔐 Admin | Get all orders |
| PUT | `/:id` | 🔐 Admin | Update order status |

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/yashdg18/shoplux.git
cd shoplux/server

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env

# 4. Run in development
npm run dev
```

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

```
MONGO_URI=        # MongoDB Atlas connection string
JWT_SECRET=       # Any long random string
CLOUDINARY_NAME=  # From cloudinary.com dashboard
CLOUDINARY_API_KEY=
CLOUDINARY_SECRET=
STRIPE_API_SECRET= # From stripe dashboard
CLIENT_URL=       # Your frontend URL (for CORS)
```

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set **Root Directory** to `server`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add all environment variables from `.env.example`
8. Deploy!

## Project Structure

```
shoplux/
├── server/                 # Backend API
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── controllers/        # Business logic
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT auth + admin check
│   │   └── multer.js          # File upload handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── utils/
│   │   └── features.js     # Cloudinary data URI helper
│   ├── server.js           # App entry point
│   └── package.json
├── index.html              # Frontend
├── app.js                  # Frontend JS
├── style.css               # Frontend styles
├── render.yaml             # Render deployment config
└── .gitignore
```
=======
# ecommerse_platform
>>>>>>> 628953f46627e22e0c2c110d3d2889926d085696
