import Question from './Question';
import Departments from './Departments';

/**
 * @typedef {Object} Induction
 * @property {string} [id]
 * @property {string} [name]
 * @property {Departments} [department]
 * @property {string} [description]
 * @property {Array<Question>} [questions]
 */

/** @type {Induction} */
export const DefaultNewInduction = {
    id: undefined,
    name: "",
    department: Departments.RETAIL,
    description: "",
    questions: [],
};