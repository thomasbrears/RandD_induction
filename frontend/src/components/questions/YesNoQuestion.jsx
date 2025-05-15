import { FaCheck, FaTimes } from "react-icons/fa";
import { useEffect, useState } from "react";
import TruncatedDescription from "./TruncatedDescription";

const YesNoQuestion = ({ question, getImageUrl }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        if (question.imageFile) {
            const loadImage = async () => {
                const url = await getImageUrl(question.id);
                setImageUrl(url);
            };

            loadImage();
        } else {
            setImageUrl(null);
        }
    }, [question.imageFile]);

    const handleExpiredImage = async () => {
        if (question.imageFile) {
            const loadImage = async () => {
                const url = await getImageUrl(question.id);
                setImageUrl(url);
            };

            loadImage();
        } else {
            setImageUrl(null);
        }
    };

    return (
        <div className="rounded-md bg-white">
            {/* Description */}
            <div className="mb-4 p-3 rounded-md bg-gray-100 border border-gray-200">
                <p className="font-semibold">Description: <span className="font-normal text-gray-500">(optional)</span></p>
                <div className="mt-2 text-gray-600">
                    <TruncatedDescription description={question.description} maxLength={300} maxHeight={150} />
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

export default YesNoQuestion;