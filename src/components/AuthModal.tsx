import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Authentication service is temporarily unavailable.');
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
    setSuccessMsg('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Authentication service is temporarily unavailable.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      setSuccessMsg('Google Authentication successful! Logging in...');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsLoading(false);
    }
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Authentication service is temporarily unavailable.');
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

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    setSuccessMsg('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans text-zinc-200">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="w-10 h-10 rounded-lg bg-white text-black font-bold flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">StockAI Authentication</h2>
          <p className="text-xs text-zinc-400">
            {mode === 'login' && 'Sign in to access your contributor workspace'}
            {mode === 'signup' && 'Create a new contributor account'}
            {mode === 'forgot' && 'Reset your account security credentials'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 bg-zinc-950 p-1 border border-zinc-800 rounded-md text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            className={`py-1.5 rounded transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
            className={`py-1.5 rounded transition-colors cursor-pointer ${
              mode === 'signup' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-900/80 rounded text-xs text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-900/80 rounded text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="contributor@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded bg-zinc-900 border-zinc-800 text-white focus:ring-0"
                />
                <span>Remember this device</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">1 Active Device Enforcement</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? 'Authenticating...' : 'Sign In To Workspace'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs">Or continue with</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication was unsuccessful or canceled.')}
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
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Fahad Hussain"
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="contributor@example.com"
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Confirm</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupConfirmPassword}
                  onChange={e => setSignupConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded bg-zinc-900 border-zinc-800 text-white focus:ring-0"
              />
              <label htmlFor="terms" className="text-[11px] text-zinc-400 leading-tight cursor-pointer">
                I accept the StockAI Terms of Service and Privacy Policy. Default role: <span className="text-white font-semibold">Contributor</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-black hover:bg-zinc-200 font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating Account...' : 'Register Contributor Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs">Or continue with</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Authentication was unsuccessful or canceled.')}
                theme="filled_black"
                shape="rectangular"
                width="100%"
                text="continue_with"
              />
            </div>
          </form>
        )}

        {/* Forgot Password */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-zinc-400">
              Enter your registered account email address. We will send a secure password reset link to your inbox.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Email Address</label>
              <input
                type="email"
                required
                placeholder="contributor@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-600"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-white text-black font-semibold text-xs rounded hover:bg-zinc-200 transition-colors"
            >
              Send Password Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
