import React, { useState } from "react";
import axios from "axios";

export default function Register({ onRegister } = {}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    try {
      const res = await axios.post('https://realtime-collab-comments-backend.onrender.com/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });
      
      if (res.data.user) {
        setSuccess(true);
        localStorage.setItem('username', res.data.user.name);
        localStorage.setItem('userEmail', res.data.user.email);
        localStorage.setItem('userId', res.data.user.id);
        setForm({ name: "", email: "", password: "", confirm: "" });
        onRegister?.(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow p-6"
        aria-describedby="form-error"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create account</h2>

        {error && (
          <p id="form-error" className="text-sm text-red-600 mb-3">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 mb-3">Registration successful!</p>
        )}

        <label className="block mb-2 text-sm">
          <span className="text-gray-700">Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="Your name"
            required
          />
        </label>

        <label className="block mb-2 text-sm">
          <span className="text-gray-700">Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
            placeholder="you@example.com"
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-gray-700">Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
              placeholder="At least 8 characters"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-700">Confirm</span>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={handleChange}
              className="mt-1 block w-full rounded border px-3 py-2 focus:outline-none focus:ring"
              placeholder="Repeat password"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Create account"}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          By creating an account you agree to our terms.
        </p>
      </form>
    </div>
  );
}
