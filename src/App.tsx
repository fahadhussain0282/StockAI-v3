import React, { useState, useEffect, useCallback } from 'react';
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
import { DiagnosticTraceModal } from './components/DiagnosticTraceModal';
import { ApiKeyWizard } from './components/ApiKeyWizard';

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
import { PROVIDER_MAP } from './registries/providers';
import { generateMarketplaceCSV } from './services/csvnest/exporter';
import { calculateSEOAndQualityScores } from './services/csvnest/scoring';
import { encryptData, decryptData } from './utils/crypto';

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
  const [authInitError, setAuthInitError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('stockai_auth_token') || '');
  const [isApiKeyWizardOpen, setIsApiKeyWizardOpen] = useState(false);
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

  // Fetch Current Auth User on Startup — Session Persistence
  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null);
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    const TIMEOUT_MS = 8000; // 8s timeout to prevent infinite loading

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Device-Id': deviceId
      },
      signal: controller.signal
    })
    .then(res => {
      if (!res.ok) throw new Error(`Session invalidated (${res.status})`);
      return res.json();
    })
    .then(data => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      if (data.user) {
        setCurrentUser(data.user);
        setSubscription(data.user.subscription);
        setAuthInitError(null);
        // Defer admin redirect until after initialization is complete
        if (data.user.role === 'admin' && window.location.pathname === '/') {
          setTimeout(() => {
            window.history.replaceState({}, '', '/admin');
            setRoutePath('/admin');
          }, 0);
        }
      }
      setIsInitializing(false);
    })
    .catch((err) => {
      if (cancelled) return;
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      if (isTimeout) {
        // Network timeout — do NOT clear the token, allow retry
        console.warn('[StockAI] Session restore timed out. Allowing retry...');
        setAuthInitError('Connection timed out. Please check your connection and retry.');
        setIsInitializing(false);
        return;
      }
      // Genuine session invalidation — clear token
      setCurrentUser(null);
      setAuthToken('');
      localStorage.removeItem('stockai_auth_token');
      setAuthInitError(null);
      setIsInitializing(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [authToken, deviceId]);

  // Subscription State (Default: Inactive for new users)
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    const now = new Date();
    return {
      planId: 'plan_1m',
      planName: '1 Month Plan',
      price: 300,
      durationDays: 30,
      activatedAt: now.toISOString(),
      expiresAt: now.toISOString(), // Expired by default
      isActive: false,
      isExpired: true,
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
    // Auto-redirect admins to the admin dashboard
    if (user.role === 'admin') {
      window.history.pushState({}, '', '/admin');
      setRoutePath('/admin');
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setCurrentUser(null);
      setAuthToken('');
      localStorage.removeItem('stockai_auth_token');
      setIsLockedExperienceOpen(false);
    }
  };

  // Modals & Admin Panel
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [zoomModal, setZoomModal] = useState({ isOpen: false, url: '', title: '' });
  const [traceModal, setTraceModal] = useState<{ isOpen: boolean; trace: any[]; fileName: string }>({ isOpen: false, trace: [], fileName: '' });

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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Provider & API Keys State (Isolated & Encrypted per user)
  const [selectedProvider, setSelectedProviderState] = useState<string>('google-gemini');
  const [providerKeys, setProviderKeysState] = useState<Record<string, string>>({ 'google-gemini': '', grok: '', groq: '' });
  const [providerModels, setProviderModelsState] = useState<Record<string, string>>({
    'google-gemini': PROVIDER_MAP['google-gemini']?.defaultModel || 'gemini-2.5-flash',
    xai: PROVIDER_MAP['xai']?.defaultModel || 'grok-2-vision-1212',
    groq: PROVIDER_MAP['groq']?.defaultModel || 'meta-llama/llama-4-maverick-17b-128e-instruct'
  });

  // Load and isolate state on login/logout
  useEffect(() => {
    if (currentUser) {
      const uid = currentUser.id;
      const savedProvider = localStorage.getItem(`stockai_provider_${uid}`);
      if (savedProvider) setSelectedProviderState(savedProvider);
      
      const loadKeys = async () => {
        try {
          const savedKeysEnc = localStorage.getItem(`stockai_provider_keys_${uid}`);
          if (savedKeysEnc) {
             const decryptedStr = await decryptData(savedKeysEnc);
             if (decryptedStr) {
               setProviderKeysState(JSON.parse(decryptedStr));
             }
          }
        } catch (e) {
          console.error("Failed to load user keys", e);
        }
      };
      loadKeys();
      
      try {
        const savedModelsStr = localStorage.getItem(`stockai_provider_models_${uid}`);
        if (savedModelsStr) {
           setProviderModelsState(JSON.parse(savedModelsStr));
        }
      } catch (e) {}
    } else {
      // Completely clear all user-specific state for a new session
      setSelectedProviderState('google-gemini');
      setProviderKeysState({ 'google-gemini': '', grok: '', groq: '' });
      setProviderModelsState({
        'google-gemini': PROVIDER_MAP['google-gemini']?.defaultModel || 'gemini-2.5-flash',
        xai: PROVIDER_MAP['xai']?.defaultModel || 'grok-2-vision-1212',
        groq: PROVIDER_MAP['groq']?.defaultModel || 'meta-llama/llama-4-maverick-17b-128e-instruct'
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

  const setProviderKey = async (provider: string, key: string) => {
    const updated = { ...providerKeys, [provider]: key };
    setProviderKeysState(updated);
    if (currentUser) {
      const encrypted = await encryptData(JSON.stringify(updated));
      localStorage.setItem(`stockai_provider_keys_${currentUser.id}`, encrypted);
    }
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
      
      // Convert to base64 (compress if image to bypass Vercel 4.5MB payload limit)
      let base64Data = '';
      if (fileType === 'image' && !file.type.includes('svg')) {
        base64Data = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 1024;
            let width = img.width;
            let height = img.height;
            if (width > height && width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8)); // compress to JPEG 80%
            } else {
              // Fallback if canvas context fails
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            }
          };
          img.onerror = () => {
            // Fallback on error
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          };
          img.src = previewUrl;
        });
      } else {
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

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

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  // Run StockAI Metadata Generation
  const handleGenerateAll = async () => {
    if (files.length === 0 || isGenerating) return;

    // ── Auth check — admin always passes, regular users need active subscription ──
    const isAdmin = currentUser?.role === 'admin';
    const hasActiveSub = currentUser?.subscription?.isActive && !currentUser?.subscription?.isExpired;
    if (!currentUser || (!isAdmin && !hasActiveSub)) {
      setIsLockedExperienceOpen(true);
      return;
    }

    setIsGenerating(true);

    const activeKey = providerKeys[selectedProvider] || '';
    const activeModel = providerModels[selectedProvider] || '';
    const REQUEST_TIMEOUT_MS = 60000; // 60s client-side timeout (server has 30s, but base64 upload can be slow)

    const filesToProcess = files.filter(f => !(f.status === 'completed' && f.metadata));

    for (const file of filesToProcess) {
      // Mark this file as generating
      setFiles(prev =>
        prev.map(f => f.id === file.id
          ? { ...f, status: 'generating', progressMessage: 'Vision analysis & StockAI scoring...' }
          : f)
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const requestBody = JSON.stringify({
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
        });

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'X-Device-Id': deviceId
        };

        let res = await fetch('/api/generate-metadata', {
          method: 'POST',
          headers,
          body: requestBody,
          signal: controller.signal
        });

        // Auto-retry once on 429 rate-limit with backoff
        if (!res.ok && res.status === 429) {
          console.warn('[StockAI] Rate limited — retrying in 2s...');
          await new Promise(r => setTimeout(r, 2000));
          res = await fetch('/api/generate-metadata', {
            method: 'POST',
            headers,
            body: requestBody,
            signal: controller.signal
          });
        }

        clearTimeout(timeoutId);

        if (!res.ok) {
          if (res.status === 401) {
            // Session expired — clear auth and show sign-in
            setCurrentUser(null);
            setAuthToken('');
            localStorage.removeItem('stockai_auth_token');
            setIsAuthModalOpen(true);
            // Mark remaining files as error
            setFiles(prev => prev.map(f =>
              f.status === 'generating' ? { ...f, status: 'error', error: 'Session expired. Please sign in again.' } : f
            ));
            break;
          }
          if (res.status === 403) {
            setIsLockedExperienceOpen(true);
            setFiles(prev => prev.map(f =>
              f.id === file.id ? { ...f, status: 'error', error: 'Subscription required to generate metadata.' } : f
            ));
            continue;
          }

          let errMsg = `Server error (${res.status})`;
          let errCode = '';
          let errTrace: any[] | undefined = undefined;
          try {
            const errJson = await res.json();
            errMsg = errJson?.error || errJson?.message || errMsg;
            errCode = errJson?.code || '';
            errTrace = errJson?.trace;
          } catch {}
          
          if (errCode === 'NO_FREE_PROVIDER_CONFIGURED') {
            setIsApiKeyWizardOpen(true);
            // Revert file to pending so it can resume
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'pending' } : f));
            break;
          }

          const errorObj = new Error(errMsg);
          if (errTrace) (errorObj as any).trace = errTrace;
          throw errorObj;
        }

        let metadata: MetadataResult;
        try {
          metadata = await res.json();
        } catch {
          throw new Error('Server returned an invalid response. Please try again.');
        }

        // Validate response has required fields
        if (!metadata || typeof metadata !== 'object') {
          throw new Error('Received empty metadata response from server.');
        }

        setFiles(prev =>
          prev.map(f => f.id === file.id ? { ...f, status: 'completed', metadata } : f)
        );

        setCredits(c => ({
          ...c,
          creditsRemaining: Math.max(0, c.creditsRemaining - 1)
        }));

      } catch (err: any) {
        clearTimeout(timeoutId);

        let errorMessage = 'Generation failed. Please try again.';
        let errTrace = err?.trace;
        if (err?.name === 'AbortError') {
          errorMessage = 'Request timed out after 60 seconds. The server is busy — please try again.';
        } else if (err?.message) {
          errorMessage = err.message;
        }

        console.error(`[StockAI] Generation error for "${file.name}":`, errorMessage);

        // GUARANTEED terminal state — file will NEVER remain stuck in "generating"
        setFiles(prev =>
          prev.map(f => f.id === file.id
            ? { ...f, status: 'error', error: errorMessage, trace: errTrace }
            : f)
        );
      }
    }


    // GUARANTEED — isGenerating always resets, even if an error occurs mid-loop
    // SAFETY NET: Force any file still in 'generating' or 'analyzing' state to 'error'
    // This prevents permanently stuck files if an exception bypassed the per-file catch.
    setFiles(prev => prev.map(f =>
      (f.status === 'generating' || f.status === 'analyzing')
        ? { ...f, status: 'error', error: 'Generation did not complete. Please try again.' }
        : f
    ));
    setIsGenerating(false);

  };

  // Live Metadata Editing Handlers
  const handleUpdateTitle = useCallback((fileId: string, newTitle: string) => {
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
  }, [settings]);

  const handleUpdateDescription = useCallback((fileId: string, newDesc: string) => {
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
  }, []);

  const handleAddKeyword = useCallback((fileId: string, newKw: string) => {
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
  }, [settings]);

  const handleRemoveKeyword = useCallback((fileId: string, kwToRemove: string) => {
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
  }, [settings]);

  const handleUpdateCategory = useCallback((fileId: string, primary: string, secondary: string) => {
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
  }, []);

  // Export CSV Handler
  const handleExportCSV = useCallback(() => {
    const isAdminUser = currentUser?.role === 'admin';
    const hasActive = currentUser?.subscription?.isActive && !currentUser?.subscription?.isExpired;
    if (!isAdminUser && (!hasActive)) {
      setIsLockedExperienceOpen(true);
      return;
    }
    const completedMetas = files.filter(f => f.metadata).map(f => f.metadata!);
    if (completedMetas.length === 0) return;

    const csvContent = generateMarketplaceCSV(completedMetas, settings.targetPlatform);
    // Prefix with BOM (\uFEFF) for strict Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StockAI_${settings.targetPlatform}_Metadata_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentUser, files, settings.targetPlatform]);

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

  const activeProviderName = PROVIDER_MAP[selectedProvider]?.name || 'Google Gemini';
  const activeModelName = providerModels[selectedProvider] || PROVIDER_MAP[selectedProvider]?.defaultModel || 'gemini-2.5-flash';

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0c0c0e] text-white flex-col gap-4">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm">Restoring session...</p>
        {authInitError && (
          <div className="mt-4 text-center">
            <p className="text-red-400 text-sm mb-3">{authInitError}</p>
            <button
              onClick={() => {
                setAuthInitError(null);
                setIsInitializing(true);
                // Re-trigger session restore
                setAuthToken(t => t);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
            >
              Retry Connection
            </button>
            <button
              onClick={() => {
                setCurrentUser(null);
                setAuthToken('');
                localStorage.removeItem('stockai_auth_token');
                setAuthInitError(null);
                setIsInitializing(false);
              }}
              className="ml-3 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
            >
              Sign In Again
            </button>
          </div>
        )}
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
    <div className={`min-h-screen flex bg-[#0c0c0e] text-zinc-200 font-sans`}>
      {/* Left Sidebar */}
      <LeftSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={credits}
        currentUser={currentUser}
        subscription={subscription}
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
                      hasCreditsOrKey={subscription.isActive && !subscription.isExpired || currentUser?.role === 'admin'}
                      onViewTrace={(trace) => {
                        const f = files.find(f => f.trace === trace);
                        setTraceModal({ isOpen: true, trace, fileName: f?.name || '' });
                      }}
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
                  <PromptGeneratorView 
                    customApiKey={providerKeys[selectedProvider] || ''}
                    onOpenLocked={() => setIsLockedExperienceOpen(true)}
                    isSubscriptionActive={subscription.isActive && !subscription.isExpired || currentUser?.role === 'admin'}
                    authToken={authToken}
                  />
                )}
              </div>
            </>
          )}

          {activeTab === 'tools' && (
            <div className="flex-1 overflow-y-auto p-6">
              <AllToolsView 
                isSubscriptionActive={subscription.isActive && !subscription.isExpired || currentUser?.role === 'admin'}
                onOpenLocked={() => setIsLockedExperienceOpen(true)}
              />
            </div>
          )}

          {activeTab === 'how-to-use' && (
            <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
              <HowToUseView />
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
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
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
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

      <DiagnosticTraceModal
        isOpen={traceModal.isOpen}
        onClose={() => setTraceModal({ ...traceModal, isOpen: false })}
        trace={traceModal.trace}
        fileName={traceModal.fileName}
      />

      <ApiKeyWizard
        isOpen={isApiKeyWizardOpen}
        onClose={() => setIsApiKeyWizardOpen(false)}
        authToken={authToken}
        onSuccess={() => {
          setIsApiKeyWizardOpen(false);
          handleGenerateAll();
        }}
      />
    </div>
  );
}
