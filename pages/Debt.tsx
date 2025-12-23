import React, { useState, useEffect } from 'react';
import { Plus, User, DollarSign, CheckCircle } from 'lucide-react';
import { Button, Input, Card, Badge } from '../components/ui/Primitives';
import { db } from '../services/db';
import { DebtRecord } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const Debt: React.FC = () => {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState<string | null>(null);
  const [newDebt, setNewDebt] = useState<Partial<DebtRecord>>({ customerName: '', amount: 0, description: '' });
  const [payAmount, setPayAmount] = useState(0);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    const data = await db.getDebts();
    setDebts(data);
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const record: DebtRecord = {
      id: Date.now().toString(),
      customerName: newDebt.customerName!,
      amount: Number(newDebt.amount),
      description: newDebt.description || 'General Debt',
      date: new Date().toISOString(),
      status: 'unpaid',
      payments: []
    };
    await db.addDebt(record);
    await loadDebts();
    setIsModalOpen(false);
    setNewDebt({ customerName: '', amount: 0, description: '' });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalOpen) return;
    
    const debt = debts.find(d => d.id === payModalOpen);
    if (!debt) return;

    const payment = Number(payAmount);
    if (payment <= 0) {
      // Show an error message or simply ignore the payment
      console.error("Payment amount must be positive");
      return;
    }
    const totalPaid = debt.payments.reduce((a, b) => a + b.amount, 0) + payment;
    
    const updatedDebt: DebtRecord = {
        ...debt,
        payments: [...debt.payments, { date: new Date().toISOString(), amount: payment }],
        status: totalPaid >= debt.amount ? 'paid' : 'partial'
    };

    await db.updateDebt(updatedDebt);
    await loadDebts();
    setPayModalOpen(null);
    setPayAmount(0);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 pb-24">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Debt Management</h1>
          <p className="text-slate-400 text-sm">Track customer debts (Kasbon)</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Debt
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {debts.length === 0 && <p className="text-slate-500 col-span-full text-center py-10">No active debts.</p>}
        {debts.map(debt => {
            const paid = debt.payments.reduce((a,b) => a + b.amount, 0);
            const remaining = debt.amount - paid;
            
            return (
                <Card key={debt.id} className="relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">{debt.customerName}</h3>
                                <p className="text-xs text-slate-400">{new Date(debt.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <Badge variant={debt.status === 'paid' ? 'success' : 'warning'}>{debt.status}</Badge>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total</span>
                            <span className="font-mono">Rp {debt.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Paid</span>
                            <span className="font-mono text-emerald-400">Rp {paid.toLocaleString()}</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{width: `${(paid/debt.amount)*100}%`}} />
                        </div>
                    </div>

                    {debt.status !== 'paid' && (
                        <Button variant="outline" className="w-full" onClick={() => setPayModalOpen(debt.id)}>
                            Pay / Cicil
                        </Button>
                    )}
                </Card>
            );
        })}
      </div>

      {/* New Debt Modal */}
      <AnimatePresence>
        {isModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="w-full max-w-md">
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Record New Debt</h3>
                        <form onSubmit={handleAddDebt} className="space-y-4">
                            <Input placeholder="Customer Name" value={newDebt.customerName} onChange={e => setNewDebt({...newDebt, customerName: e.target.value})} required />
                            <Input placeholder="Amount (Rp)" type="number" value={newDebt.amount} onChange={e => setNewDebt({...newDebt, amount: Number(e.target.value)})} required />
                            <Input placeholder="Note (Optional)" value={newDebt.description} onChange={e => setNewDebt({...newDebt, description: e.target.value})} />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Create Record</Button>
                            </div>
                        </form>
                    </Card>
                 </motion.div>
             </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {payModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="w-full max-w-md">
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Add Payment</h3>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <Input placeholder="Amount Paying (Rp)" type="number" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} required />
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setPayModalOpen(null)}>Cancel</Button>
                                <Button type="submit" variant="success">Process Payment</Button>
                            </div>
                        </form>
                    </Card>
                 </motion.div>
             </div>
        )}
      </AnimatePresence>
    </div>
  );
};
