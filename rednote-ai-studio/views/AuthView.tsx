import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';

interface AuthViewProps {
  backendUrl: string;
  onLoginSuccess: (data: {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; nickname: string; plan: string; quotaLimit: number; quotaUsed: number };
  }) => void;
  onSkip: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ backendUrl, onLoginSuccess, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = backendUrl.replace(/\/$/, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { email, password };
      if (!isLogin && nickname) body.nickname = nickname;

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '操作失败');
      }

      const data = await res.json();
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RedNote AI Studio</h1>
          <p className="text-gray-500 mt-2">AI 驱动的小红书内容创作平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <LogIn size={16} className="inline mr-1" /> 登录
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <UserPlus size={16} className="inline mr-1" /> 注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
              />
            </div>

            {!isLogin && (
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="昵称（可选）"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                />
              </div>
            )}

            <div className="relative">
              <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                placeholder="密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={onSkip}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              跳过登录，以访客身份使用
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          登录后可享受云端同步、使用统计等高级功能
        </p>
      </div>
    </div>
  );
};

export default AuthView;
