import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import QuestionTypes from '../../models/QuestionTypes';
import { Upload, message, Image } from 'antd';
import { InboxOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined } from '@ant-design/icons';
import TruncatedDescription from '../questions/TruncatedDescription';

const { Dragger } = Upload;

/**
 * Component for rendering different question types
 */
const QuestionRenderer = ({ question, answer, handleAnswerChange, answerFeedback }) => {
  // Determine if this question is required (default to true)
  const isRequired = question.isRequired !== false;
  
  // Character limits for short answer questions
  const MIN_CHARS = question.minChars || 10;
  const MAX_CHARS = question.maxChars || 1000;
  
  // State for character counting
  const [charCount, setCharCount] = useState(0);
  const [validationError, setValidationError] = useState('');
  
  // Update character count when answer changes
  useEffect(() => {
    if (question.type === QuestionTypes.SHORT_ANSWER && answer) {
      setCharCount(answer.length);
    } else {
      setCharCount(0);
    }
  }, [answer, question.type]);
  
  // Validation for text fields
  const validateTextField = (value) => {
    if (!value && isRequired) {
      setValidationError('This field is required');
      return false;
    }
    
    if (value && value.length < MIN_CHARS) {
      setValidationError(`Answer must be at least ${MIN_CHARS} characters`);
      return false;
    }
    
    if (value && value.length > MAX_CHARS) {
      setValidationError(`Answer must not exceed ${MAX_CHARS} characters`);
      return false;
    }
    
    setValidationError('');
    return true;
  };
  
  // Feedback display
  const renderFeedback = () => {
    // Incorrect answer message
    const getIncorrectMessage = () => {
      if (answerFeedback.isCorrect === false) {
        let message = answerFeedback.message || 'This answer is incorrect.';
        
        // Add custom incorrect message if available
        if (question.incorrectAnswerMessage) {
          message = question.incorrectAnswerMessage;
        }
        
        // Add hint if available
        if (question.hint) {
          message += ` Hint: ${question.hint}`;
        }
        
        return message;
      }
      
      return answerFeedback.message;
    };
    
    if (answerFeedback.showFeedback) {
      return (
        <div className={`mt-4 p-3 rounded-md ${
          answerFeedback.isCorrect === true 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : answerFeedback.isCorrect === false
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-orange-50 text-orange-700 border border-orange-200'
        }`}>
          <div className="flex items-start">
            {answerFeedback.isCorrect === true ? (
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : answerFeedback.isCorrect === false ? (
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            )}
            <span className="font-medium">{getIncorrectMessage()}</span>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Show required indicator if needed
  const requiredIndicator = isRequired ? (
    <span className="text-red-500 ml-1">*</span>
  ) : null;

  // For File Upload component
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Helper function to convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };
  
  // Initialize fileList from existing answer if available
  useEffect(() => {
    if (answer && !fileList.length) {
      const isImage = answer.type?.startsWith('image/');
      setFileList([{ 
        uid: '-1',
        name: answer.name,
        status: 'done',
        size: answer.size,
        type: answer.type,
        originFileObj: answer,
        // For images, create a preview URL
        ...(isImage && { thumbUrl: URL.createObjectURL(answer) })
      }]);
    }
  }, [answer, fileList.length]);
  
  // File type restrictions
  const acceptedFileTypes = '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
  
  // Handle preview for image files
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1));
  };
  
  // Custom file upload component handler
  const handleFileChange = ({ fileList: newFileList }) => {
    // Always limit to one file
    const limitedFileList = newFileList.slice(-1);
    
    // Update the state
    setFileList(limitedFileList);
    
    if (limitedFileList.length === 0) {
      // If file is removed, clear the answer
      handleAnswerChange(null);
    } else if (limitedFileList[0].originFileObj) {
      // Update the answer with the file object
      handleAnswerChange(limitedFileList[0].originFileObj);
      
      // Only show success message for new files
      if (newFileList.length > fileList.length) {
        message.success(`${limitedFileList[0].name} selected`);
      }
    }
  };
  
  // Function to get the appropriate icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileOutlined />;
    
    if (fileType.startsWith('image/')) return <FileOutlined style={{ color: '#1890ff' }} />;
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FileWordOutlined style={{ color: '#2f54eb' }} />;
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return <FilePptOutlined style={{ color: '#fa8c16' }} />;
    
    return <FileOutlined />;
  };

  switch (question.type) {
    case QuestionTypes.TRUE_FALSE:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                id={`option-${question.id}-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={answer === index}
                onChange={() => handleAnswerChange(index)}
                className="w-5 h-5 text-gray-800 border-gray-300 focus:ring-gray-500"
              />
              <label htmlFor={`option-${question.id}-${index}`} className="ml-2 block text-gray-700 break-words">
                {option}
              </label>
            </div>
          ))}
          {renderFeedback()}
        </div>
      );
      
    case QuestionTypes.YES_NO:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                id={`option-${question.id}-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={answer === index}
                onChange={() => handleAnswerChange(index)}
                className="w-5 h-5 text-gray-800 border-gray-300 focus:ring-gray-500"
              />
              <label htmlFor={`option-${question.id}-${index}`} className="ml-2 block text-gray-700">
                {option}
              </label>
            </div>
          ))}
          {renderFeedback()}
        </div>
      );

    case QuestionTypes.MULTICHOICE:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select option(s){requiredIndicator}</p>
          </div>
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                id={`option-${question.id}-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={Array.isArray(answer) && answer.includes(index)}
                onChange={() => {
                  if (Array.isArray(answer)) {
                    if (answer.includes(index)) {
                      handleAnswerChange(answer.filter(i => i !== index));
                    } else {
                      handleAnswerChange([...answer, index]);
                    }
                  } else {
                    handleAnswerChange([index]);
                  }
                }}
                className="w-5 h-5 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
              />
              <label htmlFor={`option-${question.id}-${index}`} className="ml-2 block text-gray-700 text-base">
                {option}
              </label>
            </div>
          ))}
          {renderFeedback()}
        </div>
      );
      
    case QuestionTypes.DROPDOWN:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          <select
            value={answer !== undefined ? answer : ''}
            onChange={(e) => handleAnswerChange(e.target.value === '' ? '' : e.target.value)}
            className="block w-full p-2 mt-1 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-base"
          >
            <option value="">Select an answer</option>
            {question.options.map((option, index) => (
              <option key={index} value={index}>
                {option}
              </option>
            ))}
          </select>
          {renderFeedback()}
        </div>
      );

    case QuestionTypes.SHORT_ANSWER:
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Enter your answer{requiredIndicator}</p>
            <p className={`text-xs ${
              charCount > MAX_CHARS ? 'text-red-600 font-medium' : 
              charCount > MAX_CHARS * 0.9 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              {charCount}/{MAX_CHARS} characters
            </p>
          </div>
          
          <textarea
            rows={8}
            value={answer || ''}
            onChange={(e) => {
              const newValue = e.target.value;
              handleAnswerChange(newValue);
              validateTextField(newValue);
              setCharCount(newValue.length);
            }}
            onBlur={(e) => validateTextField(e.target.value)}
            placeholder={`Type your answer here (${MIN_CHARS}-${MAX_CHARS} characters)...`}
            className={`block w-full p-2 rounded-md shadow-sm focus:ring focus:ring-opacity-50 text-base ${
              validationError 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : charCount > MAX_CHARS * 0.9 
                  ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
            }`}
            maxLength={MAX_CHARS + 50} // Allow some overflow
          />
          
          {/* Inline validation error */}
          {validationError && (
            <p className="mt-1 text-sm text-red-600">{validationError}</p>
          )}
          
          {/* Character count warning */}
          {charCount > MAX_CHARS * 0.9 && charCount <= MAX_CHARS && (
            <p className="mt-1 text-sm text-orange-600">
              Approaching character limit
            </p>
          )}
          
          {/* Minimum character hint */}
          {charCount > 0 && charCount < MIN_CHARS && (
            <p className="mt-1 text-sm text-gray-500">
              {MIN_CHARS - charCount} more character{MIN_CHARS - charCount !== 1 ? 's' : ''} needed
            </p>
          )}
          
          {renderFeedback()}
        </div>
      );

    case QuestionTypes.INFORMATION:
      return (
        <div className="mt-2 bg-blue-50 p-4 rounded-md border border-blue-200">
          {question.description ? (
            <TruncatedDescription 
              description={question.description}
              maxLength={350}
              maxHeight={180}
            />
          ) : (
            <p className="text-gray-500 italic">Information block</p>
          )}
          {renderFeedback()}
        </div>
      );
      
    case QuestionTypes.FILE_UPLOAD:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Upload a file{requiredIndicator}</p>
          </div>
          
          {/* Display file if one is selected */}
          {fileList.length > 0 ? (
            <div className="mt-4">
              {/* File details card with consistent design */}
              <div className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(answer?.type)}
                    <div>
                      <p className="text-sm font-medium">{answer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {(answer?.size / 1024).toFixed(2)} KB · {answer?.type || 'File'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleAnswerChange(null);
                      setFileList([]);
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                
                {/* Image preview for image files */}
                {answer?.type?.startsWith('image/') && (
                  <div className="mt-3">
                    <div 
                      className="cursor-pointer border border-gray-200 rounded overflow-hidden"
                      onClick={() => handlePreview(fileList[0])}
                    >
                      <img 
                        src={URL.createObjectURL(answer)} 
                        alt={answer.name} 
                        className="max-h-40 object-contain mx-auto"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-1">Click to enlarge</p>
                  </div>
                )}
              </div>
              
              {/* Preview modal for images */}
              {previewImage && (
                <Image
                  wrapperStyle={{ display: 'none' }}
                  preview={{
                    visible: previewOpen,
                    onVisibleChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) => !visible && setPreviewImage(''),
                  }}
                  src={previewImage}
                  alt={previewTitle}
                />
              )}
            </div>
          ) : (
            // No file uploaded yet, show the dragger
            <Dragger
              name="file"
              multiple={false}
              fileList={fileList}
              accept={acceptedFileTypes}
              beforeUpload={() => false} // Disable upload, just capture the file
              onChange={handleFileChange}
              className="mt-2"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#8c8c8c' }} />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint text-xs text-gray-500">
                Supported formats: Images (JPG, PNG, GIF), Documents (PDF, Word, Excel, PowerPoint)
              </p>
            </Dragger>
          )}
          
          {renderFeedback()}
        </div>
      );
      
    default:
      return <p className="text-red-500">Unsupported question type: {question.type}</p>;
  }
};

QuestionRenderer.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    question: PropTypes.string,
    description: PropTypes.string,
    options: PropTypes.array,
    isRequired: PropTypes.bool,
    hint: PropTypes.string,
    incorrectAnswerMessage: PropTypes.string,
    minChars: PropTypes.number,
    maxChars: PropTypes.number,
    youtubeUrl: PropTypes.string,
  }).isRequired,
  answer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
    PropTypes.object,
    PropTypes.bool
  ]),
  handleAnswerChange: PropTypes.func.isRequired,
  answerFeedback: PropTypes.shape({
    isCorrect: PropTypes.bool,
    message: PropTypes.string,
    showFeedback: PropTypes.bool
  }).isRequired
};

export default QuestionRenderer;