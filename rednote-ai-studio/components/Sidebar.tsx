import React from 'react';
import { PenTool, History, Settings, Sparkles, LogIn, LogOut } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { AuthUser } from '../services/auth';

interface SidebarProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { to: '/generator', label: '作品生成', icon: Sparkles },
    { to: '/history', label: '历史记录', icon: History },
    { to: '/settings', label: '用户设置', icon: Settings },
  ] as const;

  return (
    <div className="w-20 md:w-64 bg-xhs-surface h-screen flex flex-col border-r border-xhs-border sticky top-0">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-xhs-border">
        <div className="bg-xhs-red p-2.5 rounded-xl text-white shadow-soft">
          <PenTool size={20} aria-hidden="true" />
        </div>
        <span className="ml-3 font-bold text-xl text-xhs-text hidden md:block">
          RedNote AI
        </span>
      </div>

      <nav className="flex-1 py-4 px-2 md:px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/settings'}
            className={({ isActive }) =>
              `group relative w-full flex items-center px-3 md:px-4 py-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-surface ${
                isActive
                  ? 'text-xhs-red bg-red-50'
                  : 'text-xhs-secondary hover:bg-gray-50 hover:text-xhs-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-xhs-red transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                  }`}
                  aria-hidden="true"
                />

                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span
                  className={`ml-4 font-medium hidden md:block ${
                    isActive ? 'text-xhs-text' : ''
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-xhs-border space-y-3">
        {user ? (
          <div className="hidden md:block">
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-xhs-text truncate">
                    {user.nickname}
                  </p>
                  <p className="text-xs text-xhs-secondary truncate">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-gray-400 hover:text-xhs-red ml-2 flex-shrink-0 rounded-lg p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50"
                  aria-label="退出登录"
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-xhs-secondary">
                  配额: {user.quotaUsed}/{user.quotaLimit}
                </span>
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-xhs-red rounded">
                  {user.plan}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              navigate('/login', { state: { from: location.pathname } })
            }
            className="w-full flex items-center justify-center md:justify-start px-4 md:px-4 py-2.5 text-sm text-xhs-secondary hover:text-xhs-red hover:bg-red-50 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2 focus-visible:ring-offset-xhs-surface"
          >
            <LogIn size={18} aria-hidden="true" />
            <span className="ml-2 hidden md:block">登录 / 注册</span>
          </button>
        )}

        <div className="bg-gray-50 rounded-2xl p-3 hidden md:block border border-gray-100">
          <p className="text-xs text-xhs-secondary font-medium">系统状态</p>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <span className="text-xs text-gray-600">服务在线</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
