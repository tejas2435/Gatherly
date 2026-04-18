import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, ExternalLink, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import SearchMenu from './SearchMenu';

const API = import.meta.env.VITE_BACKEND_URL;

// static data kept as-is
const trendingTopics = [
  { tag: '#Photography', posts: '12.4k' },
  { tag: '#Design', posts: '8.9k' },
  { tag: '#Innovation', posts: '6.2k' },
  { tag: '#Lifestyle', posts: '5.7k' },
  { tag: '#Wellness', posts: '4.3k' },
];

const exploreCards = [
  {
    title: 'Nature',
    img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    posts: '2.4k',
  },
  {
    title: 'Architecture',
    img: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2',
    posts: '1.8k',
  },
  {
    title: 'Technology',
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    posts: '3.2k',
  },
  {
    title: 'Travel',
    img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
    posts: '4.1k',
  },
  {
    title: 'Food',
    img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
    posts: '2.9k',
  },
  {
    title: 'Art',
    img: 'https://images.unsplash.com/photo-1456086272160-b28b0645b729',
    posts: '1.5k',
  },
];

function ExploreGrid({ showToast }) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
      {exploreCards.map((category, index) => (
        <div
          key={index}
          onClick={() => showToast(`${category.title} section coming soon 🚧`)}
          className="group relative overflow-hidden rounded-xl cursor-pointer transition-transform duration-300 hover:scale-[1.02] bg-white dark:bg-gray-800"
          style={{
            willChange: 'transform',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 z-10" />
          <img
            src={category.img}
            alt={category.title}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h3 className="text-white text-xl font-semibold mb-2">{category.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{category.posts} posts</span>
              <ExternalLink className="text-white w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Explore() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    .toast {
      position: fixed;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #7b2ff7, #5a13e6);
      color: white;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      opacity: 0;
      transition: opacity 0.35s ease, transform 0.35s ease;
      z-index: 10000;
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

  const showToast = (msg, duration = 2500) => {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };

  const handleSearch = useDebouncedCallback(async (value) => {
    setQuery(value);

    if (!value.trim()) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/search?query=${encodeURIComponent(value)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();

      // backend only returns username + profile paths
      const fixed = data.map(user => ({
        ...user,
        profile_photo: !user.profile_photo
          ? "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg"
          : (
            user.profile_photo.startsWith("http")
              ? user.profile_photo                    // Supabase URL → leave untouched
              : `${API}${user.profile_photo.startsWith('/') ? '' : '/'}${user.profile_photo}`
          )
      }));


      setSearchResults(fixed);

    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }

  }, 200);

  useEffect(() => {
    document.title = "Search - Gatherly";
  }, []);

  const handleSelectUser = (username) => {
    setQuery('');
    setSearchResults([]);
    navigate(`/profile/${username}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-900">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Discover Amazing Content</h1>
        <p className="text-gray-600 mt-2 dark:text-gray-300">
          Explore thousands of high-quality resources, articles, and inspirations curated just for you.
        </p>
      </div>

      <div className="max-w-xl mx-auto relative mb-8">

        {/* SEARCH BAR */}
        <div className="relative group">

          {/* SEARCH ICON */}
          <span className="absolute inset-y-0 left-0 w-11 flex items-center justify-center pointer-events-none z-20">
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </span>

          {/* INPUT */}
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="
              w-full pl-12 pr-10 py-3
              rounded-xl shadow-md
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              focus:ring-4 focus:ring-purple-400/80
              focus:border-purple-500
              outline-none
              transition-all duration-300
            "
          />

          {/* CLEAR (X) BUTTON */}
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="
              absolute inset-y-0 right-0 w-10 
              flex items-center justify-center 
              text-gray-600 dark:text-gray-300
              hover:text-red-500 dark:hover:text-red-400
              transition-colors
              z-20
            "
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* NO RESULT */}
        {!loading && query && searchResults.length === 0 && (
          <div className="text-center mt-3 text-purple-700 dark:text-purple-300 font-medium animate-fadeIn">
            No users found!!
          </div>
        )}

        {/* DROPDOWN */}
        {searchResults.length > 0 && !loading && (
          <div
            className="
            absolute w-full mt-3 z-20 
            bg-white/95 dark:bg-gray-800/95 
            backdrop-blur-xl
            rounded-2xl shadow-2xl
            overflow-hidden animate-scaleIn
            border-0
          "
          >
            <SearchMenu users={searchResults} onSelect={handleSelectUser} />
          </div>
        )}

      </div>


      {/* TRENDING */}
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow-sm mb-10 dark:bg-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Trending Topics</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {trendingTopics.map((topic) => (
            <div
              key={topic.tag}
              onClick={() => showToast(`${topic.tag} is under development 🚧`)}
              className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-700 font-medium cursor-pointer
               hover:bg-purple-100 transition dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-purple-700/70"
            >
              {topic.tag}
              <span className="text-gray-500 ml-1 dark:text-gray-400">{topic.posts} posts</span>
            </div>
          ))}

        </div>
      </div>

      {/* GRID */}
      <ExploreGrid showToast={showToast} />
    </div>
  );
}

export default Explore;
