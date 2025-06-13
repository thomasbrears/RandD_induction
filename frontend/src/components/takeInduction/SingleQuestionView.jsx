import React, { useState } from 'react';
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
  imageUrls
}) => {
  // State for image preview modal
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Handle ESC key to close preview
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && previewVisible) {
        handlePreviewClose();
      }
    };

    if (previewVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [previewVisible]);

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
  
  // Helper function to get image URLs for this question
  const getQuestionImageUrls = () => {
    if (!imageUrls || typeof imageUrls !== 'object') {
      return [];
    }
    
    const urls = [];
    
    // Check for primary image
    if (imageUrls[currentIndex]) {
      urls.push(imageUrls[currentIndex]);
    }
    
    // Check for secondary image
    if (imageUrls[`${currentIndex}_secondary`]) {
      urls.push(imageUrls[`${currentIndex}_secondary`]);
    }
    
    return urls.filter(url => url);
  };

  // Handle image click to open preview
  const handleImageClick = (url, index) => {
    setPreviewImage(url);
    setPreviewTitle(`Question ${currentIndex + 1} - Image ${index + 1}`);
    setPreviewVisible(true);
  };

  // Handle preview close
  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setPreviewImage('');
    setPreviewTitle('');
  };
  
  // Render all media (images + video) together
  const renderQuestionMedia = () => {
    const validUrls = getQuestionImageUrls();
    const hasVideo = question.youtubeUrl;
    
    // If no media at all, return null
    if (!validUrls.length && !hasVideo) {
      return null;
    }

    // Calculate total media items
    const totalMediaItems = validUrls.length + (hasVideo ? 1 : 0);
    
    // Determine grid layout based on total items
    const getGridClass = () => {
      if (totalMediaItems === 1) return 'grid-cols-1';
      if (totalMediaItems === 2) return 'grid-cols-1 md:grid-cols-2';
      if (totalMediaItems === 3) return 'grid-cols-1 md:grid-cols-3';
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // For 4+ items
    };
    
    return (
      <div className="mb-4">
        <div className={`grid gap-4 ${getGridClass()}`}>
          {/* Render Images */}
          {validUrls.map((url, index) => (
            <div key={`image-${index}`} className="flex justify-center">
              <div 
                className="relative group cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleImageClick(url, index)}
              >
                <img
                  src={url}
                  alt={`Question Image ${index + 1}`}
                  className="rounded-lg shadow-md border border-gray-200 w-full object-contain"
                  style={{ 
                    maxWidth: '600px',
                    maxHeight: '400px',
                    width: '100%',
                    height: 'auto'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', url);
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                
                {/* Hover overlay with enlarge hint */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white bg-opacity-95 text-gray-800 px-4 py-2 rounded-full text-sm font-medium shadow-lg flex items-center">
                    <svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" 
                      />
                    </svg>
                    Click to enlarge
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Render YouTube Video */}
          {hasVideo && (
            <div key="video" className="flex justify-center">
              <div className="w-full" style={{ maxWidth: '600px' }}>
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden shadow-md border border-gray-200">
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
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
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Determine next button state and behavior
  const isNextDisabled = answerFeedback.showFeedback && 
                      !answerFeedback.isCorrect && 
                      question.requiresCorrectAnswer;
                      
  const handleNext = () => {
    handleNextQuestion();
  };
  
  return (
    <>
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
            {question.description && !isInformation && (
              <FormattedDescription description={question.description} />
            )}
            
            {/* Display All Media (Images + Video) */}
            {renderQuestionMedia()}

            <br />
            
            {/* Question input */}
            <div className="mt-6 mb-24">
              <QuestionRenderer 
                question={question}
                answer={answer}
                handleAnswerChange={handleAnswerChange}
                answerFeedback={answerFeedback}
                imageUrls={getQuestionImageUrls()}
              />
            </div>
          </div>
        </div>
        
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

      {/* Image Preview Modal */}
      {previewVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          {/* Modal backdrop - click to close */}
          <div 
            className="absolute inset-0" 
            onClick={handlePreviewClose}
          />
          
          {/* Modal content */}
          <div className="relative max-w-7xl max-h-full">
            {/* Close button */}
            <button
              onClick={handlePreviewClose}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image title */}
            <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              {previewTitle}
            </div>
            
            {/* Image */}
            <img
              src={previewImage}
              alt={previewTitle}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
            />
          </div>
        </div>
      )}
    </>
  );
};

SingleQuestionView.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    question: PropTypes.string,
    description: PropTypes.string,
    options: PropTypes.array,
    imageFiles: PropTypes.array,
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
  imageUrls: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ])
};

export default SingleQuestionView;