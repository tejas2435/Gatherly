import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Trash2, Edit3, X, Camera, Save, } from "lucide-react";
import { useParams } from "react-router-dom";
import FriendsList from "./FriendsList";
import PostPopup from "./PostPopup";
import api from "../api/api.js";


const DEFAULT_COVER =
  "https://i.postimg.cc/5tnWjn6B/JShine.png";
const DEFAULT_AVATAR =
  "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2281862025.jpg";

function Profile() {
  const { username } = useParams();

  // profile object mirrors DB columns (profile_photo, cover_photo, name, username, bio, id, email, etc.)
  const [profile, setProfile] = useState({
    id: null,
    name: "",
    username: "",
    bio: "",
    profile_photo: "", // stored URL
    cover_photo: "", // stored URL
  });

  // previews for currently selected files (local object URLs)
  const [profilePreview, setProfilePreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);

  const profilePhotoInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [commentCounts, setCommentCounts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  // ---- helper: safe image URL resolution ----
  // prefer preview (object URL) when available; otherwise use stored URL; otherwise fallback
  const resolveImageSrc = (storedUrl, preview, fallback) => {
    if (preview) return preview;
    if (!storedUrl) return fallback;
    // already absolute/complete URL? assume yes if startsWith http/https
    if (storedUrl.startsWith("http") || storedUrl.startsWith("https") || storedUrl.startsWith("data:") || storedUrl.startsWith("blob:")) {
      return storedUrl;
    }
    return `${VITE_BACKEND_URL.replace(/\/$/, "")}/${storedUrl.replace(/^\//, "")}`;
  };

  // ---- fetch comment counts (used across UI) ----
  const fetchCommentCounts = async () => {
    try {
      const res = await api.get("/api/commentcount");
      setCommentCounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch comment counts:", err);
    }
  };

  useEffect(() => {
    fetchCommentCounts();
  }, []);

  const getCommentCount = (postId) => {
    const found = commentCounts.find((c) => c.post_id === postId);
    return found ? parseInt(found.comment_count, 10) : 0;
  };

  // ---- fetch profile, posts, friends ----
  // If username param exists, try to fetch profile by username; otherwise fallback to /api/profile (own)
  const fetchUserData = async () => {
    try {
      let profileRes;
      if (username) {
        // try public profile by username
        try {
          profileRes = await api.get(`/api/profile/${encodeURIComponent(username)}`);
        } catch (err) {
          // fallback to /api/profile (logged in user)
          profileRes = await api.get("/api/profile");
        }
      } else {
        profileRes = await api.get("/api/profile");
      }

      // ensure we have an object
      if (profileRes && profileRes.data) {
        // normalize keys to match our state shape (profile_photo, cover_photo)
        setProfile((prev) => ({
          ...prev,
          ...profileRes.data,
          profile_photo: profileRes.data.profile_photo || "",
          cover_photo: profileRes.data.cover_photo || "",
          name: profileRes.data.name || "",
          username: profileRes.data.username || "",
          bio: profileRes.data.bio || "",
          id: profileRes.data.id || prev.id,
        }));
      }

      // posts for this username (if viewing other's profile we want their posts)
      try {
        const postsRes = await api.get(`/api/posts/${encodeURIComponent(username || profileRes.data.username)}`);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      } catch (err) {
        // if posts endpoint fails, clear posts but continue
        console.warn("Could not fetch posts:", err);
        setPosts([]);
      }

      // friends
      try {
        const friendsRes = await api.get(`/api/friends/by-username/${encodeURIComponent(username || profileRes.data.username)}`);
        setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : []);
      } catch (err) {
        console.warn("Could not fetch friends:", err);
        setFriends([]);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [username]);

  // set document title
  useEffect(() => {
    document.title = `${profile.name || "Profile"} - Gatherly`;
  }, [profile.name]);

  // ---- image selection / preview handlers ----
  const handleImageChange = (e, type) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    if (type === "profilePhoto") {
      // revoke previous if present
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      setProfilePreview(objectUrl);
      setProfileFile(file);
    } else if (type === "coverPhoto") {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(objectUrl);
      setCoverFile(file);
    }
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [profilePreview, coverPreview]);


  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      // 1) update text fields
      await api.put("/api/profile", {
        name: profile.name,
        username: profile.username,
        bio: profile.bio,
      });

      // 2) upload profile file if present
      if (profileFile) {
        const fd = new FormData();
        fd.append("image", profileFile);

        const res = await api.post("/upload/profile-photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res && res.data) {
          setProfile((prev) => ({
            ...prev,
            profile_photo: res.data.url || prev.profile_photo,
          }));
        }

        URL.revokeObjectURL(profilePreview);
        setProfilePreview(null);
        setProfileFile(null);
      }

      // 3) upload cover file if present
      if (coverFile) {
        const fd = new FormData();
        fd.append("image", coverFile); // MUST match upload.single("image")

        const res = await api.post("/upload/cover-photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res && res.data) {
          setProfile((prev) => ({
            ...prev,
            cover_photo: res.data.url || prev.cover_photo,
          }));
        }

        URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
        setCoverFile(null);
      }

      // finally, refresh profile & posts to display latest data
      await fetchUserData();
      setIsEditing(false);
      // refresh comment counts (if needed)
      fetchCommentCounts();
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. See console for details.");
    }
  };

  // Put this above your modal / top of the file
  function InputField({ label, value, onChange, placeholder = "", type = "text", required = false }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="
          mt-1 w-full px-3 py-2 rounded-lg
          bg-gray-100 dark:bg-gray-700
          border border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-purple-500
          transition
        "
        />
      </div>
    );
  }

  const tabRefs = {
    posts: React.useRef(null),
    friends: React.useRef(null),
  };

  const [pillStyle, setPillStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const activeRef = tabRefs[activeTab].current;
    if (activeRef) {
      const rect = activeRef.getBoundingClientRect();
      const parentRect = activeRef.parentNode.getBoundingClientRect();

      setPillStyle({
        width: rect.width,
        left: rect.left - parentRect.left,
      });
    }
  }, [activeTab, posts.length, friends.length]);



  // ---- delete post ----
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await api.delete(`/api/posts/${postToDelete.id}`);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setShowDeletePopup(false);
      setPostToDelete(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  // ---- UI actions ----
  const openProfilePhotoPicker = () => profilePhotoInputRef.current?.click();
  const openCoverPicker = () => coverPhotoInputRef.current?.click();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover */}
      <div className="relative h-80 bg-gray-300 dark:bg-gray-900">
        <img
          src={resolveImageSrc(profile.cover_photo, coverPreview, DEFAULT_COVER)}
          alt="Cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_COVER;
          }}
          className="w-full h-full object-cover"
        />

        {/* avatar */}
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
          <img
            src={resolveImageSrc(profile.profile_photo, profilePreview, DEFAULT_AVATAR)}
            alt="Profile"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
            className="w-40 h-40 rounded-full border-4 border-white object-cover"
          />
        </div>
      </div>

      {/* Info */}


      <div className="mt-24 text-center px-4">
        {/* Name */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {profile.name || "Unnamed"}
        </h1>

        {/* Username */}
        <p className="text-lg text-gray-600 mt-1 dark:text-indigo-300">
          @{profile.username || "unknown"}
        </p>

        {/* Bio */}
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto dark:text-gray-200 leading-relaxed">
          {profile.bio || ""}
        </p>

        {/* Edit Profile Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="
      mt-5 inline-flex items-center gap-2
      px-5 py-2.5
      rounded-full
      bg-purple-600 text-white
      shadow-md
      hover:bg-purple-700 
      hover:shadow-lg
      active:scale-95
      transition-all duration-200
      dark:bg-purple-500 dark:hover:bg-purple-600
    "
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
      </div>


      {/* Tabs */}

      <div className="mt-8 bg-white dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
        <nav className="relative flex justify-center px-2 py-2">

          {/* Sliding Pill */}
          <div
            className="absolute top-2 bottom-2 bg-purple-100 dark:bg-purple-700/60 
                 rounded-full transition-all duration-300 ease-out"
            style={{
              width: pillStyle.width,
              left: pillStyle.left,
            }}
          />

          {/* POSTS */}
          <button
            ref={tabRefs.posts}
            onClick={() => setActiveTab("posts")}
            className={`
        relative z-10 flex-1 text-center px-6 py-2 text-sm font-semibold
        transition-colors
        ${activeTab === "posts"
                ? "text-purple-700 dark:text-purple-300"
                : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}
      `}
          >
            Posts
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {posts.length}
            </span>
          </button>

          {/* FRIENDS */}
          <button
            ref={tabRefs.friends}
            onClick={() => setActiveTab("friends")}
            className={`
        relative z-10 flex-1 text-center px-6 py-2 text-sm font-semibold
        transition-colors
        ${activeTab === "friends"
                ? "text-purple-700 dark:text-purple-300"
                : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}
      `}
          >
            Friends
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {friends.length}
            </span>
          </button>

        </nav>
      </div>

      <div className="mt-6">
  {activeTab === "posts" ? (
    posts.length === 0 ? (
      <div className="text-center text-gray-500 dark:text-gray-400 py-10">
        No posts yet
      </div>
    ) : (
      <div>
        {/* Render actual posts list here */}
      </div>
    )
  )  : null}
</div>




      {/* Content */}
      <div className="mt-6 px-4 max-w-6xl mx-auto">
        {activeTab === "posts" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-500 hover:-translate-y-1 dark:border-0 dark:hover:shadow-indigo-800/70 w-full max-w-xs mx-auto"
                  onClick={() => setSelectedPost(post)}
                >
                  {post.image ? (
                    <img src={post.image} alt={`post-${post.id}`} className="w-full h-64 object-cover" />
                  ) : (
                    <div className="p-4 text-center text-gray-500">No image available</div>
                  )}

                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div
                      className="bg-black rounded-full p-3 cursor-pointer pointer-events-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostToDelete(post);
                        setShowDeletePopup(true);
                      }}
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 text-white flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart className="w-6 h-6" />
                        <span className="text-sm font-bold">{post.likes?.toLocaleString?.() ?? post.likes ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm font-medium">{getCommentCount(post.id)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPost && (
              <PostPopup
                post={selectedPost}
                author={profile}
                onClose={() => {
                  setSelectedPost(null);
                  fetchCommentCounts();
                }}
              />
            )}
          </>
        )}

        {activeTab === "friends" && (
          <div className="p-4">
            <FriendsList username={username || profile.username} />
          </div>
        )}
      </div>

      {/* Delete confirmation */}

      {showDeletePopup && (
        <div
          className="fixed inset-0 z-50 
      flex items-center justify-center 
      bg-black/50 backdrop-blur-[2px] 
      animate-fadeIn
      p-4"
        >
          <div
            className="
        w-full max-w-sm 
        rounded-2xl 
        p-6 
        shadow-2xl 
        bg-gradient-to-br from-white to-gray-100 
        dark:from-gray-600 dark:to-gray-600
        transform transition-all animate-scaleIn
      "
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Post
            </h2>

            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete this post?
              This action <span className="font-semibold">cannot be undone.</span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeletePopup(false); setPostToDelete(null); }}
                className="
            px-4 py-2 rounded-lg font-medium
            text-gray-700 dark:text-gray-300
            bg-gray-100 hover:bg-gray-200
            dark:bg-gray-600 dark:hover:bg-gray-700
            transition-all
          "
              >
                Cancel
              </button>

              <button
                onClick={handleDeletePost}
                className="
            px-4 py-2 rounded-lg font-medium
            text-white bg-red-600 hover:bg-red-700 
            transition-all shadow-sm
          "
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center 
                  bg-black/40 backdrop-blur-sm p-4">

          <div className="
      w-full max-w-lg p-6 rounded-2xl smoothScaleIn
      bg-white/90 dark:bg-gray-900/90 
      shadow-2xl border border-gray-200 dark:border-gray-700
    ">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">

              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={resolveImageSrc(profile.profile_photo, profilePreview, DEFAULT_AVATAR)}
                    onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-400"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    ref={profilePhotoInputRef}
                    onChange={(e) => handleImageChange(e, "profilePhoto")}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openProfilePhotoPicker}
                      className="
                  px-3 py-1.5 text-sm rounded-lg font-medium
                  flex items-center gap-2
                  bg-purple-600 text-white 
                  hover:bg-purple-700 transition
                "
                    >
                      <Camera className="w-4 h-4" /> Change
                    </button>

                    {profilePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(profilePreview);
                          setProfilePreview(null);
                          setProfileFile(null);
                        }}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Cover Photo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={resolveImageSrc(profile.cover_photo, coverPreview, DEFAULT_COVER)}
                    onError={(e) => { e.currentTarget.src = DEFAULT_COVER; }}
                    className="w-32 h-20 rounded-lg object-cover ring-2 ring-purple-400"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    ref={coverPhotoInputRef}
                    onChange={(e) => handleImageChange(e, "coverPhoto")}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openCoverPicker}
                      className="
                  px-3 py-1.5 text-sm rounded-lg font-medium
                  flex items-center gap-2
                  bg-purple-600 text-white 
                  hover:bg-purple-700 transition
                "
                    >
                      <Camera className="w-4 h-4" /> Change
                    </button>

                    {coverPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(coverPreview);
                          setCoverPreview(null);
                          setCoverFile(null);
                        }}
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name */}
              <InputField
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />

              {/* Username */}
              <InputField
                label="Username"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              />

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="
              mt-1 w-full px-3 py-2 rounded-lg 
              bg-gray-100 dark:bg-gray-700
              border border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 
              focus:ring-purple-500
            "
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="
              px-4 py-2 rounded-lg border 
              text-gray-700 dark:text-gray-300
              bg-gray-100 dark:bg-gray-700
              hover:bg-gray-200 dark:hover:bg-gray-600 
              transition
            "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="
              px-4 py-2 rounded-lg text-white font-medium
              bg-purple-600 hover:bg-purple-700
              shadow-lg shadow-purple-500/20
              flex items-center gap-2 transition
            "
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Profile;