import { useState, useEffect, useRef } from "react";
import { Bell, Clock, AlertTriangle, BarChart2, Flame, X } from "lucide-react";
import axios from "axios";

function NotificationCenter({ onLogout }) {
  const [notifs, setNotifs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(function () {
    fetchNotifications();

    // Check for new notifications every 30 seconds
    const interval = setInterval(function () {
      fetchNotifications();
    }, 30000);

    return function () {
      clearInterval(interval);
    };
  }, []);

  useEffect(
    function () {
      function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return function () {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    },
    [menuRef]
  );

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // First, check and create new notifications
      await axios.post("http://localhost:4000/api/notifications/check/gp", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Then fetch all notifications
      const response = await axios.get("http://localhost:4000/api/notifications/gp", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setNotifs(response.data.notifications);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        onLogout?.();
      }
    }
  }

  async function handleMarkAsRead(notifId) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:4000/api/notifications/${notifId}/read/gp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from list
      setNotifs(notifs.filter(function (n) {
        return n._id !== notifId;
      }));
    } catch (error) {
      console.error(error);
    }
  }

  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  function getNotifIcon(type) {
    if (type === "schedule_start") {
      return <Clock className="size-4 text-blue-600" />;
    } else if (type === "deadline_warning") {
      return <AlertTriangle className="size-4 text-orange-600" />;
    } else if (type === "no_progress") {
      return <BarChart2 className="size-4 text-gray-600" />;
    } else if (type === "streak_risk") {
      return <Flame className="size-4 text-red-600" />;
    }
    return <Bell className="size-4" />;
  }

  function getNotifBgColor(type) {
    if (type === "schedule_start") {
      return "bg-blue-50 hover:bg-blue-100";
    } else if (type === "deadline_warning") {
      return "bg-orange-50 hover:bg-orange-100";
    } else if (type === "no_progress") {
      return "bg-gray-50 hover:bg-gray-100";
    } else if (type === "streak_risk") {
      return "bg-red-50 hover:bg-red-100";
    }
    return "bg-gray-50 hover:bg-gray-100";
  }

  function getTimeAgo(date) {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = now - notifDate;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const unreadCount = notifs.length;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={toggleMenu}
        className="relative p-2 text-gray-600 hover:text-purple-500 transition-colors duration-300 hover:bg-purple-50 rounded-full"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-fuchsia-50">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-600">{unreadCount} unread</p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="size-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No notifications</p>
              </div>
            ) : (
              <ul>
                {notifs.map(function (notif) {
                  return (
                    <li
                      key={notif._id}
                      className={`p-3 border-b border-gray-100 transition-colors ${getNotifBgColor(notif.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getNotifIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={function () {
                            handleMarkAsRead(notif._id);
                          }}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                        >
                          <X className="size-4 text-gray-400" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
