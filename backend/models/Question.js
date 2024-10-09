import QuestionTypes from './QuestionTypes.js';

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
const DefaultNewQuestion = {
    id: undefined,
    question: "",
    description: "",
    type: QuestionTypes.MULTICHOICE,
    answers: [],
};

export default DefaultNewQuestion;