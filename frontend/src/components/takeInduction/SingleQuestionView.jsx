import React from 'react';
import PropTypes from 'prop-types';
import QuestionRenderer from './QuestionRenderer';

/**
 * Component for displaying a single question in slideshow view
 */
const SingleQuestionView = ({
  question,
  answer,
  handleAnswerChange,
  answerFeedback,
  handlePrevQuestion,
  handleNextQuestion,
  currentIndex,
  totalQuestions,
  handleGoToSubmissionScreen,
  QuestionTypes
}) => {
  if (!question) return null;
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{question.question}</h2>
          
          {question.description && (
            <div 
              className="text-gray-600 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />
          )}
          
          {/* Question content based on type */}
          <div className="mt-4">
            <QuestionRenderer 
              question={question}
              answer={answer}
              handleAnswerChange={handleAnswerChange}
              answerFeedback={answerFeedback}
            />
          </div>
          
          {/* Answer Feedback */}
          {answerFeedback.showFeedback && (
            <div className={`mt-4 p-3 rounded-md ${
              answerFeedback.isCorrect === true 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : answerFeedback.isCorrect === false
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <div className="flex items-center">
                {answerFeedback.isCorrect === true ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : answerFeedback.isCorrect === false ? (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                )}
                <span className="font-medium">{answerFeedback.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button 
          type="button"
          onClick={handlePrevQuestion}
          disabled={currentIndex === 0}
          className={`px-4 py-2 border rounded-md ${
            currentIndex === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-800 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        
        {currentIndex < totalQuestions - 1 ? (
          <button 
            type="button"
            onClick={handleNextQuestion}
            disabled={
              // Only disable for incorrect answers if it's not a short answer question
              answerFeedback.showFeedback && 
              !answerFeedback.isCorrect && 
              question.type !== QuestionTypes.SHORT_ANSWER
            }
            className={`px-4 py-2 bg-gray-800 text-white rounded-md ${
              answerFeedback.showFeedback && 
              !answerFeedback.isCorrect && 
              question.type !== QuestionTypes.SHORT_ANSWER
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-gray-700'
            }`}
          >
            Next
          </button>
        ) : (
          <button 
            type="button"
            onClick={handleGoToSubmissionScreen}
            className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Review & Submit
          </button>
        )}
      </div>
    </div>
  );
};

SingleQuestionView.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    question: PropTypes.string,
    description: PropTypes.string,
    options: PropTypes.array,
    isRequired: PropTypes.bool
  }),
  answer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
    PropTypes.object
  ]),
  handleAnswerChange: PropTypes.func.isRequired,
  answerFeedback: PropTypes.shape({
    isCorrect: PropTypes.bool,
    message: PropTypes.string,
    showFeedback: PropTypes.bool
  }).isRequired,
  handlePrevQuestion: PropTypes.func.isRequired,
  handleNextQuestion: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  handleGoToSubmissionScreen: PropTypes.func.isRequired,
  QuestionTypes: PropTypes.object.isRequired
};

export default SingleQuestionView;