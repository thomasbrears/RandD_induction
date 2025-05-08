import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import QuestionRenderer from './QuestionRenderer';

const extractYoutubeId = (url) => {
  if (!url) return null;
  
  // Match patterns like: https://www.youtube.com/watch?v=VIDEO_ID, 
  // https://youtu.be/VIDEO_ID, or youtube.com/embed/VIDEO_ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
};

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
  QuestionTypes,
  isReviewMode,
  onCloseReviewModal,
  imageUrl
}) => {
  if (!question) return null;

  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Handle validation logic
const handleNext = () => {
  if (isLastQuestion) {
    // If the last question requires validation and has feedback shown, check if it's correct
    if (question.requiresValidation && answerFeedback.showFeedback) {
      // Only proceed to submission screen if the answer is correct
      if (answerFeedback.isCorrect) {
        handleGoToSubmissionScreen();
      }
      // If incorrect, do nothing (button should be disabled in this case)
    } else {
      // If no validation required or feedback not shown yet, go to submission screen
      handleGoToSubmissionScreen();
    }
  } else {
    // Not the last question, just go to the next one
    handleNextQuestion();
  }
};

  return (
    <div className="flex flex-col h-full">
      {/* Conditional Modal for Review */}
      {isReviewMode && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Review Your Answers</h2>
              <button onClick={onCloseReviewModal} className="text-gray-500">Close</button>
            </div>
            <div className="mt-4">
              <p>Review all your answers before submitting.</p>
            </div>
            {/* Add the questions or feedback here */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onCloseReviewModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Question Navigation */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
        <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
          <div className="space-y-4">
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

            {/* Display Image if available */}
            {imageUrl && (
              <div className="mt-4 max-w-full overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt="Question Image"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}

            {/* Display YouTube Video if available */}
            {question.youtubeUrl && (
                <div className="mt-3 max-w-full overflow-hidden rounded-lg">
                    <div className="relative pb-[56.25%] h-0">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-md"
                            src={`https://www.youtube.com/embed/${extractYoutubeId(question.youtubeUrl)}?rel=0`}
                            title="YouTube video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="mt-1 text-right">
                        <a href={question.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800"
                        >Open in YouTube
                        </a>
                    </div>
                </div>
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

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 md:relative md:z-auto md:border-0 md:p-0 md:mt-6">
        <div className="max-w-4xl mx-auto">
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

            <button 
              type="button"
              onClick={handleNext}
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
    imageFile: PropTypes.string,
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
  QuestionTypes: PropTypes.object.isRequired,
  isReviewMode: PropTypes.bool.isRequired,
  onCloseReviewModal: PropTypes.func.isRequired,
};

export default SingleQuestionView;
