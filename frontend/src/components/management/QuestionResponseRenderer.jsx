import React, { useState, useMemo } from 'react';
import { 
  Tag, Button, Divider, Tooltip, Empty, Input, Select, Space,
  Card, Pagination
} from 'antd';
import { 
  FlagOutlined, CheckOutlined, CloseOutlined,
  QuestionCircleOutlined, DownOutlined, UpOutlined, 
  SearchOutlined, FilterOutlined
} from '@ant-design/icons';
import FileResultRenderer from './FileResultRenderer';
import useAuth from '../../hooks/useAuth';
import '../../style/Results.css'; 

// Filter and search component for question responses
const QuestionResponseFilter = ({ 
    questions, 
    onFilterApplied 
  }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState(null);
    const [importanceFilter, setImportanceFilter] = useState(null);
  
    // Dynamically generate filter options based on available questions
    const questionTypes = useMemo(() => {
      const types = new Set(questions.map(q => q.type));
      return Array.from(types);
    }, [questions]);
  
    const searchQuestion = (question, term) => {
      // Convert search term to lowercase for case-insensitive search
      const searchTermLower = term.toLowerCase();
  
      // Primary search: Focus on question title/name
      const matchesTitle = (
        question.title?.toLowerCase().includes(searchTermLower) ||
        question.question?.toLowerCase().includes(searchTermLower)
      );
  
      // Secondary search: Include text if title doesn't match
      const matchesText = !matchesTitle && (
        question.text?.toLowerCase().includes(searchTermLower)
      );
  
      return matchesTitle || matchesText;
    };
  
    // Apply filtering logic
    const applyFilters = useMemo(() => {
      return questions.filter(question => {
        // Search filter
        const matchesSearch = !searchTerm || searchQuestion(question, searchTerm);
        
        // Type filter
        const matchesType = !typeFilter || question.type === typeFilter;
        
        // Importance filter
        const matchesImportance = !importanceFilter || 
          (importanceFilter === 'important' && (question.isImportant || question.important)) ||
          (importanceFilter === 'standard' && !(question.isImportant || question.important));
        
        return matchesSearch && matchesType && matchesImportance;
      });
    }, [questions, searchTerm, typeFilter, importanceFilter]);
  
    // Reset all filters
    const resetFilters = () => {
      setSearchTerm('');
      setTypeFilter(null);
      setImportanceFilter(null);
    };
  
    // Trigger filter application callback
    React.useEffect(() => {
      onFilterApplied(applyFilters);
    }, [applyFilters, onFilterApplied]);

  return (
    <Card 
      className="mb-4 bg-gray-50 rounded-lg mx-0"
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-stretch sm:items-center">
        {/* Search Input*/}
        <Input 
          prefix={<SearchOutlined />}
          placeholder="Search questions"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          className="w-full sm:w-64"
        />

        {/* Question Type Filter*/}
        <Select
          className="w-full sm:w-48"
          placeholder="Question Type"
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
        >
          {questionTypes.map(type => (
            <Select.Option key={type} value={type}>
              {{
                'multichoice': 'Multiple Choice',
                'true_false': 'True/False',
                'yes_no': 'Yes/No',
                'dropdown': 'Dropdown',
                'short_answer': 'Short Answer',
                'file_upload': 'File Upload',
                'info_block': 'Information',
                'information': 'Information'
              }[type] || type}
            </Select.Option>
          ))}
        </Select>

        {/* Reset Filters Button */}
        <Button 
          icon={<FilterOutlined />} 
          onClick={resetFilters}
          className="w-full sm:w-auto"
        >
          Reset Filters
        </Button>
      </div>

      {/* Filter Summary */}
      {(searchTerm || typeFilter || importanceFilter) && (
        <div className="mt-3 text-gray-600 text-sm">
          Showing {applyFilters.length} of {questions.length} questions
        </div>
      )}
    </Card>
  );
};

// Question response renderer component
const QuestionResponseRenderer = ({ 
  question, 
  answer, 
  sectionData, 
  isCollapsed, 
  onToggleCollapse
}) => {
  const { user } = useAuth();
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Function to toggle description expansion
  const toggleDescriptionExpanded = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Important answer indicator
  const isImportantQuestion = (question) => {
    return question?.isImportant || question?.important;
  };

  // Check if question type is informational (doesn't require answers)
  const isInformationalQuestion = (questionType) => {
    return questionType === 'info_block' || questionType === 'information';
  };

  // Check if an answer is correct
  const isAnswerCorrect = (question, answer) => {
    // Skip correctness check for informational questions
    if (isInformationalQuestion(question.type)) {
      return null;
    }

    // If the answer object has an isCorrect property, use that
    if (answer && answer.hasOwnProperty('isCorrect')) {
      return answer.isCorrect;
    }
    
    // For automatically gradable questions with defined correct answers
    switch (question.type) {
      case 'multichoice':
        if (question.correctOptions && Array.isArray(answer?.selectedOptions)) {
          return JSON.stringify(answer.selectedOptions.sort()) === 
                JSON.stringify(question.correctOptions.sort());
        }
        break;
        
      case 'true_false':
      case 'yes_no':
      case 'dropdown':
        if (question.correctOption !== undefined && answer) {
          return answer.selectedOption === question.correctOption;
        }
        break;
    }
    
    // For other question types, don't display correctness indicators
    return null;
  };

  // QuestionType tag component
  const QuestionTypeTag = ({ type }) => {
    const typeMap = {
      'multichoice': { color: 'blue', text: 'Multiple Choice' },
      'true_false': { color: 'green', text: 'True/False' },
      'yes_no': { color: 'green', text: 'Yes/No' },
      'dropdown': { color: 'purple', text: 'Dropdown' },
      'short_answer': { color: 'orange', text: 'Short Answer' },
      'file_upload': { color: 'cyan', text: 'File Upload' },
      'info_block': { color: 'gray', text: 'Information' },
      'information': { color: 'gray', text: 'Information' }
    };
    
    const config = typeMap[type] || { color: 'default', text: type };
    
    return (
      <Tag color={config.color} className="rounded-full text-xs py-0.5 px-2 capitalize flex-shrink-0">
        {config.text}
      </Tag>
    );
  };

  // Get answer value for different question types
  const getAnswerValue = (questionType, answerData) => {
    if (!answerData) return "No answer provided";
        
    switch (questionType) {
      case 'multichoice':
        if (!Array.isArray(answerData.selectedOptions)) {
          return "No options selected";
        }
        
        // Use the saved options from the answer if available
        const options = answerData.allOptions || [];
        
        // If we dont have saved options, try to find them in the section
        if (options.length === 0) {
          const multiQuestion = sectionData?.questions?.find(q => q.id === answerData.questionId);
          if (multiQuestion && multiQuestion.options) {
            // Map option indices to option text using section data
            return answerData.selectedOptions.map(optionIndex => {
              return multiQuestion.options[Number(optionIndex)]?.text || 
                    multiQuestion.options[Number(optionIndex)] || 
                    `Option ${optionIndex}`;
            }).join(', ');
          }
          return `Selected options: ${answerData.selectedOptions.join(', ')}`;
        }
        
        // Display all options, highlighting the selected ones
        return (
          <div className="space-y-2 max-w-full">
            {options.map((option, optIdx) => {
              const optionText = typeof option === 'object' ? option.text : option;
              const isSelected = answerData.selectedOptions.includes(optIdx) || 
                                answerData.selectedOptions.includes(String(optIdx));
              
              return (
                <div key={optIdx} className={`flex items-start gap-2 ${isSelected ? 'font-medium' : 'text-gray-500'}`}>
                  <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded border ${isSelected ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                  <span className="break-words flex-1 min-w-0">{optionText}</span>
                  {isSelected && <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
                </div>
              );
            })}
          </div>
        );
        
      case 'dropdown':
        const optionIndex = Number(answerData.selectedOption);
        
        // Use saved options if available
        if (answerData.allOptions && answerData.allOptions.length > 0) {
          return (
            <div className="space-y-2 max-w-full">
              {answerData.allOptions.map((option, optIdx) => {
                const optionText = typeof option === 'object' ? option.text : option;
                const isSelected = optIdx === optionIndex || String(optIdx) === answerData.selectedOption;
                
                return (
                  <div key={optIdx} className={`flex items-start gap-2 ${isSelected ? 'font-medium' : 'text-gray-500'}`}>
                    <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border ${isSelected ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    </div>
                    <span className="break-words flex-1 min-w-0">{optionText}</span>
                    {isSelected && <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
                  </div>
                );
              })}
            </div>
          );
        }
        
        // Fall back to section data if needed
        const dropQuestion = sectionData?.questions?.find(q => q.id === answerData.questionId);
        if (dropQuestion && dropQuestion.options) {
          const optionText = dropQuestion.options[optionIndex]?.text || 
                            dropQuestion.options[optionIndex] || 
                            `Option ${optionIndex}`;
          return optionText;
        }
        
        return `Selected option: ${answerData.selectedOption}`;
        
      case 'true_false':
        // Use saved options if available
        if (answerData.allOptions && answerData.allOptions.length > 0) {
          return (
            <div className="space-y-2 max-w-full">
              <div className={`flex items-start gap-2 ${answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 'font-medium' : 'text-gray-500'}`}>
                <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border ${answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                  {(answerData.selectedOption === 0 || answerData.selectedOption === "0") && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
                <span className="break-words flex-1 min-w-0">{answerData.allOptions[0] || "True"}</span>
                {(answerData.selectedOption === 0 || answerData.selectedOption === "0") && 
                  <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
              </div>
              <div className={`flex items-start gap-2 ${answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 'font-medium' : 'text-gray-500'}`}>
                <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border ${answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                  {(answerData.selectedOption === 1 || answerData.selectedOption === "1") && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
                <span className="break-words flex-1 min-w-0">{answerData.allOptions[1] || "False"}</span>
                {(answerData.selectedOption === 1 || answerData.selectedOption === "1") && 
                  <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
              </div>
            </div>
          );
        }
        
        // Default display if options not saved
        return answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 
              "True" : 
              answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 
              "False" : "No selection";
        
      case 'yes_no':
        // Use saved options if available
        if (answerData.allOptions && answerData.allOptions.length > 0) {
          return (
            <div className="space-y-2 max-w-full">
              <div className={`flex items-start gap-2 ${answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 'font-medium' : 'text-gray-500'}`}>
                <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border ${answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                  {(answerData.selectedOption === 0 || answerData.selectedOption === "0") && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
                <span className="break-words flex-1 min-w-0">{answerData.allOptions[0] || "Yes"}</span>
                {(answerData.selectedOption === 0 || answerData.selectedOption === "0") && 
                  <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
              </div>
              <div className={`flex items-start gap-2 ${answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 'font-medium' : 'text-gray-500'}`}>
                <div className={`w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center rounded-full border ${answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}>
                  {(answerData.selectedOption === 1 || answerData.selectedOption === "1") && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                </div>
                <span className="break-words flex-1 min-w-0">{answerData.allOptions[1] || "No"}</span>
                {(answerData.selectedOption === 1 || answerData.selectedOption === "1") && 
                  <span className="text-xs text-blue-600 flex-shrink-0">(Selected)</span>}
              </div>
            </div>
          );
        }
        
        // Default display if options not saved
        return answerData.selectedOption === 0 || answerData.selectedOption === "0" ? 
              "Yes" : 
              answerData.selectedOption === 1 || answerData.selectedOption === "1" ? 
              "No" : "No selection";
        
      case 'file_upload':          
        // Check if we have a filename in the answer
        if (!answerData || (!answerData.fileName && !answerData.uploadedName)) {
          return <p className="text-gray-500 italic">No file uploaded</p>;
        }
        
        // use fileresult renderer to display the file
        const fileData = {
          uploadedName: answerData.fileName || answerData.uploadedName,
          fileType: answerData.fileType,
          name: answerData.fileName ? 
            answerData.fileName.split('/').pop() : 
            (answerData.uploadedName ? answerData.uploadedName.split('/').pop() : 'file')
        };
        
        return <FileResultRenderer answer={fileData} user={user} />;
        
      case 'short_answer':
        const textValue = answerData.textValue || "No text provided";
        
        // If the text is short, just return it directly
        if (textValue.length <= 150) return <div className="break-words">{textValue}</div>;
        
        // For longer text, return a component with show more/less toggle
        return (
          <div>
            <div className={`${expandedDescriptions[`answer-${answerData.questionId}`] ? '' : 'line-clamp-3'} break-words overflow-hidden max-w-full`}>
              {textValue}
            </div>
            <button
              type="button"
              onClick={() => toggleDescriptionExpanded(`answer-${answerData.questionId}`)}
              className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
            >
              {expandedDescriptions[`answer-${answerData.questionId}`] ? 'Show less' : 'Show more'}
            </button>
          </div>
        );
        
      case 'info_block':
      case 'information':
        // For informational questions, check if acknowledgment was required
        if (answerData.acknowledged !== undefined) {
          return answerData.acknowledged ? "Acknowledged" : "Not acknowledged";
        }
        // If no acknowledgment data, this is just informational content
        return null;
        
      default:
        return JSON.stringify(answerData);
    }
  };

  // Get question title and text from the answer if available
  const questionTitle = answer?.questionTitle || question.title || question.question || `Question`;
  const questionText = answer?.questionText || question.text || '';
  const questionDescription = answer?.description || question.description || '';
  const isImportant = isImportantQuestion(question);
  const isCorrect = answer ? isAnswerCorrect(question, answer) : null;
  const isInfoQuestion = isInformationalQuestion(question.type);

  return (
    <div 
      className={`p-3 sm:p-4 mb-4 rounded-lg mx-0 ${isImportant ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}
      style={{ maxWidth: '100%', overflowX: 'hidden' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
        <div className="flex-1 min-w-0"> {/* min-w-0 allows flex child to shrink */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {isImportant && (
                <Tooltip title="Important Question">
                  <FlagOutlined className="text-yellow-500 flex-shrink-0" />
                </Tooltip>
              )}
              <h3 className="font-medium text-gray-900 break-words flex-1 min-w-0">
                {questionTitle}
              </h3>
              <QuestionTypeTag type={question.type} />
            </div>
            {/* Question text - mobile responsive */}
            {!isCollapsed && questionText && questionText !== questionTitle && (
              <p className="mt-1 text-gray-700 break-words">{questionText}</p>
            )}
          </div>
        </div>
        
        {/* Collapse/Expand Button */}
        <Button 
          type="text"
          icon={isCollapsed ? <DownOutlined /> : <UpOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(question.id);
          }}
          size="small"
          className="flex-shrink-0"
        />
      </div>
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-3">
          {/* Question description */}
          {questionDescription && (
            <div className="text-gray-600 text-sm">
              <div 
                className={`${expandedDescriptions[question.id] ? '' : 'line-clamp-3'} break-words`}
                dangerouslySetInnerHTML={{ __html: questionDescription }}
              />
              {questionDescription.length > 100 && (
                <button
                  type="button"
                  onClick={() => toggleDescriptionExpanded(question.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs mt-1 font-medium"
                >
                  {expandedDescriptions[question.id] ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Only show answer section for non-informational questions OR when there's actual answer data */}
          {(!isInfoQuestion || (answer && getAnswerValue(question.type, answer) !== null)) && (
            <>
              <Divider className="my-2" />

              {/* Answer container */}
              <div className="bg-white p-3 rounded border overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <div className="text-gray-600 text-sm">
                    {isInfoQuestion ? "Status:" : "Answer:"}
                  </div>
                  
                  {/* Tags container - wrap on mobile */}
                  <div className="flex flex-wrap gap-1">
                    {/* Correctness indicators */}
                    {answer && isCorrect !== null && (
                      <Tag color={isCorrect ? "success" : "error"} icon={isCorrect ? <CheckOutlined /> : <CloseOutlined />}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </Tag>
                    )}
                    
                    {/* Review needed tag */}
                    {answer && 
                    (answer.flaggedForReview || 
                      (question.type === 'short_answer' && !answer.hasOwnProperty('isCorrect')) || 
                      (question.type === 'file_upload' && !answer.hasOwnProperty('isCorrect'))) && (
                        <Tag color="warning" icon={<QuestionCircleOutlined />}>Needs Review</Tag>
                    )}
                  </div>
                </div>
                
                {/* Answer content */}
                <div className="mt-1 break-words overflow-hidden">
                  {answer ? (
                    (() => {
                      const answerValue = getAnswerValue(question.type, answer);
                      return answerValue !== null ? answerValue : (
                        <p className="text-gray-500 italic">
                          {isInfoQuestion ? "No interaction required" : "No answer provided"}
                        </p>
                      );
                    })()
                  ) : (
                    <p className="text-gray-500 italic">
                      {isInfoQuestion ? "No interaction required" : "No answer provided"}
                    </p>
                  )}
                </div>
                
                {/* Correct answer reference */}
                {isCorrect === false && answer && question.correctAnswer && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <p className="text-gray-600 text-sm">Correct answer:</p>
                    <p className="text-green-600 break-words">{question.correctAnswer}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const SectionRenderer = ({ 
  section, 
  answers, 
  collapsedQuestions, 
  onToggleCollapsed 
}) => {
  // Enrich questions with their corresponding answers
  const enrichedQuestions = useMemo(() => {
    return section.questions.map(question => ({
      ...question,
      answer: answers[question.id] // Attach the corresponding answer
    }));
  }, [section.questions, answers]);

  const [filteredQuestions, setFilteredQuestions] = useState(enrichedQuestions);
  const [currentPage, setCurrentPage] = useState(1);
  const QUESTIONS_PER_PAGE = 10; // Default number of questions per page

  // Handle filter application
  const handleFilterApplied = React.useCallback((filtered) => {
    setFilteredQuestions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Paginate the filtered questions
  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  // No questions handling
  if (!section.questions || section.questions.length === 0) {
    return <Empty description="No questions in this section" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <div className="overflow-hidden">
      {/* Filter Component */}
      <QuestionResponseFilter 
        questions={enrichedQuestions} 
        onFilterApplied={handleFilterApplied} 
      />

      {/* Filtered Questions Rendering */}
      {filteredQuestions.length === 0 ? (
        <Empty 
          description="No questions match your current filters" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      ) : (
        <>
          {paginatedQuestions.map((question, index) => {
            const answer = answers[question.id];
            const isCollapsed = collapsedQuestions[question.id];
            
            return (
              <QuestionResponseRenderer
                key={question.id || index}
                question={question}
                answer={answer}
                sectionData={section}
                isCollapsed={isCollapsed}
                onToggleCollapse={onToggleCollapsed}
              />
            );
          })}

          {/* Pagination Component - mobile responsive */}
          <div className="flex justify-center mt-4">
            <Pagination
              current={currentPage}
              total={filteredQuestions.length}
              pageSize={QUESTIONS_PER_PAGE}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} questions`}
              size="small"
              responsive
            />
          </div>
        </>
      )}
    </div>
  );
};

// Export the components
export { 
  QuestionResponseRenderer, 
  SectionRenderer, 
  QuestionResponseFilter 
};