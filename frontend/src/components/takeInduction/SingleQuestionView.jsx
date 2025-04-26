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
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <div className="space-y-4">
            {/* Question header with number */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-medium">
                  {currentIndex + 1}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold flex-1 break-words">
                {question.question}
              </h2>
            </div>
            
            {question.description && (
              <div 
                className="text-gray-600 prose max-w-none text-sm sm:text-base break-words overflow-hidden"
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
          </div>
        </div>
      </div>
      
      {/* Fixed bottom navigation for mobile, normal for desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-0 md:p-0 md:mt-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress indicator for mobile */}
          <div className="text-center text-sm text-gray-500 mb-3 md:hidden">
            Question {currentIndex + 1} of {totalQuestions}
          </div>
          
          <div className="flex justify-between gap-4">
            <button 
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className={`flex-1 px-4 py-3 border rounded-md text-sm sm:text-base ${
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
                  answerFeedback.showFeedback && 
                  !answerFeedback.isCorrect && 
                  question.type !== QuestionTypes.SHORT_ANSWER
                }
                className={`flex-1 px-4 py-3 bg-blue-600 text-white rounded-md text-sm sm:text-base ${
                  answerFeedback.showFeedback && 
                  !answerFeedback.isCorrect && 
                  question.type !== QuestionTypes.SHORT_ANSWER
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleGoToSubmissionScreen}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm sm:text-base"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
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