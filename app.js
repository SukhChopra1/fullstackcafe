/* ================= ENVIRONMENT ================= */
require("dotenv").config();

/* ================= IMPORTS ================= */
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");

let MongoStore = require("connect-mongo");
if (typeof MongoStore !== "function" && MongoStore.default) {
    MongoStore = MongoStore.default;
}

const connectDB = require("./config/db");
const { checkAuth } = require("./controllers/authcontroller");

/* ================= APP & SERVER INIT ================= */
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

/* ================= DATABASE ================= */
connectDB();

/* ================= VIEW ENGINE ================= */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* ================= GLOBAL MIDDLEWARE ================= */
app.set("trust proxy", 1); // ✅ REQUIRED for Render/Heroku to handle HTTPS sessions
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= STATIC FILES ================= */
// 1. Serve the main public folder
app.use(express.static(path.join(__dirname, "public")));

// 2. Explicitly serve the uploads folder so that src="/uploads/img.jpg" works
// Note: This assumes your folder structure is project/public/uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* ================= SESSION ================= */
app.use(session({
    secret: process.env.SESSION_SECRET || "cafe_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions",
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Only true if using HTTPS
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
    }
}));

/* ================= SOCKET.IO ================= */
app.set("socketio", io);

io.on("connection", (socket) => {
    socket.on("join", (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User connected: ${userId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

/* ================= AUTH ================= */
app.use(checkAuth);

/* ================= GLOBAL VARIABLES ================= */
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    res.locals.session = req.session;
    res.locals.user = req.user || null;
    res.locals.cartCount = req.session.cart.length;

    next();
});

/* ================= ROUTES ================= */
app.use("/", require("./routes/authroutes"));
app.use("/support", require("./routes/supportroutes"));
app.use("/products", require("./routes/productRoutes"));
app.use("/admin", require("./routes/adminroute"));
app.use("/cart", require("./routes/cartRoutes"));

// Redirect root to products if not handled by authroutes
app.get("/", (req, res) => res.redirect("/products"));

/* ================= ERROR HANDLING ================= */
app.use((req, res) => {
    res.status(404).render("error", { message: "Page Not Found" });
});

app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).render("error", { message: "Something went wrong!" });
});

/* ================= SERVER START ================= */
server.listen(PORT, () => {
    console.log(`✅ Server running at port ${PORT}`);
});