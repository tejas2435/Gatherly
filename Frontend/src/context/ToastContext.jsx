import React, { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info", duration = 2500) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div
          className={`
            fixed top-6 left-1/2 -translate-x-1/2 z-[9999]
            px-4 py-3 rounded-xl text-white font-semibold shadow-lg
            transition-opacity duration-300
            ${toast.type === "error" ? "bg-red-500" : ""}
            ${toast.type === "success" ? "bg-green-500" : ""}
            ${toast.type === "info" ? "bg-blue-500" : ""}
          `}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
