import React from 'react';
import PropTypes from 'prop-types';
import QuestionRenderer from './QuestionRenderer';
import QuestionTypes from '../../models/QuestionTypes';
import FormattedDescription from './FormattedDescription';

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
  imageUrl
}) => {
  if (!question) return null;

  const isLastQuestion = currentIndex === totalQuestions - 1;
  
  // Check if this is an information type question
  const isInformation = question.type === QuestionTypes.INFORMATION;
  
  // Function to extract YouTube ID
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };
  
  // Determine next button state and behavior
  const isNextDisabled = answerFeedback.showFeedback && 
                      !answerFeedback.isCorrect && 
                      question.requiresCorrectAnswer;
                      
  const handleNext = () => {
    handleNextQuestion();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question content */}
      <div className="p-4">
        <div className="space-y-4">
          {/* Question title with number */}
          <div className="flex items-start">
            <div className="flex-shrink-0 hidden sm:block">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-medium mr-3">
                {currentIndex + 1}
              </span>
            </div>
            <h2 className="text-lg font-semibold break-words">
              {question.question}
            </h2>
          </div>
          
          {/* Description */}
          {/* Skip description here for INFORMATION questions */}
          {question.description && !isInformation && (
            <FormattedDescription description={question.description} />
          )}
          
          {/* Display Image if available */}
          {imageUrl && (
            <div className="max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
              <img
                src={imageUrl}
                alt="Question Image"
                className="w-full h-auto max-h-[300px] object-contain mx-auto"
                onError={(e) => {
                  console.error('Image failed to load:', imageUrl);
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          )}
          
          {/* Display YouTube Video if available */}
          {question.youtubeUrl && (
            <div className="overflow-hidden rounded-lg">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-md"
                  src={`https://www.youtube.com/embed/${extractYoutubeId(question.youtubeUrl)}?rel=0`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              {/* Link to open in YouTube */}
              <div className="mt-1 text-right">
                <a 
                  href={question.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Open in YouTube
                </a>
              </div>
            </div>
          )}
          
          {/* Question input */}
          <div className="mt-6 mb-24">
            <QuestionRenderer 
              question={question}
              answer={answer}
              handleAnswerChange={handleAnswerChange}
              answerFeedback={answerFeedback}
            />
          </div>
        </div>
      </div>
      
      {/* Fixed navigation buttons at the bottom of the screen */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-md z-10">
        <div className="flex justify-between gap-4 max-w-3xl mx-auto">
          <button 
            type="button"
            onClick={handlePrevQuestion}
            disabled={currentIndex === 0}
            className={`px-4 py-3 rounded-lg border text-base flex-1 font-medium ${
              currentIndex === 0 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
                : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'
            }`}
          >
            Previous
          </button>
          
          <button 
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`px-4 py-3 rounded-lg text-base flex-1 font-medium ${
              isNextDisabled
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLastQuestion ? 'Continue' : 'Next'}
          </button>
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
    youtubeUrl: PropTypes.string,
    requiresCorrectAnswer: PropTypes.bool,
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
  imageUrl: PropTypes.string
};

export default SingleQuestionView;