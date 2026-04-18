import React, { useEffect, useState } from 'react';

function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const API = import.meta.env.VITE_BACKEND_URL;

  // -------------------------------
  // CHECK FOLLOW STATUS
  // -------------------------------
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!token) return;

      try {
        const res = await fetch(`${API}/api/follow/status/${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        setIsFollowing(data.following);
      } catch (err) {
        setError("Failed to load follow status");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [username, token, API]);

  // -------------------------------
  // FOLLOW / UNFOLLOW
  // -------------------------------
  const handleFollowToggle = async () => {
    if (!token) return;

    setButtonLoading(true);
    setError(null);

    const action = isFollowing ? "unfollow" : "follow";

    try {
      const res = await fetch(`${API}/api/follow/${action}/${username}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
      } else {
        const msg = await res.text();
        setError(msg || "Something went wrong");
      }
    } catch (err) {
      setError("Network error");
      console.error(err);
    } finally {
      setButtonLoading(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  if (loading) {
    return (
      <button className="px-4 py-2 rounded bg-gray-200 text-gray-600 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button
        onClick={handleFollowToggle}
        disabled={buttonLoading}
        className={`
          px-4 w-[150px] py-2 rounded-full transition 
          ${isFollowing ? "bg-red-200 hover:bg-red-400 text-black" : "bg-blue-300 hover:bg-blue-500 text-black"}
          ${buttonLoading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {buttonLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
      </button>
    </div>
  );
}

export default FollowButton;
