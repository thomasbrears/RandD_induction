import Locations from './Locations';
import Permissions from './Permissions';
import Positions from './Positions';

/**
 * @typedef {Object} User
 * @property {string} [_id]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [email]
 * @property {Permissions} [permission]
 * @property {Positions} [position]
 * @property {Array<Locations>} [locations]
 */

/** @type {User} */
export const DefaultNewUser = {
    _id: undefined,
    firstName: "",
    lastName: "",
    email: "",
    permission: Permissions.USER,
    position: Positions.TEAM,
    locations: [],
};