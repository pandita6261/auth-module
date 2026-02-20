const API_BASE = " https://auth-module-2qnn.onrender.com"; // CHANGE after deploy

function setMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "msg " + (ok ? "success" : "error");
}

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

async function registerUser(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });
    const data = await res.json();

    if (!res.ok) return setMsg("msg", data.message || "Registration failed", false);

    setMsg("msg", "Registration successful! Redirecting to login...", true);
    setTimeout(() => (window.location.href = "login.html"), 1200);
  } catch {
    setMsg("msg", "Network error", false);
  }
}

async function loginUser(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) return setMsg("msg", data.message || "Login failed", false);

    saveToken(data.token);
    window.location.href = "dashboard.html";
  } catch {
    setMsg("msg", "Network error", false);
  }
}

async function loadDashboard() {
  const token = getToken();
  if (!token) return (window.location.href = "login.html");

  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) return logout();

    document.getElementById("welcome").textContent =
      `Welcome, ${data.user.name} (${data.user.email})`;
  } catch {
    logout();
  }
}