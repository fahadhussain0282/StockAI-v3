import React, { useState, useEffect } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { TopControlsBar } from './components/TopControlsBar';
import { MetadataSettingsPanel } from './components/MetadataSettingsPanel';
import { UploadZone } from './components/UploadZone';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { PromptGeneratorView } from './components/PromptGeneratorView';
import { AllToolsView } from './components/AllToolsView';
import { HowToUseView } from './components/HowToUseView';
import { PricingModal } from './components/PricingModal';
import { ApiKeysModal } from './components/ApiKeysModal';
import { ZoomModal } from './components/ZoomModal';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { LockedExperienceModal } from './components/LockedExperienceModal';

import { 
  UploadedFile, 
  MetadataSettings, 
  UserCredits, 
  FileType, 
  MetadataResult,
  UserSubscription,
  AuthUser
} from './types';
import { MARKETPLACE_REGISTRY } from './registries/marketplaces';
import { PROVIDER_REGISTRY } from './registries/providers';
import { generateMarketplaceCSV } from './services/csvnest/exporter';
import { calculateSEOAndQualityScores } from './services/csvnest/scoring';

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'tools' | 'how-to-use' | 'pricing' | 'discord'>('generator');
  const [activeSubTab, setActiveSubTab] = useState<'metadata' | 'prompt'>('metadata');

  // Route Detection (/admin)
  const [routePath, setRoutePath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoutePath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('stockai_auth_token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLockedExperienceOpen, setIsLockedExperienceOpen] = useState(false);

  // Device & Session Management
  const [deviceId] = useState<string>(() => {
    let saved = localStorage.getItem('stockai_device_id');
    if (!saved) {
      saved = `device_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('stockai_device_id', saved);
    }
    return saved;
  });

  // Fetch Current Auth User on Startup
  useEffect(() => {
    if (authToken) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Device-Id': deviceId
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Session invalidated');
        return res.json();
      })
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
          setSubscription(data.user.subscription);
        }
        setIsInitializing(false);
      })
      .catch(() => {
        setCurrentUser(null);
        setAuthToken('');
        localStorage.removeItem('stockai_auth_token');
        setIsInitializing(false);
      });
    } else {
      // Clear session if no auth token is present (No auto-login)
      setCurrentUser(null);
      setIsInitializing(false);
    }
  }, [authToken, deviceId]);

  // Subscription State & Expiry Logic
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      planId: 'plan_1m',
      planName: '1 Month Plan',
      price: 300,
      durationDays: 30,
      activatedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      isActive: true,
      isExpired: false,
      deviceId
    };
  });

  const updateSubscription = (newSub: UserSubscription) => {
    setSubscription(newSub);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        subscription: newSub
      });
    }
  };

  const handleAuthSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('stockai_auth_token', token);
    setSubscription(user.subscription);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken('');
    localStorage.removeItem('stockai_auth_token');
    setIsLockedExperienceOpen(false);
  };

  // Modals & Admin Panel
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [zoomModal, setZoomModal] = useState({ isOpen: false, url: '', title: '' });


  // Theme System: Light / Dark / System
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('stockai_theme') as 'dark' | 'light' | 'system') || 'dark';
  });

  const setTheme = (mode: 'dark' | 'light' | 'system') => {
    setThemeState(mode);
    localStorage.setItem('stockai_theme', mode);
  };

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Provider & API Keys State (Isolated per user)
  const [selectedProvider, setSelectedProviderState] = useState<string>('google-gemini');
  const [providerKeys, setProviderKeysState] = useState<Record<string, string>>({ 'google-gemini': '', grok: '', groq: '' });
  const [providerModels, setProviderModelsState] = useState<Record<string, string>>({
    'google-gemini': 'gemini-3.6-flash',
    grok: 'grok-2-vision-1212',
    groq: 'llama-3.2-11b-vision-preview'
  });

  // Load and isolate state on login/logout
  useEffect(() => {
    if (currentUser) {
      try {
        const uid = currentUser.id;
        const savedProvider = localStorage.getItem(`stockai_provider_${uid}`);
        if (savedProvider) setSelectedProviderState(savedProvider);
        
        const savedKeysStr = localStorage.getItem(`stockai_provider_keys_${uid}`);
        if (savedKeysStr) {
           setProviderKeysState(JSON.parse(atob(savedKeysStr)));
        }
        
        const savedModelsStr = localStorage.getItem(`stockai_provider_models_${uid}`);
        if (savedModelsStr) {
           setProviderModelsState(JSON.parse(savedModelsStr));
        }
      } catch (e) {
        console.error("Failed to load user settings", e);
      }
    } else {
      // Completely clear all user-specific state for a new session
      setSelectedProviderState('google-gemini');
      setProviderKeysState({ 'google-gemini': '', grok: '', groq: '' });
      setProviderModelsState({
        'google-gemini': 'gemini-3.6-flash',
        grok: 'grok-2-vision-1212',
        groq: 'llama-3.2-11b-vision-preview'
      });
      setFiles([]);
    }
  }, [currentUser]);

  const setSelectedProvider = (provider: string) => {
    setSelectedProviderState(provider);
    if (currentUser) {
      localStorage.setItem(`stockai_provider_${currentUser.id}`, provider);
    }
  };

  const setProviderKey = (provider: string, key: string) => {
    setProviderKeysState(prev => {
      const updated = { ...prev, [provider]: key };
      if (currentUser) {
        localStorage.setItem(`stockai_provider_keys_${currentUser.id}`, btoa(JSON.stringify(updated)));
      }
      return updated;
    });
  };

  const setProviderModel = (provider: string, model: string) => {
    setProviderModelsState(prev => {
      const updated = { ...prev, [provider]: model };
      if (currentUser) {
        localStorage.setItem(`stockai_provider_models_${currentUser.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Metadata Settings
  const [settings, setSettings] = useState<MetadataSettings>({
    targetPlatform: 'general',
    titleLength: 70,
    descriptionLength: 150,
    keywordsCount: 30,
    prefix: '',
    enablePrefix: false,
    suffix: '',
    enableSuffix: false,
    negativeTitleWords: '',
    enableNegativeTitleWords: false,
    negativeKeywords: '',
    enableNegativeKeywords: false,
    autoTransparentPngTag: true
  });

  // User Credits & Plan
  const [credits, setCredits] = useState<UserCredits>({
    planName: 'Unlimited Plan',
    creditsRemaining: 9999,
    creditsMax: 9999,
    isPaid: true
  });

  // Files Queue
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Add sample demo assets if queue is empty on first load so user sees instant capability
  useEffect(() => {
    if (files.length === 0) {
      const demoFile: UploadedFile = {
        id: 'demo_1',
        name: 'abstract_vector_glass_background.png',
        size: 2450000,
        type: 'image/png',
        fileType: 'image',
        previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        status: 'pending'
      };
      setFiles([demoFile]);
    }
  }, []);

  // Handle File Uploads
  const handleUpload = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let fileType: FileType = 'image';
      if (file.type.includes('video')) fileType = 'video';
      else if (file.name.endsWith('.svg')) fileType = 'svg';
      else if (file.name.endsWith('.eps')) fileType = 'eps';

      const previewUrl = URL.createObjectURL(file);
      
      // Convert to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newFiles.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        fileType,
        previewUrl,
        base64Data,
        status: 'pending'
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  // Run StockAI Metadata Generation
  const handleGenerateAll = async () => {
    if (files.length === 0 || isGenerating) return;

    if (!currentUser || !currentUser.subscription || !currentUser.subscription.isActive) {
      setIsLockedExperienceOpen(true);
      return;
    }

    setIsGenerating(true);

    const activeKey = providerKeys[selectedProvider] || '';
    const activeModel = providerModels[selectedProvider] || '';

    for (const file of files) {
      if (file.status === 'completed' && file.metadata) continue;

      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, status: 'generating', progressMessage: 'Vision analysis & StockAI scoring...' } : f))
      );

      try {
        let res = await fetch('/api/generate-metadata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'X-Device-Id': deviceId
          },
          body: JSON.stringify({
            fileId: file.id,
            fileName: file.name,
            fileType: file.fileType,
            base64Data: file.base64Data,
            previewUrl: file.previewUrl,
            mimeType: file.type,
            settings,
            provider: selectedProvider,
            customApiKey: activeKey,
            selectedModel: activeModel
          })
        });

        // Auto-retry once with exponential backoff on transient/429 failures
        if (!res.ok && res.status === 429) {
          await new Promise(r => setTimeout(r, 1500));
          res = await fetch('/api/generate-metadata', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'X-Device-Id': deviceId
            },
            body: JSON.stringify({
              fileId: file.id,
              fileName: file.name,
              fileType: file.fileType,
              base64Data: file.base64Data,
              previewUrl: file.previewUrl,
              mimeType: file.type,
              settings,
              provider: selectedProvider,
              customApiKey: activeKey,
              selectedModel: activeModel
            })
          });
        }


        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to generate metadata');
        }

        const metadata: MetadataResult = await res.json();

        setFiles(prev =>
          prev.map(f => (f.id === file.id ? { ...f, status: 'completed', metadata } : f))
        );

        // Deduct 1 credit
        setCredits(c => ({
          ...c,
          creditsRemaining: Math.max(0, c.creditsRemaining - 1)
        }));
      } catch (err: any) {
        console.error('Generation error:', err);
        setFiles(prev =>
          prev.map(f => (f.id === file.id ? { ...f, status: 'error', error: err.message || 'Generation failed' } : f))
        );
      }
    }

    setIsGenerating(false);
  };

  // Live Metadata Editing Handlers
  const handleUpdateTitle = (fileId: string, newTitle: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId && f.metadata) {
          const rule = MARKETPLACE_REGISTRY[settings.targetPlatform] || MARKETPLACE_REGISTRY.general;
          const updatedScores = calculateSEOAndQualityScores(
            newTitle,
            f.metadata.keywords,
            f.metadata.keywordBuckets,
            rule,
            settings
          );
          return {
            ...f,
            metadata: {
              ...f.metadata,
              title: newTitle,
              scores: updatedScores
            }
          };
        }
        return f;
      })
    );
  };

  const handleUpdateDescription = (fileId: string, newDesc: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId && f.metadata) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              description: newDesc
            }
          };
        }
        return f;
      })
    );
  };

  const handleAddKeyword = (fileId: string, newKw: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId && f.metadata) {
          if (f.metadata.keywords.includes(newKw)) return f;
          const updatedKw = [...f.metadata.keywords, newKw];
          const updatedBuckets = [
            ...f.metadata.keywordBuckets,
            { tag: newKw, category: 'attribute' as const, weight: 50 }
          ];
          const rule = MARKETPLACE_REGISTRY[settings.targetPlatform] || MARKETPLACE_REGISTRY.general;
          const updatedScores = calculateSEOAndQualityScores(
            f.metadata.title,
            updatedKw,
            updatedBuckets,
            rule,
            settings
          );
          return {
            ...f,
            metadata: {
              ...f.metadata,
              keywords: updatedKw,
              keywordBuckets: updatedBuckets,
              scores: updatedScores
            }
          };
        }
        return f;
      })
    );
  };

  const handleRemoveKeyword = (fileId: string, kwToRemove: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId && f.metadata) {
          const updatedKw = f.metadata.keywords.filter(k => k !== kwToRemove);
          const updatedBuckets = f.metadata.keywordBuckets.filter(b => b.tag !== kwToRemove);
          const rule = MARKETPLACE_REGISTRY[settings.targetPlatform] || MARKETPLACE_REGISTRY.general;
          const updatedScores = calculateSEOAndQualityScores(
            f.metadata.title,
            updatedKw,
            updatedBuckets,
            rule,
            settings
          );
          return {
            ...f,
            metadata: {
              ...f.metadata,
              keywords: updatedKw,
              keywordBuckets: updatedBuckets,
              scores: updatedScores
            }
          };
        }
        return f;
      })
    );
  };

  const handleUpdateCategory = (fileId: string, primary: string, secondary: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === fileId && f.metadata) {
          return {
            ...f,
            metadata: {
              ...f.metadata,
              primaryCategory: primary,
              secondaryCategory: secondary
            }
          };
        }
        return f;
      })
    );
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const completedMetas = files.filter(f => f.metadata).map(f => f.metadata!);
    if (completedMetas.length === 0) return;

    const csvContent = generateMarketplaceCSV(completedMetas, settings.targetPlatform);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockAI_${settings.targetPlatform}_Metadata_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectPlan = (planName: string, newCredits: number, durationDays: number, price: number) => {
    const now = new Date();
    const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    updateSubscription({
      planId: durationDays === 180 ? 'plan_6m' : 'plan_1m',
      planName,
      price,
      durationDays,
      activatedAt: now.toISOString(),
      expiresAt: expiry.toISOString(),
      isActive: true,
      isExpired: false,
      deviceId
    });

    setCredits({
      planName,
      creditsRemaining: newCredits,
      creditsMax: newCredits,
      isPaid: true
    });
  };

  const activeProviderName = PROVIDER_REGISTRY[selectedProvider]?.name || 'Google Gemini';
  const activeModelName = providerModels[selectedProvider] || 'gemini-3.6-flash';

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0c0c0e] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-[#0c0c0e] flex items-center justify-center">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
          hideClose={true}
        />
      </div>
    );
  }

  if (routePath === '/admin') {
    return (
      <AdminPanel
        currentUser={currentUser}
        subscription={subscription}
        onUpdateSubscription={updateSubscription}
        onExitAdmin={() => {
          window.history.pushState({}, '', '/');
          setRoutePath('/');
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen flex bg-[#0c0c0e] text-zinc-200 font-sans ${theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light'}`}>
      {/* Left Sidebar */}
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        currentUser={currentUser}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Controls Bar */}
        <TopControlsBar
          currentProvider={activeProviderName}
          currentModel={activeModelName}
          onOpenApiKeys={() => setIsApiKeysOpen(true)}
          activeSubTab={activeSubTab}
          setActiveSubTab={setActiveSubTab}
        />

        {/* View Switcher */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'generator' && (
            <>
              {/* Left Settings Panel (Collapsible) */}
              {activeSubTab === 'metadata' && (
                <MetadataSettingsPanel
                  settings={settings}
                  setSettings={setSettings}
                />
              )}

              {/* Central Workspace */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {activeSubTab === 'metadata' ? (
                  <>
                    <UploadZone
                      files={files}
                      onUpload={handleUpload}
                      onRemoveFile={handleRemoveFile}
                      onClearAll={handleClearAll}
                      onGenerateAll={handleGenerateAll}
                      onExportCSV={handleExportCSV}
                      isGenerating={isGenerating}
                      onOpenPricing={() => setIsPricingOpen(true)}
                      onOpenApiKeys={() => setIsApiKeysOpen(true)}
                      hasCreditsOrKey={true}
                    />

                    <ResultsWorkspace
                      files={files}
                      onUpdateTitle={handleUpdateTitle}
                      onUpdateDescription={handleUpdateDescription}
                      onAddKeyword={handleAddKeyword}
                      onRemoveKeyword={handleRemoveKeyword}
                      onUpdateCategory={handleUpdateCategory}
                      targetMarketplace={settings.targetPlatform}
                      onOpenZoom={(url, title) => setZoomModal({ isOpen: true, url, title })}
                    />
                  </>
                ) : (
                  <PromptGeneratorView customApiKey={providerKeys[selectedProvider] || ''} />
                )}
              </div>
            </>
          )}

          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-6">
              <AllToolsView />
            </div>
          )}

          {activeTab === 'how-to-use' && (
            <div className="flex-1 overflow-y-auto p-6">
              <HowToUseView />
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                <button
                  onClick={() => setIsPricingOpen(true)}
                  className="px-6 py-3 bg-white text-black font-semibold rounded text-sm cursor-pointer hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  Open Plans & Pricing Selector
                </button>
              </div>
            </div>
          )}

          {activeTab === 'discord' && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                <span className="text-2xl">💬</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Join the StockAI Contributor Community</h2>
              <p className="text-xs text-zinc-400 max-w-md">
                Connect with professional stock photographers, vector illustrators, and video artists to share keywording tips and agency sales trends.
              </p>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 font-semibold text-xs rounded transition-colors inline-block"
              >
                Join StockAI Discord
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSelectPlan={handleSelectPlan}
      />

      <ApiKeysModal
        isOpen={isApiKeysOpen}
        onClose={() => setIsApiKeysOpen(false)}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        providerKeys={providerKeys}
        setProviderKey={setProviderKey}
        providerModels={providerModels}
        setProviderModel={setProviderModel}
      />

      <ZoomModal
        isOpen={zoomModal.isOpen}
        onClose={() => setZoomModal({ ...zoomModal, isOpen: false })}
        imageUrl={zoomModal.url}
        title={zoomModal.title}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <LockedExperienceModal
        isOpen={isLockedExperienceOpen}
        userEmail={currentUser?.email || 'contributor@example.com'}
        onOpenPlans={() => {
          setIsLockedExperienceOpen(false);
          setIsPricingOpen(true);
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

