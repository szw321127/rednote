import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, ModelConfig, DEFAULT_SETTINGS } from '../types';
import { saveSettings } from '../services/db';
import {
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  Plus,
  Trash2,
  Key,
  Database,
  Link as LinkIcon,
  Server,
  Edit2,
  X,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { ApiService } from '../services/geminiService';
import { isLoggedIn } from '../services/auth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { IconButton } from '../components/ui/IconButton';
import { Input } from '../components/ui/Input';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
}

const EMPTY_MODEL_FORM: Partial<ModelConfig> = {
  name: '',
  displayName: '',
  apiKey: '',
  baseUrl: '',
  path: '',
};

const normalizeModel = (model: ModelConfig): ModelConfig => {
  const normalizedApiKey = model.apiKey?.trim();
  const normalizedBaseUrl = model.baseUrl?.trim();
  const normalizedPath = model.path?.trim();

  return {
    ...model,
    name: model.name.trim(),
    displayName: model.displayName.trim(),
    apiKey: normalizedApiKey || undefined,
    baseUrl: normalizedBaseUrl || undefined,
    path: normalizedPath || undefined,
  };
};

const normalizeModels = (models: ModelConfig[]): ModelConfig[] => {
  return models.map((model) => normalizeModel(model));
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
    remoteModels.filter(
      (model): model is ModelConfig =>
        !!model
        && typeof model.id === 'string'
        && typeof model.name === 'string'
        && typeof model.displayName === 'string',
    ),
  );

  if (remoteNormalized.length === 0) {
    return localNormalized;
  }

  const localById = new Map(localNormalized.map((model) => [model.id, model]));
  const mergedFromRemote = remoteNormalized.map((remoteModel) => {
    const localModel = localById.get(remoteModel.id);
    const localApiKey = localModel?.apiKey?.trim();
    const remoteApiKey = remoteModel.apiKey?.trim();
    const remoteBaseUrl = remoteModel.baseUrl?.trim();
    const localBaseUrl = localModel?.baseUrl?.trim();
    const remotePath = remoteModel.path?.trim();
    const localPath = localModel?.path?.trim();

    return normalizeModel({
      ...localModel,
      ...remoteModel,
      apiKey: localApiKey || remoteApiKey || undefined,
      baseUrl: remoteBaseUrl || localBaseUrl || undefined,
      path: remotePath || localPath || undefined,
    });
  });

  const remoteIds = new Set(remoteNormalized.map((model) => model.id));
  const localOnlyModels = localNormalized.filter((model) => !remoteIds.has(model.id));

  return [...mergedFromRemote, ...localOnlyModels];
};

const SettingsView: React.FC<SettingsProps> = ({ settings, onSettingsUpdate }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [testResult, setTestResult] = useState<{
    id: string;
    status: 'testing' | 'success' | 'failed';
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'synced' | 'error'
  >('idle');
  const [loggedIn, setLoggedIn] = useState<boolean>(isLoggedIn());

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelForm, setModelForm] = useState<Partial<ModelConfig>>(EMPTY_MODEL_FORM);

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
        console.log(
          'Remote config found, merging with local config (keeping local API keys)',
        );

        const mergedConfig: AppSettings = {
          ...settings,
          backendUrl:
            typeof remoteConfig.backendUrl === 'string'
              ? remoteConfig.backendUrl
              : settings.backendUrl,
          activeTextModelId:
            typeof remoteConfig.activeTextModelId === 'string'
              ? remoteConfig.activeTextModelId
              : settings.activeTextModelId,
          activeImageModelId:
            typeof remoteConfig.activeImageModelId === 'string'
              ? remoteConfig.activeImageModelId
              : settings.activeImageModelId,
          models: mergeModelsWithLocalApiKeys(settings.models, remoteConfig.models),
          temperature:
            typeof remoteConfig.temperature === 'number'
              ? remoteConfig.temperature
              : settings.temperature,
          topP:
            typeof remoteConfig.topP === 'number'
              ? remoteConfig.topP
              : settings.topP,
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

  const persistSettingsChanges = async (
    nextSettings: AppSettings,
    options: { showSaveFeedback?: boolean } = {},
  ) => {
    const normalizedSettings: AppSettings = {
      ...nextSettings,
      models: normalizeModels(nextSettings.models),
    };

    await saveSettings(normalizedSettings);
    onSettingsUpdate(normalizedSettings);
    setFormData(normalizedSettings);

    if (options.showSaveFeedback) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }

    const apiService = new ApiService(normalizedSettings);
    const modelConfigSuccess = await apiService.setModelConfig();

    if (!modelConfigSuccess) {
      console.warn('Failed to update model config in session');
    }

    const currentLoggedIn = isLoggedIn();
    setLoggedIn(currentLoggedIn);

    if (currentLoggedIn) {
      setSyncStatus('syncing');
      const success = await apiService.saveConfig(normalizedSettings);

      if (success) {
        setSyncStatus('synced');
        console.log('Config synced to backend');
      } else {
        setSyncStatus('error');
        console.error('Failed to sync config to backend');
      }

      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } else {
      setSyncStatus('idle');
    }

    if (options.showSaveFeedback) {
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    }

    return normalizedSettings;
  };

  const handleSave = async () => {
    await persistSettingsChanges(formData, { showSaveFeedback: true });
  };

  const handleTestConnection = async (modelId: string) => {
    const modelConfig = formData.models.find((m) => m.id === modelId);
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
      baseUrl: model.baseUrl || '',
      path: model.path || '',
    });
    setEditingModelId(model.id);
    setIsFormOpen(true);
  };

  const handleSaveModelConfig = async () => {
    if (!modelForm.displayName || !modelForm.name) return;

    const normalizedApiKey = modelForm.apiKey?.trim() || undefined;
    const normalizedBaseUrl = modelForm.baseUrl?.trim() || undefined;
    const normalizedPath = modelForm.path?.trim() || undefined;

    let nextSettings: AppSettings;

    if (editingModelId) {
      nextSettings = {
        ...formData,
        models: formData.models.map((model) =>
          model.id === editingModelId
            ? {
                ...model,
                displayName: modelForm.displayName!,
                name: modelForm.name!,
                apiKey: normalizedApiKey,
                baseUrl: normalizedBaseUrl,
                path: normalizedPath,
              }
            : model,
        ),
      };
    } else {
      const modelConfig: ModelConfig = {
        id: `custom-${Date.now()}`,
        displayName: modelForm.displayName!,
        name: modelForm.name!,
        apiKey: normalizedApiKey,
        baseUrl: normalizedBaseUrl,
        path: normalizedPath,
      };

      nextSettings = {
        ...formData,
        models: [...formData.models, modelConfig],
      };
    }

    resetForm();
    await persistSettingsChanges(nextSettings);
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) return;

    const nextSettings: AppSettings = {
      ...formData,
      models: formData.models.filter((model) => model.id !== id),
      activeTextModelId:
        formData.activeTextModelId === id
          ? DEFAULT_SETTINGS.activeTextModelId
          : formData.activeTextModelId,
      activeImageModelId:
        formData.activeImageModelId === id
          ? DEFAULT_SETTINGS.activeImageModelId
          : formData.activeImageModelId,
    };

    await persistSettingsChanges(nextSettings);
  };

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xhs-red/30 focus-visible:ring-offset-2';

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-xhs-text">设置</h1>
          <p className="text-xhs-secondary mt-2">配置后端服务地址、AI 模型及生成参数。</p>
          <p className="text-xs text-gray-400 mt-1">
            云端同步需要登录；API Key 仅保存在本地浏览器，不会上传到云端。
          </p>
          <p
            className={`text-xs mt-1 flex items-center ${
              loggedIn ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {loggedIn ? (
              <>
                <Cloud size={12} className="mr-1" aria-hidden="true" />
                已登录，保存时会自动同步到云端
              </>
            ) : (
              <>
                <CloudOff size={12} className="mr-1" aria-hidden="true" />
                未登录，仅保存到本地
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            className="font-bold focus-visible:ring-offset-xhs-bg"
          >
            {isSaved ? (
              <Check size={18} className="mr-2" aria-hidden="true" />
            ) : (
              <Save size={18} className="mr-2" aria-hidden="true" />
            )}
            {isSaved ? '已保存' : '保存更改'}
          </Button>

          {syncStatus !== 'idle' && (
            <div
              className={`text-xs flex items-center ${
                syncStatus === 'synced'
                  ? 'text-green-600'
                  : syncStatus === 'syncing'
                    ? 'text-blue-600'
                    : 'text-red-600'
              }`}
            >
              {syncStatus === 'synced' && (
                <>
                  <Cloud size={12} className="mr-1" aria-hidden="true" /> 已同步到云端
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw
                    size={12}
                    className="mr-1 animate-spin"
                    aria-hidden="true"
                  />
                  同步中...
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <CloudOff size={12} className="mr-1" aria-hidden="true" /> 云端同步失败
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <h3 className="text-lg font-bold text-xhs-text mb-6 flex items-center">
            <Server className="mr-2 text-xhs-red" size={20} aria-hidden="true" />
            后端服务配置
          </h3>
          <div>
            <label className="block text-sm font-medium text-xhs-text mb-2">
              后端服务地址 (URL)
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.backendUrl}
                onChange={(e) => handleParamChange('backendUrl', e.target.value)}
                placeholder="http://localhost:3000"
                className={`w-full p-3 pl-10 bg-gray-50 border border-xhs-border rounded-xl font-mono text-sm ${focusRing} focus-visible:ring-offset-xhs-surface`}
              />
              <LinkIcon
                className="absolute left-3 top-3.5 text-gray-400"
                size={16}
                aria-hidden="true"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              所有的 AI 生成请求将发送至此地址 (例如: /api/generate/outline)
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-xhs-text mb-6 flex items-center">
            <Database className="mr-2 text-xhs-red" size={20} aria-hidden="true" />
            当前使用模型
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-xhs-text mb-2">
                文本生成模型
              </label>
              <select
                value={formData.activeTextModelId}
                onChange={(e) => handleParamChange('activeTextModelId', e.target.value)}
                className={`w-full p-3 bg-gray-50 border border-xhs-border rounded-xl ${focusRing} focus-visible:ring-offset-xhs-surface`}
              >
                {formData.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-xhs-text mb-2">
                图片生成模型
              </label>
              <select
                value={formData.activeImageModelId}
                onChange={(e) => handleParamChange('activeImageModelId', e.target.value)}
                className={`w-full p-3 bg-gray-50 border border-xhs-border rounded-xl ${focusRing} focus-visible:ring-offset-xhs-surface`}
              >
                {formData.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-xhs-text mb-2">
                随机性 Temperature ({formData.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  handleParamChange('temperature', parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-xhs-red"
              />
              <p className="text-xs text-gray-400 mt-1">
                数值越低越稳定，越高越发散
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-xhs-text mb-2">
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
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-xhs-text flex items-center">
              <Key className="mr-2 text-xhs-red" size={20} aria-hidden="true" />
              模型库
            </h3>
            {!isFormOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="text-xhs-red bg-red-50 enabled:hover:bg-red-100 focus-visible:ring-offset-xhs-surface"
              >
                <Plus size={16} className="mr-1" aria-hidden="true" /> 添加模型
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            模型新增、编辑、删除会自动保存；无需再点击“保存更改”。
          </p>

          {isFormOpen && (
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-xhs-border animate-fade-in relative">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-xhs-text">
                  {editingModelId ? '编辑模型配置' : '添加新模型配置'}
                </h4>
                <IconButton
                  ariaLabel="关闭"
                  onClick={resetForm}
                  className="rounded-lg focus-visible:ring-offset-gray-50"
                >
                  <X size={20} aria-hidden="true" />
                </IconButton>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="显示名称"
                  placeholder="例如: GPT-4o"
                  value={modelForm.displayName || ''}
                  onChange={(e) =>
                    setModelForm({ ...modelForm, displayName: e.target.value })
                  }
                  className="focus-visible:ring-offset-gray-50"
                />
                <Input
                  label="模型 ID"
                  placeholder="例如: gpt-4o"
                  value={modelForm.name || ''}
                  onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                  className="focus-visible:ring-offset-gray-50"
                />
                <div className="md:col-span-2">
                  <Input
                    label="API Key"
                    type="password"
                    placeholder="选填，仅本地保存，不会同步到云端"
                    value={modelForm.apiKey || ''}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, apiKey: e.target.value })
                    }
                    className="focus-visible:ring-offset-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Base URL（可选）"
                    type="text"
                    placeholder="例如: https://api.openai.com"
                    value={modelForm.baseUrl || ''}
                    onChange={(e) =>
                      setModelForm({ ...modelForm, baseUrl: e.target.value })
                    }
                    helperText="可自由填写；仅支持 https，且不能是内网地址。"
                    className="focus-visible:ring-offset-gray-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Path（可选）"
                    type="text"
                    placeholder="例如: /v1/chat/completions"
                    value={modelForm.path || ''}
                    onChange={(e) => setModelForm({ ...modelForm, path: e.target.value })}
                    className="focus-visible:ring-offset-gray-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={resetForm}
                  className="text-xhs-secondary enabled:hover:text-xhs-text focus-visible:ring-offset-gray-50"
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveModelConfig}
                  className="shadow-soft focus-visible:ring-offset-gray-50"
                >
                  {editingModelId ? '更新配置' : '确认添加'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {formData.models.map((model) => {
              const buttonStateClass =
                testResult?.id === model.id && testResult.status === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : testResult?.id === model.id && testResult.status === 'failed'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-xhs-surface text-xhs-secondary border-xhs-border hover:bg-gray-50 hover:text-xhs-text';

              return (
                <div
                  key={model.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-xhs-border rounded-2xl hover:border-xhs-red/30 transition-colors bg-xhs-surface"
                >
                  <div className="flex items-center mb-3 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-xhs-red font-bold mr-4 shrink-0">
                      AI
                    </div>
                    <div>
                      <h4 className="font-bold text-xhs-text">{model.displayName}</h4>
                      <div className="flex flex-wrap items-center text-xs text-xhs-secondary gap-x-3 gap-y-1 mt-1">
                        <Badge variant="neutral" className="font-mono">
                          {model.name}
                        </Badge>
                        {model.apiKey && (
                          <Badge variant="success">
                            <Key size={10} aria-hidden="true" /> 已配置 Key
                          </Badge>
                        )}
                        {(model.baseUrl || model.path) && (
                          <Badge
                            variant="info"
                            className="font-mono max-w-[260px] overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            {`${model.baseUrl || ''}${model.path || ''}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTestConnection(model.id)}
                      disabled={
                        testResult?.id === model.id && testResult.status === 'testing'
                      }
                      className={`${buttonStateClass} focus-visible:ring-offset-xhs-surface`}
                    >
                      {testResult?.id === model.id &&
                      testResult.status === 'testing' ? (
                        <RefreshCw
                          size={12}
                          className="animate-spin mr-1"
                          aria-hidden="true"
                        />
                      ) : testResult?.id === model.id &&
                        testResult.status === 'success' ? (
                        <Check size={12} className="mr-1" aria-hidden="true" />
                      ) : testResult?.id === model.id &&
                        testResult.status === 'failed' ? (
                        <AlertCircle
                          size={12}
                          className="mr-1"
                          aria-hidden="true"
                        />
                      ) : (
                        <RefreshCw size={12} className="mr-1" aria-hidden="true" />
                      )}
                      {testResult?.id === model.id && testResult.status === 'testing'
                        ? '测试'
                        : testResult?.id === model.id && testResult.status === 'success'
                          ? '正常'
                          : testResult?.id === model.id && testResult.status === 'failed'
                            ? '失败'
                            : '测试'}
                    </Button>

                    <IconButton
                      ariaLabel="编辑"
                      onClick={() => handleEditModel(model)}
                      className="text-gray-400 enabled:hover:text-blue-600 enabled:hover:bg-blue-50 focus-visible:ring-offset-xhs-surface"
                      title="编辑"
                    >
                      <Edit2 size={16} aria-hidden="true" />
                    </IconButton>

                    {!model.id.startsWith('default') && (
                      <IconButton
                        ariaLabel="删除"
                        variant="danger"
                        onClick={() => handleDeleteModel(model.id)}
                        className="focus-visible:ring-offset-xhs-surface"
                        title="删除"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </IconButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsView;
