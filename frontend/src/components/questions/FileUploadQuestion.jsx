import { messageWarning } from '../../utils/notificationService';
import useAuth from "../../hooks/useAuth";
import { getSignedUrl } from "../../api/FileApi";
import { useEffect, useState } from "react";

const FileUploadQuestion = ({ question }) => {
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
    </div >
  );
};

export default FileUploadQuestion;