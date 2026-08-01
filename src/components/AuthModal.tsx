import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
  hideClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  hideClose = false
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status & Errors
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail || !loginPassword) {
      setError('Please enter both email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const deviceId = localStorage.getItem('stockai_device_id') || '';
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          deviceFingerprint: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`
          }
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Server error (HTTP ${res.status}). Please try again in a moment.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }

      setSuccessMsg('Authentication successful! Logging in...');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setSuccessMsg('Authenticating...');
    setIsLoading(true);
    
    try {
      const deviceId = localStorage.getItem('stockai_device_id') || '';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential,
          deviceFingerprint: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`
          }
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Google auth server error (HTTP ${res.status}). Please try again.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      setSuccessMsg('Creating Session...');
      
      setTimeout(() => {
        setSuccessMsg('Loading Dashboard...');
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 500);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled.');
    setSuccessMsg('');
    setIsLoading(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!signupName.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setError('Valid Email Address is required.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the Terms of Service.');
      return;
    }

    setIsLoading(true);

    try {
      const deviceId = localStorage.getItem('stockai_device_id') || '';
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        body: JSON.stringify({
          fullName: signupName,
          email: signupEmail,
          password: signupPassword,
          confirmPassword: signupConfirmPassword,
          termsAccepted: acceptTerms
        })
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(`Signup server error (HTTP ${res.status}). Please try again in a moment.`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Account creation failed.');
      }

      setSuccessMsg('Account created successfully! Subscription pending activation.');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginEmail || !loginEmail.includes('@')) {
      setError('Please enter a valid email address to receive password reset instructions.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset.');
      }

      setSuccessMsg(data.message || 'Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 font-sans text-zinc-200 animate-fade-in">
      <div className="bg-[#0c0c0e]/95 border border-zinc-800/80 rounded-xl max-w-md w-full p-7 space-y-6 shadow-modal relative animate-scale-in">
        {/* Close */}
        {!hideClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-xl bg-white text-black font-bold flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">StockAI Workspace</h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            {mode === 'login' && 'Sign in to access your contributor workspace.'}
            {mode === 'signup' && 'Create a new contributor account.'}
            {mode === 'forgot' && 'Reset your account security credentials.'}
          </p>
        </div>

        {/* Mode Selector Tabs (Hidden in Forgot Password mode) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 bg-zinc-950 p-1 border border-zinc-800/60 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-md transition-all duration-200 cursor-pointer ${
                mode === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
              className={`py-2 rounded-md transition-all duration-200 cursor-pointer ${
                mode === 'signup' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-900/80 rounded-lg text-xs text-red-300 animate-fade-in-up">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-900/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-white" />
                <input
                  type="email"
                  required
                  placeholder="contributor@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-white" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer"
                />
                <span className="group-hover:text-zinc-300 transition-colors">Remember this device</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800/50">1 Device Only</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold text-sm rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-not-allowed' : 'shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Authenticating...
                </span>
              ) : (
                <>Sign In To Workspace <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            </div>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
              <div className="relative group">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-white" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Fahad Hussain"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-white" />
                <input
                  type="email"
                  required
                  placeholder="contributor@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
                <div className="relative group">
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3 transition-colors group-focus-within:text-white" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Confirm</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupConfirmPassword}
                  onChange={e => setSignupConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1 bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-800/50">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-zinc-400 leading-relaxed cursor-pointer select-none">
                I accept the <span className="text-zinc-300 hover:text-white transition-colors">Terms of Service</span> and <span className="text-zinc-300 hover:text-white transition-colors">Privacy Policy</span>. Account defaults to <span className="text-white font-semibold">Contributor</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold text-sm rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-not-allowed' : 'shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'}`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Creating Account...
                </span>
              ) : (
                <>Register Contributor Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Account Email</label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3 transition-colors group-focus-within:text-white" />
                <input
                  type="email"
                  required
                  placeholder="contributor@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 bg-white text-black hover:bg-zinc-200 font-bold text-sm rounded-lg transition-all duration-200 cursor-pointer ${isLoading ? 'opacity-80 cursor-not-allowed' : 'shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'}`}
              >
                {isLoading ? 'Sending...' : 'Send Password Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                className="w-full py-2.5 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
