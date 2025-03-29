import { FaCheck, FaTimes } from "react-icons/fa";

const DropdownQuestion = ({ question }) => {

  return (
    <div className="p-4 rounded-md bg-white">
      {/* Description */}
      <div className="mb-2">
        <div className="flex items-center">
          <p className="font-semibold mr-2">Description: <span className="font-normal text-gray-500">(optional)</span></p>
        </div>

        <div className="prose !max-w-none w-full break-words mt-2">
          <p className="text-base cursor-pointer text-gray-600" dangerouslySetInnerHTML={{ __html: question.description || "No description" }} />
        </div>
      </div>

      {/* Options */}
      <div>
        <div className="flex justify-between items-center">
          <p className="font-semibold">Options:</p>
        </div>

        {question.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${question.answers.includes(index)
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

            {/*Option Text */}
            <div className="text-gray-600 flex-1 break-words min-w-0">
              {option}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropdownQuestion;