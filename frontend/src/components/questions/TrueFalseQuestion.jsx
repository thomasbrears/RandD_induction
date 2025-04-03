import {FaCheck, FaTimes } from "react-icons/fa";

const TrueFalseQuestion = ({ question }) => {

  return (
    <div className="rounded-md bg-white">
      {/* Description */}
      <div className="mb-4 p-3 rounded-md bg-gray-100 border border-gray-200">
        <p className="font-semibold">Description: <span className="font-normal text-gray-500">(optional)</span></p>
        <div className="prose !max-w-none w-full break-words mt-2 text-gray-600">
          <p dangerouslySetInnerHTML={{ __html: question.description || "No description" }} />
        </div>
      </div>

      {/* Options (True/False) */}
      <div className="rounded-md bg-gray-100 border border-gray-200 p-3 mt-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold">Options:</p>
        </div>

        {question.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${question.answers.length > 0 && question.answers[0] === index
              ? "bg-green-100 border-green-500"
              : "bg-gray-200 border-gray-400"
              }`}
          >
            {/*Correct/Incorrect Signifier*/}
            <div
              className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${question.answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                }`}
              title={
                question.answers.includes(index) ? "Correct answer" : "Incorrect answer"
              }
            >
              <span className="group">
                {question.answers.includes(index) ? (
                  <FaCheck className="text-white w-5 h-5" />
                ) : (
                  <FaTimes className="text-white w-5 h-5" />
                )}
              </span>
            </div>

            <span className="text-gray-700 text-base">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;