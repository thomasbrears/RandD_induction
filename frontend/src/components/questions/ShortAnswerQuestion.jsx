const ShortAnswerQuestion = ({ question }) => {

    return (
        <div className="rounded-md bg-white">
            {/* Description */}
            <div className="mb-4 p-3 rounded-md bg-gray-100 border border-gray-200">
                <p className="font-semibold">Description: <span className="font-normal text-gray-500">(optional)</span></p>
                <div className="prose !max-w-none w-full break-words mt-2 text-gray-600">
                    <p dangerouslySetInnerHTML={{ __html: question.description || "No description" }} />
                </div>
            </div>
        </div >
    );
};

export default ShortAnswerQuestion;