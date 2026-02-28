import React, { useEffect, useRef, useState } from 'react';
import {
  HashRouter,
  matchPath,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
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
import { Button } from './components/ui/Button';

type LoginLocationState = {
  from?: string;
};

const Shell: React.FC<{
  user: AuthUser | null;
  onLogout: () => void;
  settings: AppSettings;
  cachedPost: GeneratedPost | null;
  onPostRestored: () => void;
}> = ({ user, onLogout, settings, cachedPost, onPostRestored }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    progressText: string;
    step: number;
    currentHistoryId: string | null;
  }>({
    isGenerating: false,
    progressText: '',
    step: 0,
    currentHistoryId: null,
  });

  const cancelGenerationRef = useRef<(() => void) | null>(null);
  const matchedGeneratorPost = matchPath('/generator/:postId', location.pathname);
  const postId = matchedGeneratorPost?.params.postId;
  const isGeneratorRoute = location.pathname === '/generator' || Boolean(postId);

  const [initialPost, setInitialPost] = useState<GeneratedPost | null>(null);
  const [isRestoringPost, setIsRestoringPost] = useState(false);
  const loadedPostIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const restorePost = async () => {
      if (!postId) {
        setIsRestoringPost(false);
        return;
      }

      if (loadedPostIdRef.current === postId) {
        setIsRestoringPost(false);
        return;
      }

      if (cachedPost && cachedPost.id === postId) {
        loadedPostIdRef.current = postId;
        setInitialPost(cachedPost);
        setIsRestoringPost(false);
        return;
      }

      setIsRestoringPost(true);

      try {
        const found = await getHistoryById(postId);
        if (cancelled) return;

        if (!found) {
          setIsRestoringPost(false);
          navigate('/history', { replace: true });
          return;
        }

        loadedPostIdRef.current = postId;
        setInitialPost(found);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setIsRestoringPost(false);
          navigate('/history', { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsRestoringPost(false);
        }
      }
    };

    restorePost();

    return () => {
      cancelled = true;
    };
  }, [postId, cachedPost, navigate]);

  const shouldShowBanner =
    !isGeneratorRoute
    && generationState.isGenerating
    && generationState.progressText.trim().length > 0;

  const handleBackToGenerator = () => {
    const id = generationState.currentHistoryId;
    if (id) {
      navigate(`/generator/${id}`);
    } else {
      navigate('/generator');
    }
  };

  return (
    <div className="flex min-h-screen bg-xhs-bg text-xhs-text">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen no-scrollbar">
        {shouldShowBanner && (
          <div className="mb-6 bg-xhs-surface border border-xhs-border rounded-2xl shadow-soft p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-xhs-text">正在生成…</div>
              <div className="text-xs text-xhs-secondary truncate">
                {generationState.progressText}
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button variant="secondary" onClick={handleBackToGenerator}>
                回到生成器
              </Button>
              <Button
                variant="danger"
                onClick={() => cancelGenerationRef.current?.()}
              >
                取消生成
              </Button>
            </div>
          </div>
        )}

        <div hidden={!isGeneratorRoute || isRestoringPost}>
          <Generator
            settings={settings}
            initialPost={initialPost}
            onPostRestored={onPostRestored}
            onGenerationStateChange={setGenerationState}
            onCancelRef={(cancel) => {
              cancelGenerationRef.current = cancel;
            }}
          />
        </div>

        {isGeneratorRoute && isRestoringPost && (
          <div className="p-8 text-center text-gray-400">正在恢复创作...</div>
        )}

        <div hidden={isGeneratorRoute}>
          <Outlet />
        </div>
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

// Generator route is now kept alive in Shell.

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

        <Route
          path="/"
          element={(
            <Shell
              user={user}
              onLogout={handleLogout}
              settings={settings}
              cachedPost={restoredPost}
              onPostRestored={handlePostRestored}
            />
          )}
        >
          <Route index element={<Navigate to="generator" replace />} />
          <Route path="generator" element={<></>} />
          <Route path="generator/:postId" element={<></>} />
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
