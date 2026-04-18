import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share, Bookmark, Image, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';
import CommentPopup from './CommentPopup';
import { useToast } from "../context/ToastContext.jsx";
import FeedSkeleton from "./FeedSkeleton.jsx";


const API = import.meta.env.VITE_BACKEND_URL;

/* ============================
   CreatePost Component
=============================== */
function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const { showToast } = useToast();


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        setProfileData(await res.json());
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    fetchProfile();
  }, []);


  const handlePost = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      // ----------------------
      // 1️⃣ IMAGE + CONTENT POST
      // ----------------------
      if (image) {
        const fd = new FormData();
        fd.append("image", image);
        fd.append("content", content);

        const uploadRes = await fetch(`${API}/upload/post-image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!uploadRes.ok) {
          showToast("Image upload failed. Try again.", "error");
          return;
        }

        const result = await uploadRes.json();


        // 🔥 SUCCESS TOAST HERE
        showToast("Your post has been published!", "success");

        onPostCreated();
        setContent("");
        setImage(null);
        setPreviewUrl(null);
        return;
      }

      // ----------------------
      // 2️⃣ TEXT ONLY POST (IMAGE REQUIRED)
      // ----------------------
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (res.status === 400) {
        const errData = await res.json();
        showToast(errData.error || "Please add an image to your post.", "error");
        return;
      }

      if (!res.ok) {
        showToast("Failed to create post.", "error");
        return;
      }

      // 🔥 SUCCESS TOAST HERE ALSO
      showToast("Your post has been published!", "success");

      onPostCreated();
      setContent("");

    } catch (err) {
      console.error("Post creation failed:", err);
      showToast("Something went wrong.", "error");
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 dark:bg-gray-600">
      <div className="flex items-start space-x-4">

        <img
          src={
            profileData.profile_photo ||
            'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg'
          }
          alt="Profile"
          className="w-10 h-10 rounded-full"
        />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full h-20 px-4 py-3 
            rounded-xl 
            bg-gray-100 dark:bg-gray-700 
            border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-300
            focus:border-purple-500 dark:focus:border-purple-400
            focus:ring-2 focus:ring-purple-300/40 dark:focus:ring-purple-500/30
            resize-none outline-none transition-all"
          />

          {previewUrl && (
            <div className="mt-4 pb-2 relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-64 rounded-lg object-contain border border-gray-300 dark:border-gray-700"
              />

              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black bg-opacity-60 text-white rounded-full"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <div className="flex space-x-4">
              <label className="cursor-pointer text-indigo-700 dark:text-indigo-300">
                <Image className="w-5 h-5" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              <button className="text-indigo-700 dark:text-indigo-300" onClick={() => showToast("Emoji reactions are coming soon! 😊")}>

                <Smile className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handlePost}
              className="
              bg-indigo-600 dark:bg-indigo-500 
              text-white px-4 py-2 rounded-full 
              shadow-md
              transition-all duration-300 
              hover:bg-indigo-700 dark:hover:bg-indigo-400
              hover:shadow-lg 
              active:scale-95
              focus:ring-4 focus:ring-indigo-300/50 dark:focus:ring-indigo-600/40
            "

            >
              Post
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ============================
   Post Component
=============================== */

function Post({ post, commentCounts, onCommentClick }) {
  const author = post.user || {};
  const profilePhoto =
    author.profile_photo ||
    'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg';

  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);

  const handleLike = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setIsLiked(data.liked);
      setLikes((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (err) {
      console.error('Failed to like/unlike:', err);
    }
  };

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

  const showToast = (message, duration = 2500) => {
    const toast = document.createElement("div");
    toast.className = "toast show";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  };


  const getCommentCount = (postId) => {
    const found = commentCounts.find((c) => c.post_id === postId);
    return found ? parseInt(found.comment_count) : 0;
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm mb-6 dark:bg-gray-600">
      <div className="p-4">
        <Link to={`/profile/${author.username || 'unknown'}`} className="flex items-center space-x-3">
          <img src={profilePhoto} alt="Profile" className="w-10 h-10 rounded-full" />

          <div>
            <div className="font-semibold dark:text-white">{author.name || 'Anonymous'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">
              @{author.username} · {formatDate(post.timestamp)}
            </div>
          </div>
        </Link>

        <p className="mt-3 dark:text-white">{post.content}</p>

        {post.image && (
          <img src={post.image} className="mt-3 w-full rounded-lg" alt="Post" />
        )}


        <div className="mt-4 flex items-center justify-between pt-3 border-t">

          <div className="flex space-x-6">

            {/* LIKE */}
            <button
              onClick={handleLike}
              className={`
              flex items-center space-x-2
              ${isLiked ? "text-red-500" : "text-gray-500 dark:text-gray-200"}
              hover:scale-105 
              hover:-translate-y-0.5
              transition-all duration-200
              active:scale-95
            `}
            >
              <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
              <span>{likes}</span>
            </button>

            {/* COMMENT */}
            <button
              onClick={onCommentClick}
              className="
              flex items-center space-x-2
              text-gray-500 dark:text-gray-200
              hover:text-purple-600 dark:hover:text-purple-400
              hover:-translate-y-0.5
              transition-all duration-200
              active:scale-95
            "
            >
              <MessageSquare className="w-5 h-5" />
              <span>{getCommentCount(post.id)}</span>
            </button>

            {/* SHARE */}
            <button
              onClick={() => showToast("Sharing is under development 🚧")}
              className="
              flex items-center space-x-2
              text-gray-500 dark:text-gray-200
              hover:text-blue-500 dark:hover:text-blue-300
              hover:-translate-y-0.5
              transition-all duration-200
              active:scale-95
            "
            >
              <Share className="w-5 h-5" />
              <span>{post.shares || 0}</span>
            </button>


          </div>

          {/* BOOKMARK */}


          <button
            onClick={() => showToast("Save feature coming soon ⭐")}
            className="
            text-gray-500 dark:text-gray-200
            hover:text-yellow-500 dark:hover:text-yellow-400
            hover:-translate-y-0.5
            transition-all duration-200
            active:scale-95
          "
          >
            <Bookmark className="w-5 h-5" />
          </button>

        </div>

      </div>
    </div>
  );
}

/* ============================
   Feed Component
=============================== */

function Feed() {
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [commentCounts, setCommentCounts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    document.title = "Home - Gatherly";
  }, []);



  const fetchPosts = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch posts');

      setPosts(await res.json());
    } catch (err) {
      console.error(err);
    }

  };

  const fetchCommentCounts = async () => {
    try {
      const res = await fetch(`${API}/api/commentcount`);
      setCommentCounts(await res.json());
    } catch (err) {
      console.error('Failed to fetch comment counts:', err);
    }
  };


  useEffect(() => {
    const loadFeed = async () => {
      setLoadingFeed(true);

      const start = Date.now();

      try {
        await fetchPosts();
        await fetchCommentCounts();
      } catch (err) {
        console.error("Feed load error:", err);
      }

      const elapsed = Date.now() - start;
      const minDelay = 2000; // 2 seconds

      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      setLoadingFeed(false);
    };

    loadFeed();
  }, []);



  return (
    <div className="min-h-screen bg-gray-50 flex justify-center dark:bg-gray-900">
      <main className="w-full px-4 py-8 max-w-2xl">

        <CreatePost onPostCreated={fetchPosts} />

        {loadingFeed ? (
          <div>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        ) : (
          posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              commentCounts={commentCounts}
              onCommentClick={() => setActivePost(post)}
            />
          ))
        )}
      </main>

      {activePost && (
        <CommentPopup
          post={activePost}
          onClose={() => {
            setActivePost(null);
            fetchCommentCounts();
          }}
        />
      )}
    </div>
  );
}

export default Feed;
