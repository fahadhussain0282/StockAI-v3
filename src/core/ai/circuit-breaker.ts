/**
 * StockAI Enterprise Circuit Breaker
 *
 * States:
 *   closed    → Normal operation. Requests flow through.
 *   open      → Provider is blocked. Requests immediately skip to fallback.
 *   half-open → Cooldown elapsed. One test request allowed. If it succeeds,
 *               circuit closes. If it fails, circuit reopens.
 *
 * Thresholds (configurable):
 *   FAILURE_THRESHOLD    = 5  consecutive failures before opening
 *   COOLDOWN_MS          = 60_000ms (60 seconds)
 *   SUCCESS_THRESHOLD    = 1  success in half-open to close
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

interface ProviderCircuit {
  state: CircuitState;
  consecutiveFailures: number;
  lastOpenedAt: number | null;
  halfOpenTestAllowed: boolean;
  lastStateChange: string;
}

const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 60_000; // 60 seconds

class CircuitBreaker {
  private circuits: Map<string, ProviderCircuit> = new Map();

  private getCircuit(providerId: string): ProviderCircuit {
    if (!this.circuits.has(providerId)) {
      this.circuits.set(providerId, {
        state: 'closed',
        consecutiveFailures: 0,
        lastOpenedAt: null,
        halfOpenTestAllowed: false,
        lastStateChange: new Date().toISOString()
      });
    }
    return this.circuits.get(providerId)!;
  }

  /**
   * Returns true if the provider is currently allowed to receive requests.
   * Automatically transitions open → half-open when cooldown has elapsed.
   */
  isAllowed(providerId: string): boolean {
    const circuit = this.getCircuit(providerId);

    if (circuit.state === 'closed') return true;

    if (circuit.state === 'open') {
      const elapsed = Date.now() - (circuit.lastOpenedAt || 0);
      if (elapsed >= COOLDOWN_MS) {
        // Transition to half-open — allow one test request
        circuit.state = 'half-open';
        circuit.halfOpenTestAllowed = true;
        circuit.lastStateChange = new Date().toISOString();
        console.log(`[CircuitBreaker] ${providerId}: open → half-open (cooldown elapsed)`);
        return true;
      }
      // Still in cooldown
      return false;
    }

    if (circuit.state === 'half-open') {
      if (circuit.halfOpenTestAllowed) {
        circuit.halfOpenTestAllowed = false; // Only one test at a time
        return true;
      }
      return false; // Another request already in-flight for the test
    }

    return true;
  }

  /**
   * Record a successful request. Resets failure count.
   * If in half-open, closes the circuit.
   */
  recordSuccess(providerId: string): void {
    const circuit = this.getCircuit(providerId);
    const waHalfOpen = circuit.state === 'half-open';
    circuit.consecutiveFailures = 0;
    circuit.state = 'closed';
    circuit.lastStateChange = new Date().toISOString();
    if (waHalfOpen) {
      console.log(`[CircuitBreaker] ${providerId}: half-open → closed (test request succeeded)`);
    }
  }

  /**
   * Record a failed request. Opens the circuit after threshold.
   */
  recordFailure(providerId: string): void {
    const circuit = this.getCircuit(providerId);
    circuit.consecutiveFailures++;

    if (circuit.state === 'half-open') {
      // Test failed — reopen the circuit
      circuit.state = 'open';
      circuit.lastOpenedAt = Date.now();
      circuit.lastStateChange = new Date().toISOString();
      console.warn(`[CircuitBreaker] ${providerId}: half-open → open (test request failed)`);
      return;
    }

    if (circuit.state === 'closed' && circuit.consecutiveFailures >= FAILURE_THRESHOLD) {
      circuit.state = 'open';
      circuit.lastOpenedAt = Date.now();
      circuit.lastStateChange = new Date().toISOString();
      console.warn(`[CircuitBreaker] ${providerId}: closed → open (${circuit.consecutiveFailures} consecutive failures)`);
    }
  }

  /**
   * Get circuit state for a provider.
   */
  getState(providerId: string): CircuitState {
    const circuit = this.getCircuit(providerId);
    // Auto-transition open → half-open if cooldown elapsed
    if (circuit.state === 'open') {
      const elapsed = Date.now() - (circuit.lastOpenedAt || 0);
      if (elapsed >= COOLDOWN_MS) {
        circuit.state = 'half-open';
        circuit.halfOpenTestAllowed = true;
        circuit.lastStateChange = new Date().toISOString();
      }
    }
    return circuit.state;
  }

  /**
   * Get full diagnostics for all circuits.
   */
  getAllCircuits(): Record<string, { state: CircuitState; consecutiveFailures: number; lastOpenedAt: string | null; lastStateChange: string; cooldownRemainingMs: number }> {
    const result: Record<string, any> = {};
    for (const [id, circuit] of this.circuits.entries()) {
      const cooldownRemaining = circuit.state === 'open'
        ? Math.max(0, COOLDOWN_MS - (Date.now() - (circuit.lastOpenedAt || 0)))
        : 0;
      result[id] = {
        state: circuit.state,
        consecutiveFailures: circuit.consecutiveFailures,
        lastOpenedAt: circuit.lastOpenedAt ? new Date(circuit.lastOpenedAt).toISOString() : null,
        lastStateChange: circuit.lastStateChange,
        cooldownRemainingMs: cooldownRemaining
      };
    }
    return result;
  }

  /**
   * Manually reset a provider's circuit (admin override).
   */
  reset(providerId: string): void {
    this.circuits.set(providerId, {
      state: 'closed',
      consecutiveFailures: 0,
      lastOpenedAt: null,
      halfOpenTestAllowed: false,
      lastStateChange: new Date().toISOString()
    });
    console.log(`[CircuitBreaker] ${providerId}: manually reset to closed`);
  }
}

export const CircuitBreakerService = new CircuitBreaker();
