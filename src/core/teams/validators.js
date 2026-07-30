import { TEAMS_CONSTANTS } from './constants';
export var validateName = function (name) {
    return typeof name === 'string' && name.length >= TEAMS_CONSTANTS.NAME_MIN_LENGTH && name.length <= TEAMS_CONSTANTS.NAME_MAX_LENGTH;
};
export var validateEmail = function (email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
export var validateRole = function (role) {
    var validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER', 'GUEST'];
    return validRoles.includes(role);
};
