import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Generator from './views/Generator';
import History from './views/History';
import SettingsView from './views/Settings';
import AuthView from './views/AuthView';
import { AppSettings, DEFAULT_SETTINGS, GeneratedPost } from './types';
import { getSettings } from './services/db';
import { ApiService } from './services/geminiService';
import {
  getUser,
  setTokens,
  setUser,
  clearAuth,
  AuthUser,
} from './services/auth';
import { AppRoute, navigate, useRoute } from './utils/router';

const App: React.FC = () => {
  const [route] = useRoute();
  const lastNonLoginRouteRef = useRef<AppRoute>('/generator');

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [restoredPost, setRestoredPost] = useState<GeneratedPost | null>(null);
  const [user, setCurrentUser] = useState<AuthUser | null>(getUser());
  const isInitialized = useRef(false);

  useEffect(() => {
    if (route !== '/login') {
      lastNonLoginRouteRef.current = route;
    }
  }, [route]);

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

  const handleLoginSuccess = (data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }) => {
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setCurrentUser(data.user);
    navigate(lastNonLoginRouteRef.current, { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    setCurrentUser(null);
  };

  const handleRestorePost = (post: GeneratedPost) => {
    setRestoredPost(post);
    navigate('/generator');
  };

  const handlePostRestored = () => {
    setRestoredPost(null);
  };

  if (!isHydrated) return null;

  if (route === '/login') {
    return (
      <AuthView
        backendUrl={settings.backendUrl}
        onLoginSuccess={handleLoginSuccess}
        onSkip={() => navigate(lastNonLoginRouteRef.current, { replace: true })}
      />
    );
  }

  const renderView = () => {
    switch (route) {
      case '/generator':
        return (
          <Generator
            settings={settings}
            initialPost={restoredPost}
            onPostRestored={handlePostRestored}
          />
        );
      case '/history':
        return <History onRestorePost={handleRestorePost} />;
      case '/settings':
        return <SettingsView settings={settings} onSettingsUpdate={setSettings} />;
      default:
        return (
          <Generator
            settings={settings}
            initialPost={restoredPost}
            onPostRestored={handlePostRestored}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-xhs-bg text-xhs-text">
      <Sidebar currentRoute={route} user={user} onLogout={handleLogout} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen no-scrollbar">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
