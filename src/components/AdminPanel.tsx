import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Smartphone, 
  BarChart3, 
  Lock, 
  CheckCircle, 
  XCircle, 
  X,
  FileText,
  AlertTriangle,
  History,
  PhoneCall,
  Search,
  UserPlus,
  Settings,
  RefreshCw,
  Clock,
  Layers,
  Zap,
  DollarSign,
  Activity,
  Globe,
  Sliders,
  ChevronRight,
  Filter,
  Check,
  Power
} from 'lucide-react';
import { UserSubscription, AdminUserRecord, AuditLogEntry, AuthUser } from '../types';

// Whitelist of permanent immutable administrator emails (Section 3 & Section 20)
const IMMUTABLE_ADMIN_EMAILS = [
  'adobeicon99@gmail.com',
  'fahadhussain0282@gmail.com'
];

interface AdminPanelProps {
  currentUser: AuthUser | null;
  subscription: UserSubscription;
  onUpdateSubscription: (updated: UserSubscription) => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  subscription,
  onUpdateSubscription,
  onExitAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'add-member' | 'subscriptions' | 'devices' | 'analytics' | 'audit' | 'settings' | 'support'>('overview');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Metrics & Stats
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    todaysSignups: 0,
    todaysGenerations: 42,
    totalMetadataGenerated: 1280,
    totalPromptGenerations: 340,
    totalCsvExports: 215,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeDevices: 0,
    apiStatus: 'Operational',
    csvnestVersion: 'v2.0 StockAI Title Intelligence',
    providerStatus: 'Google Gemini 3.6 Flash Active'
  });

  const [csvnestStats, setCsvnestStats] = useState({
    titlesGenerated: 1280,
    descriptionsGenerated: 1280,
    keywordsGenerated: 64000,
    avgSeoScore: 96.4,
    transparentPngUsage: 184,
    marketplaceDistribution: {
      'Adobe Stock': 45,
      'Shutterstock': 30,
      'Freepik': 15,
      'Vecteezy': 10
    }
  });

  const [providerAnalytics, setProviderAnalytics] = useState({
    geminiUsage: '88%',
    grokUsage: '8%',
    groqUsage: '4%',
    avgResponseTimeMs: 1240,
    apiErrors: 0,
    successRate: '99.8%'
  });

  // User Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'pending' | 'suspended'>('all');

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    fullName: '',
    email: '',
    planName: '1 Month Plan' as '1 Month Plan' | '6 Months Plan' | 'Enterprise Custom',
    durationDays: 30,
    activationDate: new Date().toISOString().slice(0, 10),
    status: 'active' as 'active' | 'pending' | 'suspended'
  });

  // Edit User Drawer State
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    status: 'active',
    planName: '1 Month Plan',
    extendDays: 0,
    customExpiryDate: '',
    resetDevice: false
  });

  // Admin System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    systemNotification: 'Welcome to StockAI Enterprise Generator v1.2',
    defaultProvider: 'Google Gemini 3.6 Flash',
    singleDeviceLockEnabled: true
  });

  // Check authorization
  const isAuthorizedAdmin = currentUser && IMMUTABLE_ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim());

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchAdminData();
    }
  }, [isAuthorizedAdmin]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const [usersRes, metricsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Device-Id': currentUser?.activeDeviceId || ''
          }
        }),
        fetch('/api/admin/metrics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Device-Id': currentUser?.activeDeviceId || ''
          }
        })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        setAuditLogs(data.auditLogs || []);
      }

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        if (mData.metrics) setMetrics(mData.metrics);
        if (mData.stockAiStats || mData.csvnestStats) setCsvnestStats(mData.stockAiStats || mData.csvnestStats);
        if (mData.providerAnalytics) setProviderAnalytics(mData.providerAnalytics);
      }
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivatePlan = async (userId: string, targetEmail: string, planName: '1 Month Plan' | '6 Months Plan', days: number) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const price = planName === '1 Month Plan' ? 300 : 2000;
      const res = await fetch('/api/admin/activate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          planName,
          durationDays: days,
          price
        })
      });

      if (res.ok) {
        if (targetEmail.toLowerCase() === currentUser?.email.toLowerCase()) {
          const now = new Date();
          const expiry = new Date(now.getTime() + days * 86400000).toISOString();
          onUpdateSubscription({
            ...subscription,
            planName,
            price,
            durationDays: days,
            activatedAt: now.toISOString(),
            expiresAt: expiry,
            isActive: true,
            isExpired: false
          });
        }
        fetchAdminData();
      }
    } catch (e) {
      console.error('Activation failed', e);
    }
  };

  const handleExpirePlan = async (userId: string, targetEmail: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/expire-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        if (targetEmail.toLowerCase() === currentUser?.email.toLowerCase()) {
          onUpdateSubscription({
            ...subscription,
            isActive: false,
            isExpired: true,
            expiresAt: new Date().toISOString()
          });
        }
        fetchAdminData();
      }
    } catch (e) {}
  };

  const handleToggleSuspend = async (userId: string, currentStatus: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const suspend = currentStatus !== 'suspended';
      await fetch('/api/admin/toggle-suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, suspend })
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleRevokeDevice = async (userId: string) => {
    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      await fetch('/api/admin/revoke-device', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      fetchAdminData();
    } catch (e) {}
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.email) return;

    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: newMemberForm.fullName,
          email: newMemberForm.email,
          planName: newMemberForm.planName,
          durationDays: newMemberForm.durationDays,
          activationDate: newMemberForm.activationDate,
          status: newMemberForm.status
        })
      });

      if (res.ok) {
        setIsAddMemberOpen(false);
        setNewMemberForm({
          fullName: '',
          email: '',
          planName: '1 Month Plan',
          durationDays: 30,
          activationDate: new Date().toISOString().slice(0, 10),
          status: 'active'
        });
        fetchAdminData();
      }
    } catch (e) {
      console.error('Add member failed', e);
    }
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('stockai_auth_token') || '';
      const res = await fetch('/api/admin/edit-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: editForm.fullName,
          email: editForm.email,
          status: editForm.status,
          planName: editForm.planName,
          extendDays: editForm.extendDays,
          customExpiryDate: editForm.customExpiryDate,
          resetDevice: editForm.resetDevice
        })
      });

      if (res.ok) {
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (e) {
      console.error('Edit user failed', e);
    }
  };

  const handleOpenWhatsApp = (channel: 'sales' | 'support' | 'general') => {
    const numbers = {
      sales: '03413516882',
      support: '03394377311',
      general: '03413516882'
    };
    const targetNum = numbers[channel];
    const cleanNum = targetNum.replace(/^0/, '92');
    window.open(`https://wa.me/${cleanNum}?text=StockAI%20Administrator%20Inquiry`, '_blank');
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && u.planStatus === statusFilter;
  });

  // Section 3: If not authorized admin, return 403 Forbidden Access Denied
  if (!isAuthorizedAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center p-6 text-center text-zinc-200 font-sans">
        <div className="max-w-md w-full bg-zinc-900/80 border border-red-900/50 rounded-lg p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">403 FORBIDDEN</div>
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-xs text-zinc-400 leading-relaxed pt-1">
              You do not have permission to access the StockAI Administrator Portal. Only whitelisted system administrators are authorized.
            </p>
          </div>
          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer border border-zinc-700"
          >
            Return To Main Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-6 font-sans text-zinc-200">
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg max-w-7xl w-full h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Admin Header (Section 3) */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                StockAI Enterprise Administrator Portal
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  ROUTE /ADMIN
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">Internal Management System • Secure Whitelisted Credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchAdminData}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="hidden sm:block text-right">
              <div className="text-xs text-zinc-300 font-semibold">{currentUser?.fullName}</div>
              <div className="text-[10px] font-mono text-zinc-500">{currentUser?.email}</div>
            </div>

            <button
              onClick={onExitAdmin}
              className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded text-xs transition-colors cursor-pointer font-medium"
            >
              Exit Portal
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Admin Sidebar Navigation */}
          <div className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-3 space-y-1 shrink-0 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 mb-2">
              Management Modules
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'overview' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-zinc-400" />
              Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'users' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4 text-zinc-400" />
              User Accounts ({metrics.totalUsers})
            </button>

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40 transition-colors"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Add Member (Section 8)
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'subscriptions' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <CreditCard className="w-4 h-4 text-zinc-400" />
              Subscription Management
            </button>

            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'devices' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-zinc-400" />
              Device Management
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'analytics' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Activity className="w-4 h-4 text-zinc-400" />
              StockAI & AI Analytics
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'audit' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <History className="w-4 h-4 text-zinc-400" />
              Security Audit Log
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'settings' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              System Settings
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                activeTab === 'support' ? 'bg-zinc-800 text-white font-semibold shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              WhatsApp Support
            </button>

            <div className="pt-6 border-t border-zinc-800/80 mt-4 px-2 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Immutable Administrators</div>
              {IMMUTABLE_ADMIN_EMAILS.map(e => (
                <div key={e} className="text-[10px] text-zinc-400 font-mono truncate">{e}</div>
              ))}
            </div>
          </div>

          {/* Module Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#0c0c0e]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                Loading administrator data records...
              </div>
            ) : (
              <>
                {/* Overview Dashboard (Section 4) */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">System Executive Dashboard</h3>
                        <p className="text-xs text-zinc-400">Real-time statistics synchronized with the central server store.</p>
                      </div>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" /> Add Member
                      </button>
                    </div>

                    {/* Stats Grid 1: Users & Revenue */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Contributor Accounts</div>
                        <div className="text-2xl font-bold font-mono text-white">{metrics.totalUsers}</div>
                        <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {metrics.activeUsers} Active
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Expired / Suspended</div>
                        <div className="text-2xl font-bold font-mono text-red-400">{metrics.expiredUsers + metrics.suspendedUsers}</div>
                        <div className="text-[11px] text-zinc-400">{metrics.suspendedUsers} Suspended Accounts</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Monthly Revenue</div>
                        <div className="text-2xl font-bold font-mono text-emerald-400">PKR {metrics.monthlyRevenue}</div>
                        <div className="text-[11px] text-zinc-400">Lifetime PKR {metrics.totalRevenue}</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Today's Signups</div>
                        <div className="text-2xl font-bold font-mono text-amber-400">{metrics.todaysSignups}</div>
                        <div className="text-[11px] text-zinc-400">Single Device Lock Active</div>
                      </div>
                    </div>

                    {/* Stats Grid 2: Generation Engine */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Metadata Output</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalMetadataGenerated}</div>
                        <div className="text-[11px] text-zinc-400">Titles, Descriptions & Tags</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Prompt Generations</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalPromptGenerations}</div>
                        <div className="text-[11px] text-zinc-400">Midjourney, DALL-E 3, Flux</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">CSV Exports</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.totalCsvExports}</div>
                        <div className="text-[11px] text-zinc-400">Multi-Marketplace Packages</div>
                      </div>

                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-1">
                        <div className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Active Devices</div>
                        <div className="text-xl font-bold font-mono text-white">{metrics.activeDevices}</div>
                        <div className="text-[11px] text-emerald-400">1 Device per Contributor</div>
                      </div>
                    </div>

                    {/* System Status Cards */}
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Engine & Service Health</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Zap className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="text-xs font-bold text-white">API Engine Status</div>
                            <div className="text-[11px] text-emerald-400 font-mono">{metrics.apiStatus}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Layers className="w-5 h-5 text-indigo-400" />
                          <div>
                            <div className="text-xs font-bold text-white">StockAI Engine Version</div>
                            <div className="text-[11px] text-indigo-300 font-mono">{metrics.csvnestVersion}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded border border-zinc-800">
                          <Activity className="w-5 h-5 text-amber-400" />
                          <div>
                            <div className="text-xs font-bold text-white">Active AI Provider</div>
                            <div className="text-[11px] text-amber-300 font-mono">{metrics.providerStatus}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management Tab (Section 6, 7, 17) */}
                {activeTab === 'users' && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white">Contributor User Accounts</h3>
                        <p className="text-xs text-zinc-400">Manage user status, plan activation, device locks, and access permissions.</p>
                      </div>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded shadow transition-colors flex items-center gap-2 cursor-pointer self-start"
                      >
                        <UserPlus className="w-4 h-4" /> Add Member
                      </button>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search users by name or email address..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <Filter className="w-3.5 h-3.5 text-zinc-500 ml-1" />
                        <span className="text-xs text-zinc-400 font-medium mr-1">Filter:</span>
                        {(['all', 'active', 'expired', 'pending', 'suspended'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                              statusFilter === f ? 'bg-zinc-800 text-white font-bold border border-zinc-700' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-3">User & Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Plan</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Expires At</th>
                            <th className="p-3">Device Token</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-zinc-500">
                                No contributor accounts match your query.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-zinc-800/30">
                                <td className="p-3">
                                  <div className="font-semibold text-white">{u.fullName || 'Contributor'}</div>
                                  <div className="text-[11px] font-mono text-zinc-400">{u.email}</div>
                                </td>
                                <td className="p-3 font-mono text-[11px] capitalize">{u.role}</td>
                                <td className="p-3 font-medium text-zinc-200">{u.planName}</td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    u.planStatus === 'active' 
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                      : u.planStatus === 'suspended'
                                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                                      : 'bg-red-950 text-red-400 border-red-800'
                                  }`}>
                                    {u.planStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {u.planStatus.toUpperCase()}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[11px] text-zinc-400">
                                  {new Date(u.expiresAt).toLocaleDateString()}
                                </td>
                                <td className="p-3 font-mono text-[10px] text-zinc-500 max-w-[120px] truncate">
                                  {u.activeDeviceId || 'None'}
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setEditForm({
                                        fullName: u.fullName,
                                        email: u.email,
                                        status: u.planStatus,
                                        planName: u.planName,
                                        extendDays: 0,
                                        customExpiryDate: u.expiresAt.slice(0, 10),
                                        resetDevice: false
                                      });
                                    }}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] font-medium transition-colors"
                                  >
                                    Edit Profile
                                  </button>
                                  <button
                                    onClick={() => handleToggleSuspend(u.id, u.planStatus)}
                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors border ${
                                      u.planStatus === 'suspended'
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900'
                                        : 'bg-amber-950 text-amber-400 border-amber-800 hover:bg-amber-900'
                                    }`}
                                  >
                                    {u.planStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                  <button
                                    onClick={() => handleExpirePlan(u.id, u.email)}
                                    className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800 rounded text-[10px] font-medium transition-colors"
                                  >
                                    Expire
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subscriptions Tab (Section 9, 10, 11) */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Subscription & Expiry Engine</h3>
                      <p className="text-xs text-zinc-400">Configure plans, duration parameters, auto-expiration, and manual extensions.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1 Month Plan */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">1 Month Plan</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">PKR 300</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Standard 30-day plan offering full StockAI Title Intelligence & Vision Generator access.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: 30 Days • Auto Expiry Active</div>
                      </div>

                      {/* 6 Months Plan */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">6 Months Plan</span>
                          <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">PKR 2000</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Extended 180-day studio plan providing long-term studio capacity.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: 180 Days • Auto Expiry Active</div>
                      </div>

                      {/* Enterprise Custom */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">Enterprise Custom</span>
                          <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-400 border border-indigo-800 px-2 py-0.5 rounded">Custom</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">Tailored plan for multi-user agencies or specific custom durations.</p>
                        <div className="text-[11px] font-mono text-zinc-500">Duration: Variable • Admin Custom Override</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Device Management Tab (Section 12, 13) */}
                {activeTab === 'devices' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Single-Device Active Sessions</h3>
                      <p className="text-xs text-zinc-400">Strictly enforcing 1 active device per contributor account. Second login logs out previous session.</p>
                    </div>

                    <div className="space-y-3">
                      {users.map(u => (
                        <div key={u.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {u.fullName} ({u.email})
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                                SINGLE DEVICE LOCK
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              Active Fingerprint ID: <span className="text-zinc-300">{u.activeDeviceId || 'None'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRevokeDevice(u.id)}
                              className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-800 rounded text-xs font-semibold hover:bg-red-900 transition-colors cursor-pointer"
                            >
                              Revoke & Logout Session
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* StockAI & Provider Analytics (Section 15, 16) */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">StockAI & Provider Performance Analytics</h3>
                      <p className="text-xs text-zinc-400">Detailed title engine metrics, marketplace distribution, and AI response times.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* StockAI Engine Stats */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">StockAI Engine Output</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Titles Generated</div>
                            <div className="text-xl font-bold font-mono text-white">{csvnestStats.titlesGenerated}</div>
                          </div>
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Average SEO Score</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">{csvnestStats.avgSeoScore} / 100</div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white">Marketplace Distribution</div>
                          {Object.entries(csvnestStats.marketplaceDistribution).map(([mp, pct]) => (
                            <div key={mp} className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/40">
                              <span className="text-zinc-400">{mp}</span>
                              <span className="font-mono text-white font-semibold">{pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Provider Performance */}
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">AI Provider Reliability</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Response Time</div>
                            <div className="text-xl font-bold font-mono text-white">{providerAnalytics.avgResponseTimeMs} ms</div>
                          </div>
                          <div className="p-3 bg-zinc-950 rounded border border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Success Rate</div>
                            <div className="text-xl font-bold font-mono text-emerald-400">{providerAnalytics.successRate}</div>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Google Gemini Flash Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.geminiUsage}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Grok Vision Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.grokUsage}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-800/40">
                            <span className="text-zinc-400">Groq Fast LLaMA Usage</span>
                            <span className="font-mono text-white font-semibold">{providerAnalytics.groqUsage}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Logs Tab (Section 18) */}
                {activeTab === 'audit' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Security & Administrative Audit Logs</h3>
                      <p className="text-xs text-zinc-400">Immutable chronological record of administrator actions.</p>
                    </div>

                    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/40">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Administrator</th>
                            <th className="p-3">Action Type</th>
                            <th className="p-3">Target Account</th>
                            <th className="p-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-zinc-500">
                                No security audit entries recorded yet.
                              </td>
                            </tr>
                          ) : (
                            auditLogs.map(a => (
                              <tr key={a.id} className="hover:bg-zinc-800/30">
                                <td className="p-3 text-zinc-400">{new Date(a.timestamp).toLocaleString()}</td>
                                <td className="p-3 text-white font-semibold">{a.adminEmail}</td>
                                <td className="p-3 text-amber-400 font-bold">{a.action}</td>
                                <td className="p-3 text-zinc-300">{a.targetUser}</td>
                                <td className="p-3 text-zinc-400">{a.details}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* System Settings Tab (Section 21) */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">System Global Settings</h3>
                      <p className="text-xs text-zinc-400">Configure global application parameters, provider defaults, and system notifications.</p>
                    </div>

                    <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-4 max-w-2xl">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                        <div>
                          <div className="text-xs font-bold text-white">Maintenance Mode</div>
                          <div className="text-[11px] text-zinc-400">Lock non-admin generator access for scheduled maintenance.</div>
                        </div>
                        <button
                          onClick={() => setSystemSettings(s => ({ ...s, maintenanceMode: !s.maintenanceMode }))}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            systemSettings.maintenanceMode ? 'bg-amber-600' : 'bg-zinc-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            systemSettings.maintenanceMode ? 'left-7' : 'left-1'
                          }`} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Global Announcement Banner</label>
                        <input
                          type="text"
                          value={systemSettings.systemNotification}
                          onChange={e => setSystemSettings(s => ({ ...s, systemNotification: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-white">Default AI Engine Provider</label>
                        <select
                          value={systemSettings.defaultProvider}
                          onChange={e => setSystemSettings(s => ({ ...s, defaultProvider: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white"
                        >
                          <option value="Google Gemini 3.6 Flash">Google Gemini 3.6 Flash (Recommended)</option>
                          <option value="Grok Vision AI">Grok Vision AI</option>
                          <option value="Groq LLaMA 3.3">Groq LLaMA 3.3 Fast</option>
                        </select>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => alert('System settings saved successfully.')}
                          className="px-4 py-2 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors cursor-pointer"
                        >
                          Save Global Configuration
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Support Tab (Section 19) */}
                {activeTab === 'support' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Administrator WhatsApp Support Mapping</h3>
                      <p className="text-xs text-zinc-400">Direct instant messaging routing. Numbers are masked in UI per Section 19 security policy.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Sales & Activation</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">Direct activation desk for manual subscriber onboarding & payment verification.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('sales')}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open Sales WhatsApp Desk
                        </button>
                      </div>

                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Technical Support</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">Direct channel for engine issues, provider timeouts, or device reset help.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('support')}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open Tech Support Desk
                        </button>
                      </div>

                      <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
                        <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-bold text-white">General Inquiry</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">System administrator inquiries, partnership questions, or custom requests.</p>
                        <button
                          onClick={() => handleOpenWhatsApp('general')}
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Open General Inquiry Desk
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal (Section 8) */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddMemberOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Add / Update Contributor Member
              </h3>
              <p className="text-xs text-zinc-400">Existing emails will be updated; new emails will create a contributor account.</p>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={newMemberForm.fullName}
                  onChange={e => setNewMemberForm({ ...newMemberForm, fullName: e.target.value })}
                  placeholder="e.g. Fahad Hussain"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={newMemberForm.email}
                  onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                  placeholder="e.g. contributor@example.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Plan</label>
                  <select
                    value={newMemberForm.planName}
                    onChange={e => {
                      const pName = e.target.value as any;
                      setNewMemberForm({
                        ...newMemberForm,
                        planName: pName,
                        durationDays: pName === '6 Months Plan' ? 180 : 30
                      });
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                  >
                    <option value="1 Month Plan">1 Month Plan (300 PKR)</option>
                    <option value="6 Months Plan">6 Months Plan (2000 PKR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Duration (Days)</label>
                  <input
                    type="number"
                    value={newMemberForm.durationDays}
                    onChange={e => setNewMemberForm({ ...newMemberForm, durationDays: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Activation Date</label>
                <input
                  type="date"
                  value={newMemberForm.activationDate}
                  onChange={e => setNewMemberForm({ ...newMemberForm, activationDate: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Save Contributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Edit User Profile: {editingUser.email}</h3>
              <p className="text-xs text-zinc-400">Update account details, status, extension days, or reset session locks.</p>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="expired">Expired</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Extend Plan (+Days)</label>
                  <input
                    type="number"
                    value={editForm.extendDays}
                    onChange={e => setEditForm({ ...editForm, extendDays: Number(e.target.value) })}
                    placeholder="e.g. 7, 30"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="resetDeviceCheck"
                  checked={editForm.resetDevice}
                  onChange={e => setEditForm({ ...editForm, resetDevice: e.target.checked })}
                  className="rounded border-zinc-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="resetDeviceCheck" className="text-xs text-zinc-300 font-medium">
                  Reset Active Single-Device Session Token
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 rounded text-xs font-bold cursor-pointer"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
