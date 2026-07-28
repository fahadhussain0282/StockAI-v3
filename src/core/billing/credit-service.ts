import { CreditLedger, CreditTransaction } from './types';
import { creditStore } from './store';
import { generateId, emitBillingEvent } from './utils';

export class CreditService {
  public static async getLedger(orgId: string): Promise<CreditLedger> {
    let ledger = await creditStore.getLedger(orgId);
    if (!ledger) {
      ledger = await creditStore.createLedger({
        id: generateId('led'),
        orgId,
        balance: 0,
        updatedAt: new Date().toISOString()
      });
    }
    return ledger;
  }

  public static async consumeCredits(orgId: string, amount: number, type: CreditTransaction['type'], description: string): Promise<{ success: boolean, errors?: string[] }> {
    if (amount <= 0) return { success: false, errors: ['Consumption amount must be positive'] };
    
    const ledger = await this.getLedger(orgId);
    if (ledger.balance < amount) {
      return { success: false, errors: ['Insufficient credits'] };
    }

    const transaction: CreditTransaction = {
      id: generateId('ctx'),
      orgId,
      amount: -amount,
      type,
      description,
      timestamp: new Date().toISOString()
    };

    await creditStore.recordTransaction(transaction);
    await creditStore.updateLedger(orgId, ledger.balance - amount);
    
    emitBillingEvent('CreditsConsumed', { orgId, amount, type });

    return { success: true };
  }

  public static async topUpCredits(orgId: string, amount: number, type: CreditTransaction['type']): Promise<void> {
    if (amount <= 0) return;

    const ledger = await this.getLedger(orgId);
    
    const transaction: CreditTransaction = {
      id: generateId('ctx'),
      orgId,
      amount,
      type,
      description: 'Credit Top-Up',
      timestamp: new Date().toISOString()
    };

    await creditStore.recordTransaction(transaction);
    await creditStore.updateLedger(orgId, ledger.balance + amount);

    emitBillingEvent('CreditsAdded', { orgId, amount, type });
  }
}
