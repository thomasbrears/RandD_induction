import Permissions from './Permissions';
import Positions from './Positions';

/**
 * @typedef {Object} User
 * @property {string} [uid]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [email]
 * @property {Permissions} [permission]
 * @property {Positions} [position]
 * @property {Array<Locations>} [locations]
 * @property {Array<AssignedInduction>} [assignedInductions]
 */

/** @type {User} */
export const DefaultNewUser = {
    uid: undefined,
    firstName: "",
    lastName: "",
    email: "",
    permission: Permissions.USER,
    position: "",
    department: "",
    locations: [],
    assignedInductions: [],
};