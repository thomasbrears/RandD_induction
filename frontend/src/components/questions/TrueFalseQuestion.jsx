const TrueFalseQuestion = ({ question, onChange }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="font-medium">{question.question}</span>
      <div className="flex space-x-2">
        {question.options.map((option, index) => (
          <label key={index} className="flex items-center space-x-1">
            <input
              type="radio"
              name={`tf-${question.id}`}
              checked={question.answers.includes(index)}
              onChange={() => onChange(question.id, [index])}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;