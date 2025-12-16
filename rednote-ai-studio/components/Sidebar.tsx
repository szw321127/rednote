import React from 'react';
import { PenTool, History, Settings, Sparkles } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
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

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-100 rounded-xl p-3 hidden md:block">
            <p className="text-xs text-gray-500 font-medium">系统状态</p>
            <div className="flex items-center mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-600">Gemini 在线</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;