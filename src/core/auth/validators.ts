export class AuthValidators {
  public static validateEmail(email: string): { valid: boolean; cleanEmail: string; error?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, cleanEmail: '', error: 'Email is required.' };
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { valid: false, cleanEmail, error: 'Valid email address is required.' };
    }

    return { valid: true, cleanEmail };
  }

  public static sanitizeInput(input: string): string {
    if (!input) return '';
    // Basic sanitization
    return input.trim().replace(/[<>]/g, '');
  }
}
