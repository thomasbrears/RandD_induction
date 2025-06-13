import React from 'react';
import PropTypes from 'prop-types';
import { Image } from 'antd';
import QuestionRenderer from './QuestionRenderer';

/**
 * Component for displaying all questions in a list view
 */
const AllQuestionsView = ({ 
  questions, 
  answers, 
  handleAnswerChange, 
  answerFeedback,
  isSubmitting,
  imageUrls = {}
}) => {
  
  // Helper function to get image URLs for a specific question
  const getQuestionImageUrls = (questionIndex) => {
    if (!imageUrls || typeof imageUrls !== 'object') return [];
    
    const urls = [];
    
    // Check for primary image
    if (imageUrls[questionIndex]) {
      urls.push(imageUrls[questionIndex]);
    }
    
    // Check for secondary image
    if (imageUrls[`${questionIndex}_secondary`]) {
      urls.push(imageUrls[`${questionIndex}_secondary`]);
    }
    
    return urls.filter(url => url); // Remove any null/undefined values
  };

  // Render multiple images for a question
  const renderQuestionImages = (questionIndex) => {
    const validUrls = getQuestionImageUrls(questionIndex);
    if (!validUrls.length) return null;
    
    return (
      <div className="mb-4">
        <div className={`grid gap-3 ${validUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {validUrls.map((url, index) => (
            <div key={index} className="flex justify-center">
              <img
                src={url}
                alt={`Question Image ${index + 1}`}
                className="max-w-full max-h-64 object-contain border rounded-lg shadow-sm"
                style={{ maxWidth: '100%', height: 'auto' }}
                onError={(e) => {
                  console.error('Image failed to load:', url);
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

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
            
            {/* Display Images if available */}
            {renderQuestionImages(index)}
            
            <div className="mt-2">
              <QuestionRenderer
                question={question}
                answer={answers[question.id]}
                handleAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                answerFeedback={answerFeedback}
                imageUrls={getQuestionImageUrls(index)} // Pass image URLs to QuestionRenderer
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
  isSubmitting: PropTypes.bool.isRequired,
  imageUrls: PropTypes.object
};

export default AllQuestionsView;