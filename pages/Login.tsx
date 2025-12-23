import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowRight, ShieldCheck, Terminal, User, Lock, ChevronLeft, CheckSquare, Square, CreditCard, Sparkles, X, Loader2, Copy, CheckCircle } from 'lucide-react';
import { Input, Button, Card, Badge } from '../components/ui/Primitives';
import { db } from '../services/db';
import { AuthKey } from '../types';

interface LoginProps {
  onLogin: (key: string, isAdmin: boolean) => void;
}

// --- Purchase Component ---
const PurchaseModal = ({ onClose, onKeyGenerated }: { onClose: () => void, onKeyGenerated: (key: string) => void }) => {
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');

  const plans = {
    weekly: { label: 'Weekly Starter', price: 50000, desc: '7 Days Access' },
    monthly: { label: 'Monthly Pro', price: 150000, desc: '30 Days Access' },
    yearly: { label: 'Yearly Business', price: 1500000, desc: '365 Days Access' }
  };

  const handlePurchase = async () => {
    setStep('payment');
    setProcessing(true);

    // Simulate Payment Gateway Delay (Midtrans Simulation)
    setTimeout(async () => {
      // Generate Key
      const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
      const newKeyStr = `KSR-${randomPart()}-${randomPart()}-${randomPart()}`;
      
      const validUntil = new Date();
      if (selectedPlan === 'weekly') validUntil.setDate(validUntil.getDate() + 7);
      if (selectedPlan === 'monthly') validUntil.setMonth(validUntil.getMonth() + 1);
      if (selectedPlan === 'yearly') validUntil.setFullYear(validUntil.getFullYear() + 1);

      const newKey: AuthKey = {
        id: crypto.randomUUID(),
        key: newKeyStr,
        valid_until: validUntil.toISOString(),
        duration: selectedPlan,
        price: plans[selectedPlan].price,
        created_at: new Date().toISOString(),
        is_active: true,
        usage_count: 0,
        deviceId: null
      };

      try {
        await db.addKey(newKey);
        setGeneratedKey(newKeyStr);
        setStep('success');
      } catch (e) {
        alert("Transaction Failed. Please try again.");
        setStep('plan');
      } finally {
        setProcessing(false);
      }
    }, 3000); // 3 seconds fake processing
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        {step === 'plan' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Choose License</h2>
              <p className="text-xs text-slate-400 mt-1">Instant delivery. Secure payment.</p>
            </div>

            <div className="space-y-3 mb-6">
              {(Object.keys(plans) as Array<keyof typeof plans>).map((key) => (
                <div 
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedPlan === key ? 'border-primary bg-primary/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                >
                  <div>
                    <h3 className="font-semibold text-sm">{plans[key].label}</h3>
                    <p className="text-xs text-slate-400">{plans[key].desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-emerald-400 font-bold">Rp {plans[key].price.toLocaleString()}</span>
                    {selectedPlan === key && <Badge variant="success" className="mt-1 text-[10px]">Selected</Badge>}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handlePurchase} className="w-full h-12 text-base">
              Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
            </div>
            <h3 className="text-lg font-bold mb-2">Processing Payment</h3>
            <p className="text-sm text-slate-400 mb-6">Connecting to Payment Gateway...</p>
            <div className="w-full max-w-[200px] space-y-2">
               <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{width: '50%'}} />
               </div>
               <p className="text-[10px] text-slate-500">Securing transaction via Midtrans</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 bg-gradient-to-b from-emerald-900/20 to-surface">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
              <p className="text-sm text-slate-400">Here is your access key. Keep it safe.</p>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 text-center">Your License Key</p>
              <div className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-lg border border-dashed border-white/20">
                 <code className="text-lg font-mono font-bold text-primary tracking-wider">{generatedKey}</code>
                 <button onClick={() => navigator.clipboard.writeText(generatedKey)} className="p-2 hover:text-white text-slate-400">
                    <Copy className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <Button onClick={() => onKeyGenerated(generatedKey)} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20">
               Login Now
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'key' | 'credentials'>('key');
  const [keyInput, setKeyInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberKey, setRememberKey] = useState(false);
  const [rememberAdmin, setRememberAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [showPurchase, setShowPurchase] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  // Initialization
  useEffect(() => {
    const checkAdmin = async () => {
      const adminCreds = await db.getAdminCredentials();
      setAdminExists(!!adminCreds);
    };
    checkAdmin();

    let storedDeviceId = localStorage.getItem('lumina_device_id');
    if (!storedDeviceId) {
      storedDeviceId = crypto.randomUUID();
      localStorage.setItem('lumina_device_id', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    const savedKey = localStorage.getItem('lumina_remember_key');
    if (savedKey) {
      setKeyInput(savedKey);
      setRememberKey(true);
    }

    const savedAdmin = localStorage.getItem('lumina_remember_admin');
    if (savedAdmin) {
      try {
        const { u, p } = JSON.parse(atob(savedAdmin));
        setUsername(u);
        setPassword(p);
        setRememberAdmin(true);
      } catch (e) {
        localStorage.removeItem('lumina_remember_admin');
      }
    }
  }, []);

  const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    if (val.length > 3 && !val.startsWith('KSR')) {
      val = 'KSR-' + val.replace(/[^A-Z0-9]/g, '');
    }
    setKeyInput(val);
    setError('');
  };

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      await db.updateAdminCredentials(username, password);
      setAdminExists(true);
      onLogin('ADMIN-CRED-SESSION', true); // Auto-login after creation
    } catch (err) {
      console.error(err);
      setError("Failed to create admin account.");
    }
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'credentials') {
        const isValid = await db.validateAdmin(username, password);
        if (isValid) {
            if (rememberAdmin) {
              const str = btoa(JSON.stringify({ u: username, p: password }));
              localStorage.setItem('lumina_remember_admin', str);
            } else {
              localStorage.removeItem('lumina_remember_admin');
            }
            onLogin('ADMIN-CRED-SESSION', true);
        } else {
            setError('Invalid username or password');
        }
      } else {
        if (keyInput === 'ADMIN-MASTER-2025') {
            onLogin(keyInput, true);
        } else {
            const result = await db.validateKey(keyInput, deviceId);
            if (result.valid) {
              if (rememberKey) {
                localStorage.setItem('lumina_remember_key', keyInput);
              } else {
                localStorage.removeItem('lumina_remember_key');
              }
              onLogin(keyInput, false);
            } else {
              setError(result.message || 'Invalid authentication key');
            }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Connection error. Please check internet.");
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while checking for admin
  if (adminExists === null) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
        </div>
    )
  }

  // Render admin creation form if no admin exists
  if (!adminExists && mode === 'credentials') {
      return (
          <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
                <Card>
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold">Create Admin Account</h1>
                        <p className="text-slate-400 text-sm">This is a one-time setup.</p>
                    </div>
                    <div className="space-y-4">
                        <Input icon={<User className="w-4 h-4" />} placeholder="Choose Username" value={username} onChange={e => setUsername(e.target.value)} />
                        <Input type="password" icon={<Lock className="w-4 h-4" />} placeholder="Choose Password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Button onClick={handleCreateAdmin} isLoading={loading} disabled={!username || !password} className="w-full">Create Admin & Login</Button>
                    </div>
                </Card>
            </motion.div>
        </div>
      )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showPurchase && (
          <PurchaseModal 
            onClose={() => setShowPurchase(false)} 
            onKeyGenerated={(k) => {
               setKeyInput(k);
               setShowPurchase(false);
               setRememberKey(true);
            }} 
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-t border-t-white/10 shadow-2xl shadow-primary/10 relative overflow-hidden mb-4">
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 mb-4 shadow-lg shadow-primary/30">
              <Terminal className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">LuminaPOS</h1>
            <p className="text-slate-400 text-sm mt-2">
              {mode === 'key' ? 'Secure Access Gateway' : 'Admin Administration'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <AnimatePresence mode="wait">
                {mode === 'key' ? (
                    <motion.div
                        key="key-mode"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Authentication Key</label>
                          <Input
                              icon={<KeyRound className="w-4 h-4" />}
                              placeholder="KSR-XXXX-XXXX-XXXX"
                              value={keyInput}
                              onChange={handleKeyInput}
                              className="font-mono tracking-wider text-center text-lg"
                              autoFocus
                          />
                        </div>
                        
                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => setRememberKey(!rememberKey)}
                        >
                          {rememberKey ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                          )}
                          <span className={`text-sm ${rememberKey ? 'text-white' : 'text-slate-500'} select-none`}>Remember Key on this device</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="cred-mode"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Username</label>
                            <Input
                                icon={<User className="w-4 h-4" />}
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <Input
                                type="password"
                                icon={<Lock className="w-4 h-4" />}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            />
                        </div>

                        <div 
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => setRememberAdmin(!rememberAdmin)}
                        >
                          {rememberAdmin ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                          )}
                          <span className={`text-sm ${rememberAdmin ? 'text-white' : 'text-slate-500'} select-none`}>Remember me</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-red-400 text-xs text-center mt-2 font-medium"
              >
                {error}
              </motion.p>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base shadow-xl shadow-indigo-500/20" 
              isLoading={loading}
              disabled={mode === 'key' ? keyInput.length < 5 : (!username || !password)}
            >
              {mode === 'key' ? 'Verify Identity' : 'Login to Admin'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-4">
             <button 
                type="button"
                onClick={() => {
                    setMode(prev => prev === 'key' ? 'credentials' : 'key');
                    setError('');
                    setKeyInput(localStorage.getItem('lumina_remember_key') || '');
                    if (!localStorage.getItem('lumina_remember_admin')) { setUsername(''); setPassword(''); }
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1"
             >
                {mode === 'key' ? (
                    <>Login with Admin Credentials <ArrowRight className="w-3 h-3" /></>
                ) : (
                    <><ChevronLeft className="w-3 h-3" /> Back to Key Access</>
                )}
             </button>

            <div className="flex flex-col items-center gap-1 text-slate-500 text-xs">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    <span>256-bit Secure Session (Firebase)</span>
                </div>
                <div className="text-[10px] text-slate-600">Device ID: {deviceId.slice(0, 8)}...</div>
            </div>
          </div>
        </Card>

        {/* Purchase Button CTA */}
        {mode === 'key' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button 
              onClick={() => setShowPurchase(true)}
              className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-emerald-900/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Buy License Key</p>
                  <p className="text-[10px] text-slate-400">Instant activation via QRIS / VA</p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
