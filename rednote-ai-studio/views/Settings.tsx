import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ModelConfig, DEFAULT_SETTINGS } from '../types';
import { saveSettings } from '../services/db';
import { Save, RefreshCw, AlertCircle, Check, Plus, Trash2, Key, Database, Link as LinkIcon, Server, Edit2, X, Cloud, CloudOff } from 'lucide-react';
import { ApiService } from '../services/geminiService'; // Using generic ApiService
import { isLoggedIn } from '../services/auth';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
}

const EMPTY_MODEL_FORM: Partial<ModelConfig> = {
  name: '', displayName: '', apiKey: ''
};

const normalizeModels = (models: ModelConfig[]): ModelConfig[] => {
  return models.map(({ baseUrl, path, ...model }) => model);
};

const mergeModelsWithLocalApiKeys = (
  localModels: ModelConfig[],
  remoteModels: ModelConfig[] | undefined,
): ModelConfig[] => {
  const localNormalized = normalizeModels(localModels);

  if (!Array.isArray(remoteModels) || remoteModels.length === 0) {
    return localNormalized;
  }

  const remoteNormalized = normalizeModels(
    remoteModels.filter((model): model is ModelConfig => (
      !!model
      && typeof model.id === 'string'
      && typeof model.name === 'string'
      && typeof model.displayName === 'string'
    ))
  );

  if (remoteNormalized.length === 0) {
    return localNormalized;
  }

  const localById = new Map(localNormalized.map(model => [model.id, model]));
  const mergedFromRemote = remoteNormalized.map((remoteModel) => {
    const localModel = localById.get(remoteModel.id);
    const localApiKey = localModel?.apiKey?.trim();

    return {
      ...localModel,
      ...remoteModel,
      ...(localApiKey && !remoteModel.apiKey ? { apiKey: localApiKey } : {}),
    };
  });

  const remoteIds = new Set(remoteNormalized.map(model => model.id));
  const localOnlyModels = localNormalized.filter(model => !remoteIds.has(model.id));

  return [...mergedFromRemote, ...localOnlyModels];
};

const SettingsView: React.FC<SettingsProps> = ({ settings, onSettingsUpdate }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<{id: string, status: 'testing' | 'success' | 'failed'} | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [loggedIn, setLoggedIn] = useState<boolean>(isLoggedIn());

  // Model Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<Partial<ModelConfig>>(EMPTY_MODEL_FORM);

  // Initialize config only once in React StrictMode
  const isConfigLoaded = useRef(false);

  useEffect(() => {
    if (isConfigLoaded.current) return;
    isConfigLoaded.current = true;

    const initConfig = async () => {
      const currentLoggedIn = isLoggedIn();
      setLoggedIn(currentLoggedIn);

      if (!currentLoggedIn) {
        console.log('Skip cloud config load: user not logged in');
        return;
      }

      const service = new ApiService(settings);
      const remoteConfig = await service.getConfig();

      if (remoteConfig) {
        console.log('Remote config found, merging with local config (keeping local API keys)');

        const mergedConfig: AppSettings = {
          ...settings,
          backendUrl: typeof remoteConfig.backendUrl === 'string' ? remoteConfig.backendUrl : settings.backendUrl,
          activeTextModelId: typeof remoteConfig.activeTextModelId === 'string' ? remoteConfig.activeTextModelId : settings.activeTextModelId,
          activeImageModelId: typeof remoteConfig.activeImageModelId === 'string' ? remoteConfig.activeImageModelId : settings.activeImageModelId,
          models: mergeModelsWithLocalApiKeys(settings.models, remoteConfig.models),
          temperature: typeof remoteConfig.temperature === 'number' ? remoteConfig.temperature : settings.temperature,
          topP: typeof remoteConfig.topP === 'number' ? remoteConfig.topP : settings.topP,
        };

        setFormData(mergedConfig);
        onSettingsUpdate(mergedConfig);
        await saveSettings(mergedConfig);
      }
    };

    initConfig();
  }, []);

  const handleParamChange = (key: keyof AppSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
    setSyncStatus('idle');
  };

  const handleSave = async () => {
    const normalizedFormData: AppSettings = {
      ...formData,
      models: normalizeModels(formData.models),
    };

    // Always save to local IndexedDB
    await saveSettings(normalizedFormData);
    onSettingsUpdate(normalizedFormData);
    setFormData(normalizedFormData);
    setIsSaved(true);

    // Initialize model config in backend session
    const apiService = new ApiService(normalizedFormData);
    const modelConfigSuccess = await apiService.setModelConfig();

    if (!modelConfigSuccess) {
      console.warn('Failed to update model config in session');
    }

    // Sync to backend only when logged in
    const currentLoggedIn = isLoggedIn();
    setLoggedIn(currentLoggedIn);

    if (currentLoggedIn) {
      setSyncStatus('syncing');
      const success = await apiService.saveConfig(normalizedFormData);

      if (success) {
        setSyncStatus('synced');
        console.log('Config synced to backend');
      } else {
        setSyncStatus('error');
        console.error('Failed to sync config to backend');
      }
    }

    setTimeout(() => {
      setIsSaved(false);
      setSyncStatus('idle');
    }, 3000);
  };

  const handleTestConnection = async (modelId: string) => {
    const modelConfig = formData.models.find(m => m.id === modelId);
    if (!modelConfig) return;

    setTestResult({ id: modelId, status: 'testing' });
    const service = new ApiService(formData);
    const success = await service.testConnection(modelConfig);
    setTestResult({ id: modelId, status: success ? 'success' : 'failed' });
    
    setTimeout(() => setTestResult(null), 3000);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingModelId(null);
    setModelForm(EMPTY_MODEL_FORM);
  };

  const handleEditModel = (model: ModelConfig) => {
    setModelForm({
      name: model.name,
      displayName: model.displayName,
      apiKey: model.apiKey || '',
    });
    setEditingModelId(model.id);
    setIsFormOpen(true);
  };

  const handleSaveModelConfig = () => {
    if (!modelForm.displayName || !modelForm.name) return;

    const normalizedApiKey = modelForm.apiKey?.trim() || undefined;
    
    if (editingModelId) {
      // Update existing model
      setFormData(prev => ({
        ...prev,
        models: prev.models.map(m => m.id === editingModelId ? {
          ...m,
          displayName: modelForm.displayName!,
          name: modelForm.name!,
          apiKey: normalizedApiKey,
          baseUrl: undefined,
          path: undefined,
        } : m)
      }));
    } else {
      // Add new model
      const modelConfig: ModelConfig = {
        id: `custom-${Date.now()}`,
        displayName: modelForm.displayName!,
        name: modelForm.name!,
        apiKey: normalizedApiKey,
      };
      setFormData(prev => ({
        ...prev,
        models: [...prev.models, modelConfig]
      }));
    }

    resetForm();
    setIsSaved(false); // Mark as unsaved changes
  };

  const handleDeleteModel = (id: string) => {
    if (confirm("确定要删除此配置吗？")) {
      setFormData(prev => ({
        ...prev,
        models: prev.models.filter(m => m.id !== id),
        // Reset active if deleted
        activeTextModelId: prev.activeTextModelId === id ? DEFAULT_SETTINGS.activeTextModelId : prev.activeTextModelId,
        activeImageModelId: prev.activeImageModelId === id ? DEFAULT_SETTINGS.activeImageModelId : prev.activeImageModelId,
      }));
      setIsSaved(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">设置</h1>
          <p className="text-gray-500 mt-2">配置后端服务地址、AI 模型及生成参数。</p>
          <p className="text-xs text-gray-400 mt-1">
            云端同步需要登录；API Key 仅保存在本地浏览器，不会上传到云端。
          </p>
          <p className={`text-xs mt-1 flex items-center ${loggedIn ? 'text-green-600' : 'text-gray-400'}`}>
            {loggedIn ? (
              <>
                <Cloud size={12} className="mr-1" /> 已登录，保存时会自动同步到云端
              </>
            ) : (
              <>
                <CloudOff size={12} className="mr-1" /> 未登录，仅保存到本地
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSave}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center shadow-lg shadow-gray-200"
          >
            {isSaved ? <Check size={18} className="mr-2" /> : <Save size={18} className="mr-2" />}
            {isSaved ? '已保存' : '保存更改'}
          </button>
          {syncStatus !== 'idle' && (
            <div className={`text-xs flex items-center ${
              syncStatus === 'synced' ? 'text-green-600' :
              syncStatus === 'syncing' ? 'text-blue-600' :
              'text-red-600'
            }`}>
              {syncStatus === 'synced' && <><Cloud size={12} className="mr-1" /> 已同步到云端</>}
              {syncStatus === 'syncing' && <><RefreshCw size={12} className="mr-1 animate-spin" /> 同步中...</>}
              {syncStatus === 'error' && <><CloudOff size={12} className="mr-1" /> 云端同步失败</>}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        {/* Backend Configuration */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Server className="mr-2 text-xhs-red" size={20} />
            后端服务配置
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">后端服务地址 (URL)</label>
            <div className="relative">
              <input
                type="text"
                value={formData.backendUrl}
                onChange={(e) => handleParamChange('backendUrl', e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none font-mono text-sm"
              />
              <LinkIcon className="absolute left-3 top-3.5 text-gray-400" size={16} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              所有的 AI 生成请求将发送至此地址 (例如: /api/generate/outline)
            </p>
          </div>
        </div>

        {/* Active Models Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Database className="mr-2 text-xhs-red" size={20} />
            当前使用模型
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">文本生成模型</label>
              <select
                value={formData.activeTextModelId}
                onChange={(e) => handleParamChange('activeTextModelId', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none"
              >
                {formData.models.map(m => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">图片生成模型</label>
              <select
                value={formData.activeImageModelId}
                onChange={(e) => handleParamChange('activeImageModelId', e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none"
              >
                {formData.models.map(m => (
                  <option key={m.id} value={m.id}>{m.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                随机性 Temperature ({formData.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-xhs-red"
              />
              <p className="text-xs text-gray-400 mt-1">数值越低越稳定，越高越发散</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                核采样 Top P ({formData.topP})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.topP}
                onChange={(e) => handleParamChange('topP', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-xhs-red"
              />
              <p className="text-xs text-gray-400 mt-1">核采样概率阈值</p>
            </div>
          </div>
        </div>

        {/* Model Library Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Key className="mr-2 text-xhs-red" size={20} />
              模型库
            </h3>
            {!isFormOpen && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center text-sm font-medium text-xhs-red bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Plus size={16} className="mr-1" /> 添加模型
              </button>
            )}
          </div>

          {/* Add/Edit Model Form */}
          {isFormOpen && (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-800">
                  {editingModelId ? '编辑模型配置' : '添加新模型配置'}
                </h4>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 ml-1">显示名称</label>
                  <input
                    placeholder="例如: GPT-4o"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-xhs-red outline-none"
                    value={modelForm.displayName}
                    onChange={e => setModelForm({ ...modelForm, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-500 ml-1">模型 ID</label>
                  <input
                    placeholder="例如: gpt-4o"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-xhs-red outline-none"
                    value={modelForm.name}
                    onChange={e => setModelForm({ ...modelForm, name: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-1 relative">
                  <label className="text-xs text-gray-500 ml-1">API Key</label>
                  <input
                    type="password"
                    placeholder="选填，仅本地保存，不会同步到云端"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-xhs-red outline-none"
                    value={modelForm.apiKey}
                    onChange={e => setModelForm({ ...modelForm, apiKey: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={resetForm} className="px-4 py-2 text-gray-500 hover:text-gray-800 text-sm font-medium">取消</button>
                <button onClick={handleSaveModelConfig} className="px-6 py-2 bg-xhs-red text-white rounded-lg font-medium hover:bg-red-600 text-sm">
                  {editingModelId ? '更新配置' : '确认添加'}
                </button>
              </div>
            </div>
          )}

          {/* Models List */}
          <div className="space-y-4">
            {formData.models.map(model => (
              <div key={model.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white">
                <div className="flex items-center mb-3 md:mb-0">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xhs-red font-bold mr-4 shrink-0">
                    AI
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{model.displayName}</h4>
                    <div className="flex flex-wrap items-center text-xs text-gray-500 gap-x-3 gap-y-1 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">{model.name}</span>
                      {model.apiKey && (
                        <span className="text-green-600 flex items-center"><Key size={10} className="mr-1" /> 已配置 Key</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(model.id)}
                    disabled={testResult?.id === model.id && testResult.status === 'testing'}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center ${
                      testResult?.id === model.id && testResult.status === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                      testResult?.id === model.id && testResult.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {testResult?.id === model.id && testResult.status === 'testing' ? <RefreshCw size={12} className="animate-spin mr-1" /> :
                     testResult?.id === model.id && testResult.status === 'success' ? <Check size={12} className="mr-1" /> :
                     testResult?.id === model.id && testResult.status === 'failed' ? <AlertCircle size={12} className="mr-1" /> :
                     <RefreshCw size={12} className="mr-1" />}
                    {testResult?.id === model.id && testResult.status === 'testing' ? '测试' :
                     testResult?.id === model.id && testResult.status === 'success' ? '正常' :
                     testResult?.id === model.id && testResult.status === 'failed' ? '失败' : '测试'}
                  </button>

                  <button
                    onClick={() => handleEditModel(model)}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>

                  {!model.id.startsWith('default') && (
                    <button
                      onClick={() => handleDeleteModel(model.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
