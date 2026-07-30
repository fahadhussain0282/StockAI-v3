var AuthValidators = /** @class */ (function () {
    function AuthValidators() {
    }
    AuthValidators.validateEmail = function (email) {
        if (!email || typeof email !== 'string') {
            return { valid: false, cleanEmail: '', error: 'Email is required.' };
        }
        var cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            return { valid: false, cleanEmail: cleanEmail, error: 'Valid email address is required.' };
        }
        return { valid: true, cleanEmail: cleanEmail };
    };
    AuthValidators.sanitizeInput = function (input) {
        if (!input)
            return '';
        // Basic sanitization
        return input.trim().replace(/[<>]/g, '');
    };
    return AuthValidators;
}());
export { AuthValidators };
