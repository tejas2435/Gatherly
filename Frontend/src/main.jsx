import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Layout from './Layout';
import { createBrowserRouter } from 'react-router-dom';
import { RouterProvider } from 'react-router-dom';
import Profile from './Profile/Profile';
import Feed from './Feed/Feed.jsx';
import SettingsFunc from './Settings/SettingsFunc.jsx';
import Notify from './Notify/Notify.jsx';
import Explore from './Explore/Explore.jsx';
import Chat_sec from './Chat/Chat.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import LandingPage from './Signup_page/Pages/LandingPage.jsx';
import Login from './Signup_page/Pages/Login.jsx';
import SignUp from './Signup_page/Pages/SignUp.jsx';
import ForgotPassword from './Signup_page/Pages/ForgotPassword.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import ProfilePage from './Profile/ProfilePage.jsx';
import UsernameRouter from './Profile/UsernameRouter.jsx';
import { NotificationProvider } from './Header/NotificationContext.jsx';
import { ChatProvider } from "./Chat/ChatContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";


const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/signup",
    element: <SignUp />
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />
  },

  // PROTECTED ROUTES
  {
    element: (
      <PrivateRoute>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "/home",
        element: <Feed />
      },
      {
        path: "/profile/:username",
        element: <UsernameRouter />
      },
      {
        path: "/settings",
        element: <SettingsFunc />
      },
      {
        path: "/notify",
        element: <Notify />
      },
      {
        path: "/explore",
        element: <Explore />
      },
      {
        path: "/chat",
        element: <Chat_sec />
      }
    ]
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
      <NotificationProvider>
        <ChatProvider>
          <RouterProvider router={router} />
        </ChatProvider>
      </NotificationProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
