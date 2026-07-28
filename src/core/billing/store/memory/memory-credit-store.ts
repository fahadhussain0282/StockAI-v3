import { CreditLedger, CreditTransaction } from '../../types';
import { CreditRepository } from '../credit-repository';

export class MemoryCreditStore implements CreditRepository {
  private ledgers: Map<string, CreditLedger> = new Map();
  private transactions: CreditTransaction[] = [];

  async getLedger(orgId: string): Promise<CreditLedger | null> {
    return this.ledgers.get(orgId) || null;
  }

  async createLedger(ledger: CreditLedger): Promise<CreditLedger> {
    this.ledgers.set(ledger.orgId, ledger);
    return ledger;
  }

  async updateLedger(orgId: string, balance: number): Promise<CreditLedger | null> {
    const ledger = this.ledgers.get(orgId);
    if (!ledger) return null;
    const updated = { ...ledger, balance, updatedAt: new Date().toISOString() };
    this.ledgers.set(orgId, updated);
    return updated;
  }

  async recordTransaction(transaction: CreditTransaction): Promise<CreditTransaction> {
    this.transactions.push(transaction);
    return transaction;
  }

  async getTransactions(orgId: string): Promise<CreditTransaction[]> {
    return this.transactions.filter(t => t.orgId === orgId);
  }
}

export const creditStore = new MemoryCreditStore();
