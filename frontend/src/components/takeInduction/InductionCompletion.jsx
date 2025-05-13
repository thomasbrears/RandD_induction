import React, { useState } from 'react';
import PropTypes from 'prop-types';

const InductionCompletion = ({ 
  answeredQuestions, 
  questions, 
  onBackToQuestions, 
  onBackToSpecificQuestion,
  onSubmit, 
  isSubmitting 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Calculate completion statistics
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answeredQuestions).length;
  const percentComplete = Math.round((answeredCount / totalQuestions) * 100);
  const isFullyComplete = percentComplete === 100;
  
  // Find any unanswered questions (excluding information type)
  const unansweredQuestions = questions
    .filter(q => q.type !== 'INFORMATION' && !answeredQuestions[q.id])
    .map((q, index) => ({
      index: questions.findIndex(question => question.id === q.id) + 1,
      id: q.id,
      question: q.question
    }));
    
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-5">
        <h2 className="text-xl font-semibold mb-4">Ready to Submit</h2>
        
        {/* Status banner */}
        {isFullyComplete ? (
          <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-green-800 font-medium">
                  All questions completed! You've finished the induction and your answers are ready to be submitted.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-amber-800 font-medium">
                  You have {unansweredQuestions.length} unanswered {unansweredQuestions.length === 1 ? 'question' : 'questions'}. 
                  You can still submit, but consider reviewing your answers first.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Total Questions</p>
            <p className="text-xl font-bold">{totalQuestions}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Questions Answered</p>
            <p className="text-xl font-bold">
              <span className={!isFullyComplete ? 'text-amber-600' : ''}>{answeredCount}</span>
            </p>
          </div>
        </div>
        
        {/* Completion progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Completion</span>
            <span className="text-sm font-medium text-gray-700">{percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`${isFullyComplete ? 'bg-green-600' : 'bg-amber-500'} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>
        
        {/* Unanswered questions section - shows only if there are unanswered questions */}
        {unansweredQuestions.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex w-full items-center justify-between p-3 text-left bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="font-medium text-gray-700">
                Unanswered Questions ({unansweredQuestions.length})
              </span>
              <svg 
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? 'transform rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expanded && (
              <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-white">
                <ul className="divide-y divide-gray-200">
                  {unansweredQuestions.map((q) => (
                    <li key={q.id} className="py-3">
                      <button
                        type="button"
                        onClick={() => onBackToSpecificQuestion(q.index - 1)}
                        className="w-full text-left group"
                      >
                        <div className="flex items-start">
                          <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 text-sm mr-3">
                            {q.index}
                          </span>
                          <span className="text-gray-700 group-hover:text-blue-600 break-words">
                            {q.question}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Information */}
        <div className="text-sm text-gray-600 mb-6">
          <p>
            You can review your answers by clicking "Back to Questions" or submit now if you're ready.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
          <button
            type="button"
            onClick={onBackToQuestions}
            className="px-5 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 font-medium order-2 sm:order-1"
          >
            Back to Questions
          </button>
          
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className={`px-5 py-3 rounded-lg bg-blue-600 text-white font-medium order-1 sm:order-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : 'Confirm & Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

InductionCompletion.propTypes = {
  answeredQuestions: PropTypes.object.isRequired,
  questions: PropTypes.array.isRequired,
  onBackToQuestions: PropTypes.func.isRequired,
  onBackToSpecificQuestion: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default InductionCompletion;