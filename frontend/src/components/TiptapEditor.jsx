import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon } from "lucide-react";
import "../style/Tiptap.css";

export default function TiptapEditor({ localDescription, handleLocalChange }) {
    const maxDescriptionLength = 500;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ bold: true, italic: true }),
            Underline,
            CharacterCount.configure({
                limit: maxDescriptionLength,
            }),
            Placeholder.configure({
                emptyEditorClass: 'is-editor-empty',
                placeholder: 'Enter Description …',
            }),
        ],
        content: localDescription,
        onUpdate: ({ editor }) => {
            handleLocalChange("description", editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <>
            <div className="prose mt-2 !max-w-none border border-gray-300 w-full">
                {/* Toolbar */}
                <div className="border p-1 mb-1 bg-slate-50 space-x-2 z-50">
                    {/* Bold Button */}
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded ${editor?.isActive("bold") ? "text-blue-600" : "text-gray-700"}`}
                    >
                        <Bold className="size-4" />
                    </button>

                    {/* Italic Button */}
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded ${editor?.isActive("italic") ? "text-blue-600" : "text-gray-700"}`}
                    >
                        <Italic className="size-4" />
                    </button>

                    {/* Underline Button */}
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`p-2 rounded ${editor?.isActive("underline") ? "text-blue-600" : "text-gray-700"}`}
                    >
                        <UnderlineIcon className="size-4" />
                    </button>
                </div>

                {/* Editor */}
                <EditorContent
                    editor={editor}
                    className="w-full p-2 text-base focus:outline-none focus:ring-0 focus:border-0"
                    style={{
                        marginTop: "0",
                        marginBottom: "0",
                        border: "none",
                    }}
                />
                
            </div>
            {/* Character Counter */}
            <p className={`text-sm mt-1 ${editor.storage.characterCount.characters() === maxDescriptionLength ? "text-red-500" : "text-gray-500"}`}>
                {editor.storage.characterCount.characters()}/{maxDescriptionLength} characters
            </p>

        </>
    );
};