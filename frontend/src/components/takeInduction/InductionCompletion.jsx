import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component for the final review and submission screen
 */
const InductionCompletion = ({ 
  answeredQuestions, 
  questions, 
  onBackToQuestions, 
  onSubmit, 
  isSubmitting 
}) => {
  return (
    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Ready to Submit</h2>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
        <p className="text-blue-800">
          <span className="font-semibold">All questions completed!</span> You've finished the induction and your answers are ready to be submitted.
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold text-lg">Summary:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Total Questions</p>
            <p className="font-bold">{questions.length}</p>
          </div>
          
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-sm text-gray-600">Questions Answered</p>
            <p className="font-bold">{Object.keys(answeredQuestions).length}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBackToQuestions}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50"
        >
          Back to Questions
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`px-6 py-3 bg-gray-800 text-white rounded-md ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  );
};

InductionCompletion.propTypes = {
  answeredQuestions: PropTypes.object.isRequired,
  questions: PropTypes.array.isRequired,
  onBackToQuestions: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired
};

export default InductionCompletion;