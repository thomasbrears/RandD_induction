import QuestionTypes from './QuestionTypes';

/**
 * @typedef {Object} Answer
 * @property {string} text
 * @property {boolean} isCorrect
 */

/**
 * @typedef {Object} Question
 * @property {string} [id]
 * @property {string} [question]
 * @property {string} [description]
 * @property {QuestionTypes} [type]
 * @property {Answer[]} [answers]
 */

/** @type {Question} */
export const DefaultNewQuestion = {
    id: undefined,
    question: "",
    description: "",
    type: QuestionTypes.MULTICHOICE,
    answers: [],
};