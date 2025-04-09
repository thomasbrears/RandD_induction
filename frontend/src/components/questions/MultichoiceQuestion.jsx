import { FaCheck, FaTimes } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import { getSignedUrl } from "../../api/FileApi";
import { useEffect, useState } from "react";
import { messageWarning} from '../../utils/notificationService';

const MultichoiceQuestion = ({ question }) => {
  const { user, loading: authLoading } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (question.imageFile && !authLoading) {
      const fetchImage = async () => {
        try {
          const result = await getSignedUrl(user, question.imageFile);
          setImageUrl(result.url);
        } catch (err) {
          messageWarning(err.response?.data?.message || "An error occurred");
        }
      };
      fetchImage();
    } else if (!question.imageFile && imageUrl){
      setImageUrl(null);
    }
  }, [user, authLoading, question]);

  const handleExpiredImage = async () => {
    try {
      const result = await getSignedUrl(user, question.imageFile);
      setImageUrl(result.url);
    } catch (err) {
      console.error("Failed to refresh signed URL:", err);
    }
  };

  return (
    <div className="rounded-md bg-white">
      {/* Description */}
      <div className="mb-4 p-3 rounded-md bg-gray-100 border border-gray-200">
        <p className="font-semibold">Description: <span className="font-normal text-gray-500">(optional)</span></p>
        <div className="prose !max-w-none w-full break-words mt-2 text-gray-600">
          <p dangerouslySetInnerHTML={{ __html: question.description || "No description" }} />
        </div>
      </div>

      {/* Image */}
      {imageUrl && (
        <div className="mb-4 p-4 rounded-md bg-gray-100 border border-gray-200 flex justify-center items-center">
          <img
            src={imageUrl}
            alt={question.imageFile}
            onError={handleExpiredImage}
            className="max-w-[500px] w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Validation Settings */}
      <div className="mt-4 mb-4 p-3 rounded-md bg-gray-100 border border-gray-200">
        <p className="font-semibold mb-2">Validation Settings</p>

        {/* Requires Validation */}
        <div className="flex items-center">
          <span className="font-medium text-gray-800">Requires Validation:</span>
          <span className="ml-2 text-gray-700">{question.requiresValidation ? "Yes" : "No"}</span>
        </div>

        {/* Hint (Only shown if validation is required) */}
        {question.requiresValidation && question.hint && (
          <div className="mt-3 pt-2 border-t border-gray-300 flex items-start">
            <div className="mr-2">Hint:</div>
            <div className="text-gray-700 w-full max-w-full break-words whitespace-pre-wrap overflow-hidden">
              {question.hint}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="rounded-md bg-gray-100 border border-gray-200 p-3 mt-4">
        <p className="font-semibold">Options:</p>

        {question.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${question.answers.includes(index) ? "bg-green-100 border-green-500" : "bg-gray-200 border-gray-400"
              }`}
          >
            {/* Correct/Incorrect Signifier */}
            <div
              className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${question.answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                }`}
              title={question.answers.includes(index) ? "Correct answer" : "Incorrect answer"}
            >
              {question.answers.includes(index) ? (
                <FaCheck className="text-white w-5 h-5" />
              ) : (
                <FaTimes className="text-white w-5 h-5" />
              )}
            </div>

            {/* Option Text */}
            <div className="text-gray-600 flex-1 break-words min-w-0">{option}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultichoiceQuestion;