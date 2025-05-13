import { createContext, useContext, useReducer } from 'react';
import PropTypes from 'prop-types';

// Create the context
const InductionContext = createContext();

// Initial state
const initialState = {
  // Data states
  induction: null,
  userInduction: null,
  
  // Loading states
  viewState: 'LOADING', // 'LOADING', 'SUCCESS', 'ERROR', 'NOT_FOUND'
  isSubmitting: false,
  errorMessage: null,
  loadAttempts: 0,
  
  // UI states
  started: false,
  currentQuestionIndex: 0,
  showSubmissionScreen: false,
  
  // Answer states
  answers: {},
  answeredQuestions: {},
  answerFeedback: {
    isCorrect: null,
    message: '',
    showFeedback: false
  },
  
  // Progress states
  lastSaved: null,
  imageUrls: {},
};

// Action types
const ACTION_TYPES = {
  SET_INDUCTION_DATA: 'SET_INDUCTION_DATA',
  SET_VIEW_STATE: 'SET_VIEW_STATE',
  SET_ERROR: 'SET_ERROR',
  SET_STARTED: 'SET_STARTED',
  SET_CURRENT_QUESTION: 'SET_CURRENT_QUESTION',
  SET_ANSWER: 'SET_ANSWER',
  SET_ANSWERED_QUESTION: 'SET_ANSWERED_QUESTION',
  SET_ANSWER_FEEDBACK: 'SET_ANSWER_FEEDBACK',
  SET_SHOW_SUBMISSION: 'SET_SHOW_SUBMISSION',
  SET_IS_SUBMITTING: 'SET_IS_SUBMITTING',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  SET_IMAGE_URLS: 'SET_IMAGE_URLS',
  LOAD_SAVED_PROGRESS: 'LOAD_SAVED_PROGRESS',
  RESET_STATE: 'RESET_STATE',
  INCREMENT_LOAD_ATTEMPTS: 'INCREMENT_LOAD_ATTEMPTS',
};

// Reducer function
const inductionReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_INDUCTION_DATA:
      return {
        ...state,
        induction: action.payload.induction,
        userInduction: action.payload.userInduction,
      };
      
    case ACTION_TYPES.SET_VIEW_STATE:
      return {
        ...state,
        viewState: action.payload,
        // When setting to NOT_FOUND - ensure induction is null to prevent errors in components trying to access induction.name
        ...(action.payload === 'NOT_FOUND' ? { induction: null } : {}),
      };
      
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        errorMessage: action.payload,
      };
      
    case ACTION_TYPES.SET_STARTED:
      return {
        ...state,
        started: action.payload,
      };
      
    case ACTION_TYPES.SET_CURRENT_QUESTION:
      return {
        ...state,
        currentQuestionIndex: action.payload,
      };
      
    case ACTION_TYPES.SET_ANSWER:
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
      
    case ACTION_TYPES.SET_ANSWERED_QUESTION:
      return {
        ...state,
        answeredQuestions: {
          ...state.answeredQuestions,
          [action.payload.questionId]: action.payload.isAnswered,
        },
      };
      
    case ACTION_TYPES.SET_ANSWER_FEEDBACK:
      return {
        ...state,
        answerFeedback: action.payload,
      };
      
    case ACTION_TYPES.SET_SHOW_SUBMISSION:
      return {
        ...state,
        showSubmissionScreen: action.payload,
      };
      
    case ACTION_TYPES.SET_IS_SUBMITTING:
      return {
        ...state,
        isSubmitting: action.payload,
      };
      
    case ACTION_TYPES.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.payload,
      };
      
    case ACTION_TYPES.SET_IMAGE_URLS:
      return {
        ...state,
        imageUrls: action.payload,
      };
      
    case ACTION_TYPES.LOAD_SAVED_PROGRESS:
      return {
        ...state,
        answers: action.payload.answers || state.answers,
        currentQuestionIndex: action.payload.currentQuestionIndex !== undefined ? 
          action.payload.currentQuestionIndex : state.currentQuestionIndex,
        answeredQuestions: action.payload.answeredQuestions || state.answeredQuestions,
        lastSaved: action.payload.lastUpdated ? new Date(action.payload.lastUpdated) : state.lastSaved,
      };
      
    case ACTION_TYPES.RESET_STATE:
      return {
        ...initialState,
        induction: state.induction,
        userInduction: state.userInduction,
        imageUrls: state.imageUrls,
        viewState: state.viewState,
      };
    
    case ACTION_TYPES.INCREMENT_LOAD_ATTEMPTS:
      return {
        ...state,
        loadAttempts: state.loadAttempts + 1,
      };
      
    default:
      return state;
  }
};

// Provider component
export const InductionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(inductionReducer, initialState);
  
  // Actions
  const actions = {
    setInductionData: (induction, userInduction) => 
      dispatch({ 
        type: ACTION_TYPES.SET_INDUCTION_DATA, 
        payload: { induction, userInduction } 
      }),
      
    setViewState: (state) => 
      dispatch({ 
        type: ACTION_TYPES.SET_VIEW_STATE, 
        payload: state 
      }),
      
    setError: (message) => 
      dispatch({ 
        type: ACTION_TYPES.SET_ERROR, 
        payload: message 
      }),
      
    setStarted: (started) => 
      dispatch({ 
        type: ACTION_TYPES.SET_STARTED, 
        payload: started 
      }),
      
    setCurrentQuestion: (index) => 
      dispatch({ 
        type: ACTION_TYPES.SET_CURRENT_QUESTION, 
        payload: index 
      }),
      
    setAnswer: (questionId, answer) => 
      dispatch({ 
        type: ACTION_TYPES.SET_ANSWER, 
        payload: { questionId, answer } 
      }),
      
    setAnsweredQuestion: (questionId, isAnswered) => 
      dispatch({ 
        type: ACTION_TYPES.SET_ANSWERED_QUESTION, 
        payload: { questionId, isAnswered } 
      }),
      
    setAnswerFeedback: (feedback) => 
      dispatch({ 
        type: ACTION_TYPES.SET_ANSWER_FEEDBACK, 
        payload: feedback 
      }),
      
    setShowSubmission: (show) => 
      dispatch({ 
        type: ACTION_TYPES.SET_SHOW_SUBMISSION, 
        payload: show 
      }),
      
    setIsSubmitting: (isSubmitting) => 
      dispatch({ 
        type: ACTION_TYPES.SET_IS_SUBMITTING, 
        payload: isSubmitting 
      }),
      
    setLastSaved: (date) => 
      dispatch({ 
        type: ACTION_TYPES.SET_LAST_SAVED, 
        payload: date 
      }),
      
    setImageUrls: (urls) => 
      dispatch({ 
        type: ACTION_TYPES.SET_IMAGE_URLS, 
        payload: urls 
      }),
      
    loadSavedProgress: (progressData) => 
      dispatch({ 
        type: ACTION_TYPES.LOAD_SAVED_PROGRESS, 
        payload: progressData 
      }),
      
    resetState: () => 
      dispatch({ 
        type: ACTION_TYPES.RESET_STATE 
      }),
      
    incrementLoadAttempts: () => 
      dispatch({
        type: ACTION_TYPES.INCREMENT_LOAD_ATTEMPTS
      }),
  };
  
  // Context value to be provided
  const contextValue = {
    state,
    actions,
  };
  
  return (
    <InductionContext.Provider value={contextValue}>
      {children}
    </InductionContext.Provider>
  );
};

InductionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hook to use the context
export const useInduction = () => {
  const context = useContext(InductionContext);
  
  if (!context) {
    throw new Error('useInduction must be used within an InductionProvider');
  }
  
  return context;
};

export default InductionContext;