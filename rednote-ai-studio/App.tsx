import React, { useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Generator from './views/Generator';
import History from './views/History';
import HistoryDetail from './views/HistoryDetail';
import SettingsView from './views/Settings';
import AuthView from './views/AuthView';
import { AppSettings, DEFAULT_SETTINGS, GeneratedPost } from './types';
import { getHistoryById, getSettings } from './services/db';
import { ApiService } from './services/geminiService';
import { getUser, setTokens, setUser, clearAuth, AuthUser } from './services/auth';

type LoginLocationState = {
  from?: string;
};

const Shell: React.FC<{
  user: AuthUser | null;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  return (
    <div className="flex min-h-screen bg-xhs-bg text-xhs-text">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen no-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

const HistoryRoute: React.FC<{
  onRestorePost: (post: GeneratedPost) => void;
}> = ({ onRestorePost }) => {
  return <History onRestorePost={onRestorePost} />;
};

const HistoryDetailRoute: React.FC<{
  onRestorePost: (post: GeneratedPost) => void;
}> = ({ onRestorePost }) => {
  const navigate = useNavigate();

  return (
    <HistoryDetail
      onRestorePost={(post) => {
        onRestorePost(post);
        navigate(`/generator/${post.id}`);
      }}
    />
  );
};

const GeneratorByIdRoute: React.FC<{
  settings: AppSettings;
  cachedPost: GeneratedPost | null;
  onPostRestored: () => void;
}> = ({ settings, cachedPost, onPostRestored }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<GeneratedPost | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!postId) {
        setPost(null);
        setLoading(false);
        return;
      }

      if (cachedPost && cachedPost.id === postId) {
        setPost(cachedPost);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const found = await getHistoryById(postId);
        if (cancelled) return;

        if (!found) {
          setPost(null);
          setLoading(false);
          return;
        }

        setPost(found);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setPost(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [postId, cachedPost]);

  useEffect(() => {
    if (!postId) return;
    if (loading) return;
    if (post) return;

    navigate('/history', { replace: true });
  }, [postId, loading, post, navigate]);

  if (!postId) {
    return <Navigate to="/generator" replace />;
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">正在恢复创作...</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <Generator
      settings={settings}
      initialPost={post}
      onPostRestored={onPostRestored}
    />
  );
};

const LoginRoute: React.FC<{
  backendUrl: string;
  onLoggedIn: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
}> = ({ backendUrl, onLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state || {}) as LoginLocationState;
  const from = typeof state.from === 'string' && state.from.startsWith('/')
    ? state.from
    : '/generator';

  return (
    <AuthView
      backendUrl={backendUrl}
      onLoginSuccess={(data) => {
        onLoggedIn(data);
        navigate(from, { replace: true });
      }}
      onSkip={() => navigate(from, { replace: true })}
    />
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [restoredPost, setRestoredPost] = useState<GeneratedPost | null>(null);
  const [user, setCurrentUser] = useState<AuthUser | null>(getUser());
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    getSettings().then(async (savedSettings) => {
      setSettings(savedSettings);
      setIsHydrated(true);

      const apiService = new ApiService(savedSettings);
      const success = await apiService.setModelConfig();
      if (success) {
        console.log('Model configuration initialized in session');
      } else {
        console.warn('Failed to initialize model configuration in session');
      }
    });
  }, []);

  const handleLoggedIn = (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => {
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setCurrentUser(data.user);
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
  };

  const handlePostRestored = () => {
    setRestoredPost(null);
  };

  if (!isHydrated) return null;

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginRoute backendUrl={settings.backendUrl} onLoggedIn={handleLoggedIn} />}
        />

        <Route path="/" element={<Shell user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="generator" replace />} />
          <Route
            path="generator"
            element={<Generator settings={settings} onPostRestored={handlePostRestored} />}
          />
          <Route
            path="generator/:postId"
            element={
              <GeneratorByIdRoute
                settings={settings}
                cachedPost={restoredPost}
                onPostRestored={handlePostRestored}
              />
            }
          />
          <Route
            path="history"
            element={<HistoryRoute onRestorePost={setRestoredPost} />}
          />
          <Route
            path="history/:postId"
            element={<HistoryDetailRoute onRestorePost={setRestoredPost} />}
          />
          <Route
            path="settings"
            element={<SettingsView settings={settings} onSettingsUpdate={setSettings} />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/generator" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
