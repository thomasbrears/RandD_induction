import { useState, useEffect } from "react";

const ShortAnswerQuestion = ({ question }) => {

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
        </div >
    );
};

export default ShortAnswerQuestion;