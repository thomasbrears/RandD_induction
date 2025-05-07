import Departments from './Departments';

/**
 * @typedef {Object} Induction
 * @property {string} [id]
 * @property {string} [name]
 * @property {Departments} [department]
 * @property {string} [description]
 * @property {Array<Question>} [questions]
 * @property {number|null} [expiryMonths]
 */

/** @type {Induction} */
export const DefaultNewInduction = {
    id: undefined,
    name: "",
    department: Departments.RETAIL,
    description: "",
    questions: [],
    expiryMonths: null,
};