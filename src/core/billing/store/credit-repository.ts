import { CreditLedger, CreditTransaction } from '../types';

export interface CreditRepository {
  getLedger(orgId: string): Promise<CreditLedger | null>;
  createLedger(ledger: CreditLedger): Promise<CreditLedger>;
  updateLedger(orgId: string, balance: number): Promise<CreditLedger | null>;
  recordTransaction(transaction: CreditTransaction): Promise<CreditTransaction>;
  getTransactions(orgId: string): Promise<CreditTransaction[]>;
}
