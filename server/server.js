import express       from "express";
import colors        from "colors";
import morgan        from "morgan";
import cors          from "cors";
import dotenv        from "dotenv";
import cookieParser  from "cookie-parser";
import cloudinary    from "cloudinary";
import Stripe        from "stripe";
import helmet        from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import connectDB     from "./config/db.js";

dotenv.config();
connectDB();

export const stripe = new Stripe(process.env.STRIPE_API_SECRET || "sk_test_placeholder");

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(mongoSanitize());
app.use(cors({
  origin:         true,
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials:    true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import testRoutes     from "./routes/testRoutes.js";
import userRoutes     from "./routes/userRoutes.js";
import productRoutes  from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes    from "./routes/orderRoutes.js";

app.use("/api/v1",         testRoutes);
app.use("/api/v1/user",    userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/cat",     categoryRoutes);
app.use("/api/v1/order",   orderRoutes);

app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html><html><head><title>ShopLux API</title></head>
    <body style="font-family:sans-serif;background:#0c0c0c;color:#f0ede8;text-align:center;padding:80px">
      <h1 style="color:#c9a84c;font-size:2.5rem">◆ ShopLux API</h1>
      <p>Server running on port <b>${process.env.PORT || 8080}</b></p>
      <p style="color:#777">Mode: ${process.env.NODE_ENV || "development"}</p>
      <hr style="border-color:#222;margin:30px auto;max-width:400px"/>
      <p style="color:#555;font-size:.9rem">Available: /api/v1/user | /api/v1/product | /api/v1/cat | /api/v1/order</p>
    </body></html>`);
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("\n  ◆ ShopLux Server".bgMagenta.white);
  console.log(`  Port : ${PORT}`.cyan);
  console.log(`  Mode : ${process.env.NODE_ENV || "development"}`.yellow);
  console.log(`  URL  : http://localhost:${PORT}\n`.green);
});