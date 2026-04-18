import React, { useState, useEffect } from 'react';
import { Bell, Trash2, UserPlus, CheckCircle2, Heart, MessageCircle } from 'lucide-react';
import { useNotification } from '../Header/NotificationContext.jsx';

function Notify() {
  const API = import.meta.env.VITE_BACKEND_URL;

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { unreadCount, setUnreadCount, fetchUnreadCount } = useNotification();
  const [markAllToast, setMarkAllToast] = useState(false);

  // -------------------------------------------------------
  // LOAD NOTIFICATIONS
  // -------------------------------------------------------
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/api/notifications`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setNotifications(data);
        } else if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      }
    };

    document.title = "Notifications - Gatherly";
    fetchNotifications();
  }, [API]);

  // -------------------------------------------------------
  // ICONS
  // -------------------------------------------------------
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow': return <UserPlus className="w-5 h-5 text-indigo-500" />;
      case 'like': return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // -------------------------------------------------------
  // DELETE ONE NOTIFICATION
  // -------------------------------------------------------
  const deleteNotification = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setNotifications(notifications.filter(notif => notif.id !== id));
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);

      fetchUnreadCount(); // update counter
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // -------------------------------------------------------
  // DELETE ALL NOTIFICATIONS
  // -------------------------------------------------------
  const deleteAllNotifications = async () => {
    try {
      await fetch(`${API}/api/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setNotifications([]);
      setShowDeleteAllDialog(false);
      fetchUnreadCount();

      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  // -------------------------------------------------------
  // BACKGROUND COLOR MATCHING TYPE
  // -------------------------------------------------------
  const getNotificationBackground = (type) => {
    switch (type) {
      case 'follow': return 'bg-indigo-50 dark:bg-indigo-600';
      case 'like': return 'bg-pink-50 dark:bg-pink-700';
      case 'comment': return 'bg-yellow-50 dark:bg-yellow-700';
      default: return 'bg-gray-50 dark:bg-gray-800';
    }
  };

  // -------------------------------------------------------
  // MARK ALL AS READ
  // -------------------------------------------------------
  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setUnreadCount(0);
      fetchUnreadCount();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      setMarkAllToast(true);
      setTimeout(() => setMarkAllToast(false), 2000);

    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // -------------------------------------------------------
  // FIXED: UNREAD COUNT FETCH FUNCTION
  // -------------------------------------------------------
  const fetchNotificationCount = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      // FIXED — this was using a NON-EXISTING setter before
      setUnreadCount(data.count);

    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg shadow-sm dark:bg-gray-900">
              <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
              {unreadCount} new
            </span>

            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors duration-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Mark All Read</span>
                </button>

                <button
                  onClick={() => setShowDeleteAllDialog(true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete All</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden dark:bg-gray-700">
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium dark:text-white text-gray-900 mb-1">All caught up!</h3>
                <p className="text-gray-500 dark:text-gray-200">No new notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`group p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${getNotificationBackground(notification.type)}`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        className="h-12 w-12 rounded-full ring-2 ring-white"
                        src={notification.user.avatar}
                        alt={notification.user.name}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.user.name}
                        </p>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-white">
                            {new Date(notification.time).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>

                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded-full"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>

                      <p className="mt-1 text-sm text-gray-600 dark:text-white">
                        {notification.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Delete All Dialog */}


        {showDeleteAllDialog && (
          <div
            className="
              fixed inset-0 z-50 
              flex items-center justify-center 
              bg-black/50 backdrop-blur-[2px] 
              animate-fadeIn
              p-4
            "
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
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Delete All Notifications?
              </h3>

              {/* Subtitle */}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteAllDialog(false)}
                  className="
                    px-4 py-2 
                    rounded-lg 
                    font-medium
                    text-gray-700 dark:text-gray-200
                    hover:bg-gray-200 dark:hover:bg-gray-700 
                    transition-all duration-200
                  "
                >
                  Cancel
                </button>

                <button
                  onClick={deleteAllNotifications}
                  className="
            px-5 py-2 
            rounded-lg 
            font-semibold
            text-white 
            bg-red-600
            shadow-md 
            hover:shadow-lg 
            hover:brightness-110
            active:scale-95
            transition-all duration-200
          "
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Toasts */}
        {showConfirmation && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 transform bg-gray-800 text-white px-8 py-2 rounded-lg shadow-lg flex items-center space-x-4 z-50 text-lg font-semibold opacity-100 transition-all duration-900 ease-out">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="ml-2">Notification removed</span>
          </div>
        )}

        {markAllToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 transform bg-green-600 text-white px-8 py-4 rounded-xl shadow-xl flex items-center space-x-4 z-50 text-lg font-semibold opacity-100 transition-all duration-900 ease-out">
            <CheckCircle2 className="w-6 h-6" />
            <span className="ml-2">All marked as read</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notify;
