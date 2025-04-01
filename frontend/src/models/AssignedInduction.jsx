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
    inductionId: "", // The ID of the induction from the inductions collection
    inductionName: "", // Name of the induction (for display purposes)
    status: Status.ASSIGNED, // Current status of the induction assignment
    availableFrom: new Date().toISOString(), // When the induction becomes available
    dueDate: new Date().toISOString(), // When the induction should be completed
    assignedAt: null, // When the induction was assigned
    startedAt: null, // When the user started the induction
    completedAt: null, // When the user completed the induction
    progress: 0, // Progress percentage (0-100)
    feedback: null, // User feedback after completion
  };