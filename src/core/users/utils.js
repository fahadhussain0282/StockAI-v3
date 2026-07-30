export var generateId = function (prefix) {
    if (prefix === void 0) { prefix = 'id'; }
    return "".concat(prefix, "_").concat(Math.random().toString(36).substring(2, 11), "_").concat(Date.now());
};
export var validateEmailFormat = function (email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
export var sanitizeString = function (str) {
    return str.replace(/[<>]/g, '').trim();
};
