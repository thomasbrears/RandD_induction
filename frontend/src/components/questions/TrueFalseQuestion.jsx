
const TrueFalseQuestion = ({ question, onChange }) => {
    return (
      <div className="flex items-center space-x-4">
        <span className="font-medium">{question.question}</span>
        <div className="flex space-x-2">
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name={`tf-${question.id}`}
              checked={question.answer.includes(true)}
              onChange={() => onChange(question.id, [true])}
            />
            <span>True</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name={`tf-${question.id}`}
              checked={question.answer.includes(false)}
              onChange={() => onChange(question.id, [false])}
            />
            <span>False</span>
          </label>
        </div>
      </div>
    );
  };
  
  export default TrueFalseQuestion;