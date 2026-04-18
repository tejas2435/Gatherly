import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun, User, Key, Trash2, LogOut, Eye, EyeOff, UserCog } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';


function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const navigate = useNavigate();
  const [newEmail, setNewEmail] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const API = import.meta.env.VITE_BACKEND_URL;



  const handleLogout = () => {
    setIsLoggingOut(true); // 

    setTimeout(() => {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      window.dispatchEvent(new Event("storage"));
      navigate("/login");
    }, 2000);
  };

  useEffect(() => {
    document.title = "Settings - Gatherly";
  }, []);

  useEffect(() => {
  const token = localStorage.getItem("token");

  fetch(`${API}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (data.email) {
        setCurrentEmail(data.email);
      }
    })
    .catch(err => console.error("Error fetching profile:", err));
}, []);



  const handleChangePassword = async (e) => {
  e.preventDefault();

  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Please fill in all fields");
    return;
  }
  if (newPassword !== confirmPassword) {
    alert("New passwords don't match");
    return;
  }
  if (newPassword.length < 8) {
    alert("New password must be at least 8 characters");
    return;
  }

  setIsPasswordLoading(true);

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/api/users/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Something went wrong ❌");
    } else {
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

  } catch (err) {
    alert("Network error. Please try again 😵‍💫");
  } finally {
    setIsPasswordLoading(false);
  }
};


  const handleChangeEmail = async (e) => {
  e.preventDefault();

  if (!emailPassword || !newEmail) {
    alert("Please fill in all fields");
    return;
  }

  setIsEmailLoading(true);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/users/change-email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword: emailPassword, newEmail }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong ❌");
    } else {
      alert("Email changed successfully!");
      setEmailPassword("");
      setNewEmail("");
      setCurrentEmail(newEmail);
    }

  } catch {
    alert("Network error. Please try again 😵‍💫");
  } finally {
    setIsEmailLoading(false);
  }
};


  const handleDeleteAccount = async () => {
  if (!window.confirm("Are you sure? This action cannot be undone.")) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/users/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong ❌");
      return;
    }

    alert("Account deleted successfully!");

    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/signup");

  } catch (err) {
    console.error("Network error:", err);
    alert("Network error. Please try again 😵‍💫");
  }
};


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
        {/* Icon container */}
        <span className="bg-white p-2 rounded-lg shadow-sm dark:bg-gray-900">
          <UserCog className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
        </span>

        {/* Text */}
        Settings & Privacy
      </h1>


      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/40">
        <form onSubmit={handleChangePassword}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Change Password
          </h3>

          <div className="space-y-4">

            {/* CURRENT PASSWORD */}
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-0 focus:border-purple-500 focus-visible:ring-0 focus-visible:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400"
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* NEW PASSWORD */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-0 focus:border-purple-500 focus-visible:ring-0 focus-visible:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* CONFIRM NEW PASSWORD */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-0 focus:border-purple-500 focus-visible:ring-0 focus-visible:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isPasswordLoading}
              className={`rounded-xl text-white font-medium transition-all duration-300 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
          ${isPasswordLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-md hover:shadow-lg hover:scale-[1.01]"
                }`}
            >
              {isPasswordLoading ? "Updating..." : "Update Password"}
            </button>

          </div>
        </form>
      </section>


      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/40">
        <form onSubmit={handleChangeEmail}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Change Email
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Current Email: <span className="font-semibold text-gray-900 dark:text-white">{currentEmail}</span>
          </p>

          <div className="space-y-4">

            {/* PASSWORD FOR EMAIL CHANGE */}
            <div className="relative">
              <input
                type={showEmailPassword ? "text" : "password"}
                placeholder="Current Password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-0 focus:border-purple-500 focus-visible:ring-0 focus-visible:outline-none"
                required
              />

              {/* SHOW/HIDE BUTTON */}
              <button
                type="button"
                onClick={() => setShowEmailPassword(!showEmailPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400"
              >
                {showEmailPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* NEW EMAIL */}
            <div className="relative">
              <input
                type="email"
                placeholder="New Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-0 focus:border-purple-500 focus-visible:ring-0 focus-visible:outline-none"
                required
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isEmailLoading}
              className={`rounded-xl text-white font-medium transition-all duration-300 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl
          ${isEmailLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-md hover:shadow-lg hover:scale-[1.01] "
                }`}
            >
              {isEmailLoading ? "Updating..." : "Update Email"}
            </button>

          </div>
        </form>
      </section>


      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/40">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-500" />
          Delete Account
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Permanently<span className="font-semibold text-red-500"> delete</span> your account
        </p>

        <button
          onClick={() => setShowDeleteAccountDialog(true)}
          className="
            w-full flex items-center justify-center gap-2
            px-5 py-3 rounded-xl
            bg-red-500
            text-white font-medium
            hover:bg-red-600 hover:scale-[1.01]
            active:scale-[0.97]
            transition-all duration-300
          "
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>

      </section>



      {showDeleteAccountDialog && (
        <div className="
          fixed inset-0 z-50 
          bg-black/50 backdrop-blur-[2px] 
          flex items-center justify-center 
          p-4 animate-fadeIn
        ">
          <div className="
            bg-white dark:bg-gray-600 
            rounded-2xl shadow-2xl 
            p-6 w-full max-w-md 
            border border-gray-200/20 dark:border-white/10
            animate-scaleIn
          ">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              ⚠️ Delete Account
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete your account?
              <span className="font-semibold"> This action is permanent and cannot be undone.</span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAccountDialog(false)}
                className="
            px-4 py-2 rounded-lg 
            text-gray-700 dark:text-gray-300 
            hover:bg-gray-200 dark:hover:bg-gray-500 
            transition-all
          "
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                className="
            px-4 py-2 rounded-lg text-white font-medium
            bg-red-600 hover:bg-red-700 
            shadow-md hover:shadow-lg
            transition-all
          "
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}


      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/40">



        <h2 className="text-xl font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-white">
          {theme === 'dark' ? (
            <Moon className="w-5 h-5 text-white" />
          ) : (
            <Sun className="w-5 h-5 text-black" />
          )}
          Theme Settings
        </h2>

        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Change the website theme to
          <span className="font-semibold text-black dark:text-white ml-1">
            {theme === 'dark' ? "Light Mode" : "Dark Mode"}
          </span>
        </p>

        <button
          onClick={toggleTheme}
          className="
            w-full flex items-center justify-center gap-3
            px-5 py-3 rounded-xl 
            bg-gradient-to-r from-purple-600 to-indigo-600 
            text-white font-medium
            hover:scale-[1.01]
            active:scale-[0.98]
            transition-all duration-300
          "
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5" />
              Switch to Light Mode
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              Switch to Dark Mode
            </>
          )}
        </button>
      </section>



      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200/50 dark:border-gray-700/40">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <LogOut className="w-5 h-5 text-red-500" />
          Log Out
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Log out your account
        </p>

        <button
          onClick={handleLogout}
          className="
          w-full flex items-center justify-center gap-2
          px-5 py-3 rounded-xl
          bg-red-500 
          text-white font-medium
          hover:bg-red-600 hover:scale-[1.01]
          active:scale-[0.97]
          transition-all duration-300
        "
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </section>

      {isLoggingOut && (
        <div className="
          fixed inset-0 z-[9999] flex flex-col items-center justify-center
          bg-black/60 backdrop-blur-sm animate-fadeIn
        ">

          {/* Premium Thick Loader */}
          <div className="relative w-16 h-16 mb-5">
            {/* Track */}
            <div className="
            absolute inset-0 rounded-full 
            border-[6px] border-gray-300 dark:border-gray-600
            opacity-60
          "></div>

            {/* Active Arc */}
            <div className="
            absolute inset-0 rounded-full
            border-[6px] border-purple-500 border-t-transparent border-r-transparent
            animate-spinSlow
            drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]
          "></div>
          </div>

          {/* Text */}
          <p className="text-xl font-semibold text-gray-100 dark:text-gray-100">
            Logging out…
          </p>
        </div>
      )}
    </div>
  );
}


function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
function SettingsFunc() {
  return (
    <ThemeProvider>
      <SettingsPage />
    </ThemeProvider>
  );
}

export default SettingsFunc;
