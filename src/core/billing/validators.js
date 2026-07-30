export var validateAmount = function (amount) {
    return typeof amount === 'number' && amount > 0 && Number.isInteger(amount);
};
export var validateCurrency = function (currency) {
    return typeof currency === 'string' && currency.length === 3;
};
