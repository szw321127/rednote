import React from 'react';
import { PenTool, History, Settings, Sparkles, LogIn, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { AuthUser } from '../services/auth';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  user?: AuthUser | null;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onLoginClick, onLogout }) => {
  const menuItems = [
    { id: 'generator', label: '作品生成', icon: Sparkles },
    { id: 'history', label: '历史记录', icon: History },
    { id: 'settings', label: '用户设置', icon: Settings },
  ];

  return (
    <div className="w-20 md:w-64 bg-white h-screen flex flex-col border-r border-gray-200 sticky top-0">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-gray-100">
        <div className="bg-xhs-red p-2 rounded-lg text-white">
            <PenTool size={20} />
        </div>
        <span className="ml-3 font-bold text-xl text-xhs-text hidden md:block">RedNote AI</span>
      </div>

      <nav className="flex-1 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewState)}
              className={`w-full flex items-center px-4 md:px-6 py-3 transition-colors ${
                isActive
                  ? 'text-xhs-red bg-red-50 border-r-4 border-xhs-red'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`ml-4 font-medium hidden md:block ${isActive ? 'text-xhs-text' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 space-y-3">
        {user ? (
          <div className="hidden md:block">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.nickname}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <button onClick={onLogout} className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0">
                  <LogOut size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  配额: {user.quotaUsed}/{user.quotaLimit}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                  {user.plan}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="w-full flex items-center justify-center md:justify-start px-4 md:px-6 py-2.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogIn size={18} />
            <span className="ml-2 hidden md:block">登录 / 注册</span>
          </button>
        )}

        <div className="bg-gray-100 rounded-xl p-3 hidden md:block">
            <p className="text-xs text-gray-500 font-medium">系统状态</p>
            <div className="flex items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">服务在线</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
