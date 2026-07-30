export var USER_CONSTANTS = {
    AVATAR_MAX_SIZE_MB: 5,
    AVATAR_ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    BIO_MAX_LENGTH: 500,
    PASSWORD_MIN_LENGTH: 8
};
export var DEFAULT_PREFERENCES = {
    theme: 'system',
    language: 'en-US',
    timezone: 'UTC',
    defaultMarketplace: 'stockai',
    defaultAiProvider: 'gemini',
    defaultExportFormat: 'json',
    notifications: {
        emailAlerts: true,
        inAppAlerts: true,
        marketingEmails: false
    },
    dashboardLayout: {}
};
