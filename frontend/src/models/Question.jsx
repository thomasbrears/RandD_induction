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
};