import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered 
} from "lucide-react";

import "../style/ContentRichEditor.css";
import "../style/Tiptap.css";

export default function ContentRichEditor({ content, onChange }) {
    const maxContentLength = 2000;

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // disable to configure separately
                bulletList: false, // disable to configure separately
                orderedList: false, // disable to configure separately
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
                defaultAlignment: 'left',
            }),
            Heading.configure({
                levels: [1, 2, 3],
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                },
            }),
            BulletList,
            OrderedList,
            CharacterCount.configure({
                limit: maxContentLength,
            }),
            Placeholder.configure({
                emptyEditorClass: 'is-editor-empty',
                placeholder: 'Start typing your content here...',
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
    
        // cancelled
        if (url === null) {
            return;
        }
    
        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
    
        // update link
        editor.chain().focus().extendMarkRange('link')
            .setLink({ href: url, target: '_blank' }).run();
    };

    return (
        <>
            <div className="prose mt-2 !max-w-none border border-gray-300 w-full rounded">
                {/* Toolbar */}
                <div className="border-b p-2 bg-slate-50 flex flex-wrap gap-1 items-center">
                    {/* Text Formatting Group */}
                    <div className="flex space-x-1 border-r pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive("bold") ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Bold"
                        >
                            <Bold className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive("italic") ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Italic"
                        >
                            <Italic className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive("underline") ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Underline"
                        >
                            <UnderlineIcon className="size-4" />
                        </button>
                    </div>

                    {/* Alignment Group */}
                    <div className="flex space-x-1 border-r pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'left' }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Align Left"
                        >
                            <AlignLeft className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'center' }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Align Center"
                        >
                            <AlignCenter className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'right' }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Align Right"
                        >
                            <AlignRight className="size-4" />
                        </button>
                    </div>

                    {/* Headings Group */}
                    <div className="flex space-x-1 border-r pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 1 }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Heading 1"
                        >
                            <Heading1 className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 2 }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Heading 2"
                        >
                            <Heading2 className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('heading', { level: 3 }) ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Heading 3"
                        >
                            <Heading3 className="size-4" />
                        </button>
                    </div>

                    {/* Lists Group */}
                    <div className="flex space-x-1 border-r pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Bullet List"
                        >
                            <List className="size-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Numbered List"
                        >
                            <ListOrdered className="size-4" />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex space-x-1">
                        <button
                            onClick={setLink}
                            className={`p-1.5 rounded hover:bg-gray-200 ${editor?.isActive('link') ? "bg-blue-100 text-blue-600" : "text-gray-700"}`}
                            title="Insert Link"
                        >
                            <LinkIcon className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <EditorContent
                    editor={editor}
                    className="w-full p-4 text-base min-h-[200px] focus:outline-none focus:ring-0 focus:border-0"
                />
            </div>
            
            {/* Character Counter */}
            <p className={`text-sm mt-1 ${editor.storage.characterCount.characters() >= maxContentLength * 0.9 ? 
                (editor.storage.characterCount.characters() === maxContentLength ? "text-red-500" : "text-orange-500") 
                : "text-gray-500"}`}>
                {editor.storage.characterCount.characters()}/{maxContentLength} characters
                {editor.storage.characterCount.characters() >= maxContentLength * 0.9 && 
                    editor.storage.characterCount.characters() < maxContentLength && 
                    " (approaching limit)"}
            </p>
        </>
    );
};