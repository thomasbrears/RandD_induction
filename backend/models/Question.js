import QuestionTypes from './QuestionTypes';

/**
 * @typedef {Object} Question
 * @property {string} [id]
 * @property {string} [question]
 * @property {string} [description]
 * @property {QuestionTypes} [type]
 * @property {string[]} [options]
 * @property {number[]} [answers]
 * @property {boolean} [requiresValidation]
 * @property {string} [hint]
 * @property {string | null} [imageFile]
 * @property {string} [incorrectAnswerMessage]
 */

/** @type {Question} */
export const DefaultNewQuestion = {
    id: undefined,
    question: "",
    description: "",
    type: QuestionTypes.MULTICHOICE,
    options: [],
    answers: [],
    requiresValidation: true,
    hint: "",
    imageFile: null,
    imageFiles: [],
    incorrectAnswerMessage: ""
};