import React, { useState, useEffect } from 'react';
import { Plus, Copy, RefreshCcw, Trash, Download, DollarSign, Users, CreditCard, Tag, Lock, Save, User } from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui/Primitives';
import { db } from '../services/db';
import { AuthKey } from '../types';

export const Admin: React.FC = () => {
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [duration, setDuration] = useState<'weekly'|'monthly'|'yearly'>('monthly');
  const [prices, setPrices] = useState({
    weekly: 50000,
    monthly: 150000,
    yearly: 1500000
  });
  const [customPrice, setCustomPrice] = useState<number>(150000);
  
  const [adminUsername, setAdminUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const k = await db.getKeys();
    setKeys(k);
    const creds = await db.getAdminCredentials();
    if (creds) {
        setAdminUsername(creds.username);
    }
  };

  useEffect(() => {
    setCustomPrice(prices[duration]);
  }, [duration, prices]);

  const generateKey = async () => {
    const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKeyStr = `KSR-${randomPart()}-${randomPart()}-${randomPart()}`;
    
    const validUntil = new Date();
    if (duration === 'weekly') validUntil.setDate(validUntil.getDate() + 7);
    if (duration === 'monthly') validUntil.setMonth(validUntil.getMonth() + 1);
    if (duration === 'yearly') validUntil.setFullYear(validUntil.getFullYear() + 1);

    const newKey: AuthKey = {
      id: Math.random().toString(36),
      key: newKeyStr,
      valid_until: validUntil.toISOString(),
      duration: duration,
      price: customPrice,
      created_at: new Date().toISOString(),
      is_active: true,
      usage_count: 0,
      deviceId: null
    };

    await db.addKey(newKey);
    await loadData();
    
    navigator.clipboard.writeText(newKeyStr);
    alert(`Generated & Copied: ${newKeyStr}`);
  };

  const handleRevoke = async (id: string) => {
    if (confirm('Revoke this key? Access will be denied immediately.')) {
      await db.revokeKey(id);
      await loadData();
    }
  };
  
  const handleUpdateCreds = async () => {
    if(!adminUsername || !newPassword) {
        alert("Username and new password cannot be empty");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }
    await db.updateAdminCredentials(adminUsername, newPassword);
    setNewPassword('');
    setConfirmPassword('');
    alert("Admin credentials updated successfully.");
  };

  const totalRevenue = keys.reduce((acc, k) => acc + (k.price || 0), 0);
  const activeKeys = keys.filter(k => k.is_active).length;

  return (
    <div className="p-6 space-y-8 pb-24 max-w-7xl mx-auto">
      <header>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">SaaS Administration</h1>
           <p className="text-slate-400 text-sm mt-1">LuminaPOS License Management System</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-500/5 border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Revenue</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Rp {totalRevenue.toLocaleString()}</h2>
            <p className="text-xs text-emerald-500/60 mt-2 font-mono">LIFETIME SALES</p>
        </Card>

        <Card className="p-6 bg-blue-500/5 border-blue-500/20">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Clients</span>
            </div>
            <h2 className="text-3xl font-bold text-white">{activeKeys}</h2>
            <p className="text-xs text-blue-500/60 mt-2 font-mono">ACTIVE LICENSE KEYS</p>
        </Card>

        <Card className="p-6 bg-purple-500/5 border-purple-500/20">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Tag className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Default Pricing</span>
            </div>
            <div className="space-y-1 mt-1">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Monthly</span>
                    <span className="font-mono text-purple-300">Rp {prices.monthly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Yearly</span>
                    <span className="font-mono text-purple-300">Rp {prices.yearly.toLocaleString()}</span>
                </div>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generator */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20 bg-gradient-to-b from-surface to-background relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Generate License
                </h3>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Duration Plan</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['weekly', 'monthly', 'yearly'].map((d) => (
                                <button
                                key={d}
                                onClick={() => setDuration(d as any)}
                                className={`py-2 px-1 text-xs font-medium rounded-lg capitalize transition-all border ${duration === d ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface border-white/5 text-slate-400 hover:border-white/10'}`}
                                >
                                {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Sale Price (Rp)</label>
                        <Input 
                            type="number" 
                            value={customPrice} 
                            onChange={(e) => setCustomPrice(Number(e.target.value))}
                            icon={<DollarSign className="w-4 h-4" />}
                        />
                        <p className="text-[10px] text-slate-500">Edit this to give discounts or custom pricing.</p>
                    </div>

                    <Button onClick={generateKey} className="w-full h-12 text-base shadow-xl shadow-primary/10">
                        <Plus className="w-4 h-4 mr-2" /> Generate & Sell Key
                    </Button>
                </div>
            </Card>

            <Card>
                <h3 className="text-sm font-bold mb-4 text-slate-300">Update Base Pricing</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-16 text-slate-400">Monthly</span>
                        <Input 
                            type="number" 
                            value={prices.monthly} 
                            onChange={(e) => setPrices({...prices, monthly: Number(e.target.value)})} 
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-16 text-slate-400">Yearly</span>
                        <Input 
                            type="number" 
                            value={prices.yearly} 
                            onChange={(e) => setPrices({...prices, yearly: Number(e.target.value)})} 
                            className="h-8 text-xs"
                        />
                    </div>
                </div>
            </Card>

            {/* Admin Credentials Update */}
            <Card className="border-red-500/20 bg-red-500/5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-red-400">
                    <Lock className="w-4 h-4" /> Admin Security
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-400">Admin Username</label>
                        <Input 
                            icon={<User className="w-3 h-3" />}
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400">New Password</label>
                        <Input 
                            type="password"
                            icon={<Lock className="w-3 h-3" />}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                     <div>
                        <label className="text-xs text-slate-400">Confirm New Password</label>
                        <Input 
                            type="password"
                            icon={<Lock className="w-3 h-3" />}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-9 text-xs"
                        />
                    </div>
                    <Button variant="danger" size="sm" className="w-full mt-2" onClick={handleUpdateCreds}>
                        <Save className="w-3 h-3 mr-2" /> Update Credentials
                    </Button>
                </div>
            </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-300">License History</h3>
                <Button onClick={() => alert("Exported to CSV")} variant="outline" size="sm" className="h-8">
                    <Download className="w-3 h-3 mr-2" /> Export CSV
                </Button>
            </div>
            
            <div className="grid gap-3">
            {keys.map(k => (
                <Card key={k.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-white/20 transition-all">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`font-mono text-base font-bold tracking-wider ${k.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{k.key}</span>
                        <Badge variant={k.is_active ? 'success' : 'default'} className="uppercase text-[10px]">{k.is_active ? 'Active' : 'Revoked'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                        <span><span className="text-slate-500">Plan:</span> <span className="text-slate-300 capitalize">{k.duration}</span></span>
                        <span><span className="text-slate-500">Price:</span> <span className="text-emerald-400 font-mono">Rp {k.price?.toLocaleString()}</span></span>
                        <span><span className="text-slate-500">Expires:</span> {new Date(k.valid_until).toLocaleDateString()}</span>
                        <span><span className="text-slate-500">Usage:</span> {k.usage_count}</span>
                        <span><span className="text-slate-500">Device ID:</span> <span className="font-mono text-[10px] bg-white/5 px-1 rounded">{k.deviceId ? k.deviceId.slice(0,6)+'...' : 'Unbound'}</span></span>
                    </div>
                </div>
                
                <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(k.key)} title="Copy Key">
                        <Copy className="w-4 h-4" />
                    </Button>
                    {k.is_active && (
                        <Button size="icon" variant="danger" onClick={() => handleRevoke(k.id)} title="Revoke License">
                            <Trash className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                </Card>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
};
