import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Facebook, AtSign, Eye, EyeOff } from 'lucide-react';
import PhotoScrollBackground from './PhotoScrollBg';
import logo from "../../assets/logo.svg";
import api from "../../api/api.js";   // ✅ NEW: use axios client


const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    document.title = "SignUp - Gatherly";
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #7b2ff7, #5a13e6);
  color: white;
  padding: 14px 26px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.35s ease;
  z-index: 1000;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.15);
}

.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(-5px);
}

    `;
    document.head.appendChild(style);
  }, []);

  const showToast = (message, duration = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
  };




  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      showToast("Password must be at least 8 characters long.");
      return;
    }

    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password,
      });

      if (res.status === 201) {
        showToast('Signup successful! Please Login Now ✅');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showToast(res.data.message || "Signup failed");
      }

    } catch (error) {
      console.error("Signup error:", error);
      showToast("An error occurred. Please try again.");
    }
  };


  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      <PhotoScrollBackground />

      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">

        <div className="text-center mb-8">
          <h2 className="flex flex-col items-center text-center font-bold text-gray-800">
            <img src={logo} alt="Gatherly Logo" className="w-16 h-16 mb-3 rounded-lg" />
            <span className="text-4xl">Create Account</span>
          </h2>

          <p className="text-gray-600 mt-2">
            Welcome to <span className="text-m font-bold" style={{ color: "rgba(180, 61, 236, 0.9)" }}>
              Gatherly
            </span> !!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <div className="mt-1 relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-purple-600 hover:text-purple-800 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-400/50 transform hover:scale-[1.02] transition-all duration-300 shadow-lg"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => showToast("Facebook Signup is under development 🚧")}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg 
               hover:bg-gray-50 transition-all"
            >
              <Facebook className="h-5 w-5 text-blue-600" />
              <span className="ml-2">Facebook</span>
            </button>

            <button
              onClick={() => showToast("Google Signup is under development 🚧")}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg 
               hover:bg-gray-50 transition-all"
            >
              <AtSign className="h-5 w-5" />
              <span className="ml-2">Google</span>
            </button>
          </div>

        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
