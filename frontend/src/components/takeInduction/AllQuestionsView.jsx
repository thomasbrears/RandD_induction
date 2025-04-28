import React from 'react';
import PropTypes from 'prop-types';
import QuestionRenderer from './QuestionRenderer';

/**
 * Component for displaying all questions in a list view
 */
const AllQuestionsView = ({ 
  questions, 
  answers, 
  handleAnswerChange, 
  answerFeedback,
  isSubmitting 
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {questions.map((question, index) => (
          <div 
            key={question.id}
            className="bg-gray-50 p-4 sm:p-6 rounded-lg"
          >
            <h2 className="text-xl font-semibold mb-2 flex items-center">
              <span className="bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm flex-shrink-0">
                {index + 1}
              </span>
              <span className="break-words">{question.question}</span>
            </h2>
            
            {question.description && (
              <div 
                className="text-gray-600 prose max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />
            )}
            
            <div className="mt-2">
              <QuestionRenderer
                question={question}
                answer={answers[question.id]}
                handleAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                answerFeedback={answerFeedback}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Submit button */}
      <div className="mt-8 flex justify-center">
        <button 
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-3 bg-gray-800 text-white rounded-md w-full sm:w-auto ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Complete Induction'}
        </button>
      </div>
    </div>
  );
};

AllQuestionsView.propTypes = {
  questions: PropTypes.array.isRequired,
  answers: PropTypes.object.isRequired,
  handleAnswerChange: PropTypes.func.isRequired,
  answerFeedback: PropTypes.shape({
    isCorrect: PropTypes.bool,
    message: PropTypes.string,
    showFeedback: PropTypes.bool
  }).isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default AllQuestionsView;