import { FaCheck, FaTimes } from "react-icons/fa";
import { messageWarning } from '../../utils/notificationService';
import useAuth from "../../hooks/useAuth";
import { getSignedUrl } from "../../api/FileApi";
import { useEffect, useState } from "react";

const DropdownQuestion = ({ question }) => {
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

      {/* Options */}
      <div className="rounded-md bg-gray-100 border border-gray-200 p-3 mt-4">
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