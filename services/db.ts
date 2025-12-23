import { firestore } from './firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, 
  query, where, updateDoc, getDoc, limit 
} from 'firebase/firestore';
import { AuthKey, Product, Transaction, DebtRecord, FinancialRecord, ShopProfile } from '../types';

// --- INITIAL FALLBACK DATA (For Offline/Demo Mode) ---
const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Cosmic Latte', price: 45000, category: 'Coffee', stock: 100, image: 'https://picsum.photos/200/200?random=1' },
  { id: '2', name: 'Nebula Matcha', price: 48000, category: 'Tea', stock: 85, image: 'https://picsum.photos/200/200?random=2' },
  { id: '3', name: 'Quantum Croissant', price: 35000, category: 'Food', stock: 20, image: 'https://picsum.photos/200/200?random=3' },
  { id: '4', name: 'Void Brew (Cold)', price: 42000, category: 'Coffee', stock: 150, image: 'https://picsum.photos/200/200?random=4' },
  { id: '5', name: 'Solar Tea', price: 30000, category: 'Tea', stock: 50, image: 'https://picsum.photos/200/200?random=5' },
  { id: '6', name: 'Asteroid Cake', price: 55000, category: 'Food', stock: 12, image: 'https://picsum.photos/200/200?random=6' },
];

const INITIAL_KEYS: AuthKey[] = [
  {
    id: 'admin-seed',
    key: 'KSR-DEMO-2025-KEYS',
    valid_until: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    duration: 'yearly',
    price: 0,
    created_at: new Date().toISOString(),
    is_active: true,
    usage_count: 5,
    deviceId: null
  }
];

const INITIAL_PROFILE: ShopProfile = {
  name: "Lumina Coffee Space",
  address: "Jl. Digital No. 2025, Cyber City",
  phone: "0812-3456-7890",
  footerMessage: "Thank you for visiting the future!"
};

class DBService {
  private isOffline = false;

  constructor() {
    // Optional: Check connection state listeners here if needed
  }

  // --- Helper: LocalStorage Fallback ---
  private getLocal<T>(key: string, initial: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  }

  private setLocal(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage full", e);
    }
  }

  private handleError(e: any) {
    console.warn("Firebase Error (Switching to Offline Mode):", e.message);
    this.isOffline = true;
  }

  // --- Admin Credentials ---
  async getAdminCredentials() {
    try {
      if (this.isOffline) throw new Error("Offline");
      const docRef = doc(firestore, 'settings', 'admin_creds');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as { username: string, password: string };
      return null; // Return null if no admin credentials exist
    } catch (e) {
      this.handleError(e);
      return this.getLocal('admin_creds', null);
    }
  }

  async updateAdminCredentials(username: string, password: string) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'settings', 'admin_creds'), { username, password });
    } catch (e) {
      this.handleError(e);
      this.setLocal('admin_creds', { username, password });
    }
  }

  async validateAdmin(u: string, p: string): Promise<boolean> {
    const creds = await this.getAdminCredentials();
    return creds ? creds.username === u && creds.password === p : false;
  }

  // --- Products ---
  async getProducts(): Promise<Product[]> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const snapshot = await getDocs(collection(firestore, 'products'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      // Sync to local for future offline use
      if (data.length > 0) this.setLocal('products', data);
      return data.length > 0 ? data : INITIAL_PRODUCTS;
    } catch (e) {
      this.handleError(e);
      return this.getLocal('products', INITIAL_PRODUCTS);
    }
  }
  
  async saveProduct(product: Product) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'products', product.id), product);
    } catch (e) {
      this.handleError(e);
      const products = this.getLocal<Product[]>('products', INITIAL_PRODUCTS);
      const index = products.findIndex(p => p.id === product.id);
      if (index >= 0) products[index] = product;
      else products.push(product);
      this.setLocal('products', products);
    }
  }

  async deleteProduct(id: string) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await deleteDoc(doc(firestore, 'products', id));
    } catch (e) {
      this.handleError(e);
      const products = this.getLocal<Product[]>('products', INITIAL_PRODUCTS).filter(p => p.id !== id);
      this.setLocal('products', products);
    }
  }

  // --- Keys ---
  async getKeys(): Promise<AuthKey[]> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const snapshot = await getDocs(collection(firestore, 'auth_keys'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuthKey));
    } catch (e) {
      this.handleError(e);
      return this.getLocal('auth_keys', INITIAL_KEYS);
    }
  }

  async addKey(key: AuthKey) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'auth_keys', key.id), key);
    } catch (e) {
      this.handleError(e);
      const keys = this.getLocal<AuthKey[]>('auth_keys', INITIAL_KEYS);
      this.setLocal('auth_keys', [key, ...keys]);
    }
  }

  async revokeKey(id: string) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await updateDoc(doc(firestore, 'auth_keys', id), { is_active: false });
    } catch (e) {
      this.handleError(e);
      const keys = this.getLocal<AuthKey[]>('auth_keys', INITIAL_KEYS).map(k => k.id === id ? { ...k, is_active: false } : k);
      this.setLocal('auth_keys', keys);
    }
  }

  async validateKey(keyStr: string, deviceId: string): Promise<{ valid: boolean; message?: string }> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const q = query(collection(firestore, 'auth_keys'), where('key', '==', keyStr), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return { valid: false, message: 'Invalid Key ID' };

      const docSnap = querySnapshot.docs[0];
      const keyData = docSnap.data() as AuthKey;
      const keyRef = doc(firestore, 'auth_keys', docSnap.id);

      if (!keyData.is_active) return { valid: false, message: 'Key has been revoked' };
      if (new Date(keyData.valid_until) < new Date()) return { valid: false, message: 'Key expired' };

      // Device Binding
      if (keyData.deviceId && keyData.deviceId !== deviceId) {
        return { valid: false, message: 'Key is registered to another device.' };
      }
      if (!keyData.deviceId) {
        await updateDoc(keyRef, { deviceId: deviceId });
      }
      await updateDoc(keyRef, { usage_count: (keyData.usage_count || 0) + 1 });
      return { valid: true };

    } catch (e) {
      this.handleError(e);
      // Offline Validation
      const keys = this.getLocal<AuthKey[]>('auth_keys', INITIAL_KEYS);
      const index = keys.findIndex(k => k.key === keyStr);
      
      if (index === -1) return { valid: false, message: 'Invalid Key (Offline Mode)' };
      const key = keys[index];
      
      if (!key.is_active) return { valid: false, message: 'Key revoked' };
      if (new Date(key.valid_until) < new Date()) return { valid: false, message: 'Key expired' };
      
      if (key.deviceId && key.deviceId !== deviceId) {
        return { valid: false, message: 'Key bound to another device' };
      }
      if (!key.deviceId) key.deviceId = deviceId;
      
      key.usage_count += 1;
      keys[index] = key;
      this.setLocal('auth_keys', keys);
      
      return { valid: true };
    }
  }

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const snapshot = await getDocs(collection(firestore, 'transactions'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      return list.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
      this.handleError(e);
      return this.getLocal<Transaction[]>('transactions', []);
    }
  }

  async addTransaction(tx: Transaction) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'transactions', tx.id), tx);
      // Decrement Stock
      for (const item of tx.items) {
        const pRef = doc(firestore, 'products', item.id);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const currentStock = pSnap.data().stock || 0;
          await updateDoc(pRef, { stock: Math.max(0, currentStock - item.quantity) });
        }
      }
    } catch (e) {
      this.handleError(e);
      const txs = this.getLocal<Transaction[]>('transactions', []);
      this.setLocal('transactions', [tx, ...txs]);
      
      // Offline Stock Update
      const products = this.getLocal<Product[]>('products', INITIAL_PRODUCTS);
      tx.items.forEach(item => {
        const idx = products.findIndex(p => p.id === item.id);
        if (idx >= 0) products[idx].stock = Math.max(0, products[idx].stock - item.quantity);
      });
      this.setLocal('products', products);
    }
  }

  // --- Debt ---
  async getDebts(): Promise<DebtRecord[]> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const snapshot = await getDocs(collection(firestore, 'debts'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DebtRecord));
    } catch (e) {
      this.handleError(e);
      return this.getLocal('debts', []);
    }
  }

  async addDebt(debt: DebtRecord) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'debts', debt.id), debt);
    } catch (e) {
      this.handleError(e);
      const debts = this.getLocal<DebtRecord[]>('debts', []);
      this.setLocal('debts', [debt, ...debts]);
    }
  }

  async updateDebt(debt: DebtRecord) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'debts', debt.id), debt);
    } catch (e) {
      this.handleError(e);
      const debts = this.getLocal<DebtRecord[]>('debts', []).map(d => d.id === debt.id ? debt : d);
      this.setLocal('debts', debts);
    }
  }

  // --- Finance ---
  async getFinancialRecords(): Promise<FinancialRecord[]> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const snapshot = await getDocs(collection(firestore, 'financials'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialRecord));
    } catch (e) {
      this.handleError(e);
      return this.getLocal('financials', []);
    }
  }

  async addFinancialRecord(record: FinancialRecord) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'financials', record.id), record);
    } catch (e) {
      this.handleError(e);
      const recs = this.getLocal<FinancialRecord[]>('financials', []);
      this.setLocal('financials', [record, ...recs]);
    }
  }

  // --- Profile ---
  async getShopProfile(): Promise<ShopProfile> {
    try {
      if (this.isOffline) throw new Error("Offline");
      const docRef = doc(firestore, 'settings', 'shop_profile');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as ShopProfile;
      await setDoc(docRef, INITIAL_PROFILE);
      return INITIAL_PROFILE;
    } catch (e) {
      this.handleError(e);
      return this.getLocal('shop_profile', INITIAL_PROFILE);
    }
  }

  async saveShopProfile(profile: ShopProfile) {
    try {
      if (this.isOffline) throw new Error("Offline");
      await setDoc(doc(firestore, 'settings', 'shop_profile'), profile);
    } catch (e) {
      this.handleError(e);
      this.setLocal('shop_profile', profile);
    }
  }
}

export const db = new DBService();
