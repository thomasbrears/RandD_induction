import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import QuestionTypes from '../../models/QuestionTypes';
import { Upload, message, Image } from 'antd';
import { InboxOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FilePptOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

/**
 * Component for rendering different question types
 */
const QuestionRenderer = ({ question, answer, handleAnswerChange, answerFeedback }) => {
  // Determine if this question is required (default to true)
  const isRequired = question.isRequired !== false;
  
  // Show hint if available and feedback is showing error
  const hint = question.hint && answerFeedback.showFeedback && !answerFeedback.isCorrect ? (
    <div className="mt-2 text-xs italic text-gray-600 bg-gray-100 p-2 rounded-md">
      <span className="font-semibold">Hint:</span> {question.hint}
    </div>
  ) : null;
  
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
          {hint}
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
        </div>
      );
      
    case QuestionTypes.YES_NO:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {hint}
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
        </div>
      );

    case QuestionTypes.MULTICHOICE:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select option(s){requiredIndicator}</p>
          </div>
          {hint}
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
        </div>
      );
      
    case QuestionTypes.DROPDOWN:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {hint}
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
        </div>
      );

    case QuestionTypes.SHORT_ANSWER:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Enter your answer{requiredIndicator}</p>
          </div>
          {hint}
          <textarea
            rows={4}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-base"
          />
        </div>
      );

    case QuestionTypes.INFORMATION:
      return (
        <div className="mt-2 bg-blue-50 p-4 rounded-md border border-blue-200">
          {question.description ? (
            <div dangerouslySetInnerHTML={{ __html: question.description }} />
          ) : (
            <p className="text-gray-500 italic">Information block</p>
          )}
          {hint}
        </div>
      );
      
    case QuestionTypes.FILE_UPLOAD:
      // Enhanced file upload UI with Ant Design
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Upload a file{requiredIndicator}</p>
          </div>
          {hint}
          
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
              beforeUpload={() => false} // Disable actual upload, just capture the file
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
    incorrectAnswerMessage: PropTypes.string
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