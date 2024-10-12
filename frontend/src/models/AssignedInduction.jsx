import Status from "./Status";

/**
 * @typedef {Object} AssignedInduction
 * @property {string} [id]
 * @property {string} [name]
 * @property {Date} availableFrom
 * @property {Date} dueDate
 * @property {Date} completionDate
 * @property {Status} status
 */

/** @type {AssignedInduction} */
export const DefaultNewAssignedInduction = {
    id: undefined,
    name: "",
    availableFrom: new Date(),
    dueDate: new Date(),
    completionDate: undefined,
    status: Status.ASSIGNED,
};