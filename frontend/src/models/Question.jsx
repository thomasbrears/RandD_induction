import QuestionTypes from './QuestionTypes';

/**
 * @typedef {Object} Question
 * @property {string} [id]
 * @property {string} [question]
 * @property {string} [description]
 * @property {QuestionTypes} [type]
 * @property {string[]} [options]
 * @property {Array[]} [answers]
 * @property {File | null} [imageFile]
 * @property {boolean} [isRequired]
 * @property {string} [hint]
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
    imageFile: null,
    isRequired: true,
    hint: "",
    incorrectAnswerMessage: ""
};