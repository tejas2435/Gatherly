import React from 'react';
import { User } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

function SearchMenu({ users, onSelect }) {

  const getImage = (path) => {
    if (!path) {
      return "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg";
    }

    // If path is already a full URL (Supabase), return AS-IS
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    // Otherwise, treat it as local backend route
    return `${API}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto relative z-50 dark:bg-gray-700">

      {users.map((user) => (
        <div
          key={user.username}
          className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer dark:hover:bg-gray-500"
          onClick={() => onSelect(user.username)}
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {user.profile_photo ? (
              <img
                src={getImage(user.profile_photo)}
                alt={user.username}
                className="w-10 h-10 object-cover rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg";
                }}
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>

          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {user.name || user.username}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-300">@{user.username}</p>
          </div>
        </div>
      ))}

    </div>
  );
}

export default SearchMenu;
