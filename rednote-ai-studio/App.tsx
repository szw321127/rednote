import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Generator from './views/Generator';
import History from './views/History';
import SettingsView from './views/Settings';
import { AppSettings, DEFAULT_SETTINGS, ViewState, GeneratedPost } from './types';
import { getSettings } from './services/db';
import { ApiService } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('generator');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [restoredPost, setRestoredPost] = useState<GeneratedPost | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Load settings from IndexedDB on startup
    getSettings().then(async (savedSettings) => {
      setSettings(savedSettings);
      setIsHydrated(true);

      // Initialize model config in backend session
      const apiService = new ApiService(savedSettings);
      const success = await apiService.setModelConfig();
      if (success) {
        console.log('Model configuration initialized in session');
      } else {
        console.warn('Failed to initialize model configuration in session');
      }
    });
  }, []);

  const handleRestorePost = (post: GeneratedPost) => {
    setRestoredPost(post);
    setCurrentView('generator');
  };

  const handlePostRestored = () => {
    // 清除 restoredPost，避免重复恢复
    setRestoredPost(null);
  };

  if (!isHydrated) return null;

  const renderView = () => {
    switch (currentView) {
      case 'generator':
        return (
          <Generator
            settings={settings}
            initialPost={restoredPost}
            onPostRestored={handlePostRestored}
          />
        );
      case 'history':
        return <History onRestorePost={handleRestorePost} />;
      case 'settings':
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
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen no-scrollbar">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
