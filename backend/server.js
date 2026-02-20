require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Auth backend running" });
});

// Register
app.post("/api/register", (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`;
  db.run(sql, [name, email, password_hash], function (err) {
    if (err) {
      if (String(err).includes("UNIQUE")) {
        return res.status(409).json({ message: "Email already registered" });
      }
      return res.status(500).json({ message: "Server error", error: String(err) });
    }
    return res.status(201).json({ message: "Registration successful" });
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  });
});

// Middleware: protect routes
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

// Profile (protected)
app.get("/api/me", auth, (req, res) => {
  res.json({ message: "Authorized", user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});