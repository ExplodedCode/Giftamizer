import * as React from 'react';

import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';

import { Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Strikethrough } from 'lucide-react';

import { uploadImage } from '../lib/imgbb';
import { enqueueSnackbar } from '../lib/snackbar';
import { cn } from '../lib/utils';
import { SimpleTooltip } from './ui/tooltip';

type RichTextEditorProps = {
	placeholder?: string;
	/** Called with the current content serialized as markdown (images as ![](url)). */
	onChangeMarkdown: (markdown: string) => void;
	className?: string;
};

/**
 * TipTap-based rich text editor — replaces the vendored MUI/draft-js editor.
 * Used by the Support issue composer: content is serialized to markdown for
 * the GitHub issue body, and inline images are uploaded to imgbb so their
 * public URLs render on GitHub.
 */
export default function RichTextEditor({ placeholder = 'Description...', onChangeMarkdown, className }: RichTextEditorProps) {
	const [uploading, setUploading] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

	const insertImage = React.useCallback(
		async (file: File | Blob, editorInstance: NonNullable<ReturnType<typeof useEditor>>) => {
			setUploading(true);
			try {
				const url = await uploadImage(file);
				editorInstance.chain().focus().setImage({ src: url }).run();
			} catch (error) {
				console.error('Image upload failed', error);
				enqueueSnackbar('Image upload failed!', { variant: 'error' });
			} finally {
				setUploading(false);
			}
		},
		[]
	);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				link: {
					openOnClick: false,
				},
			}),
			Image,
			Placeholder.configure({ placeholder }),
			Markdown,
		],
		editorProps: {
			attributes: {
				class: 'focus:outline-none min-h-[160px] px-3 py-2 text-sm',
			},
			handlePaste: (view, event) => {
				const items = event.clipboardData?.items;
				if (items) {
					for (let i = 0; i < items.length; i++) {
						if (items[i].type.startsWith('image/')) {
							const blob = items[i].getAsFile();
							if (blob && editor) {
								insertImage(blob, editor);
								return true;
							}
						}
					}
				}
				return false;
			},
			handleDrop: (view, event) => {
				const files = event.dataTransfer?.files;
				if (files && files.length > 0 && files[0].type.startsWith('image/') && editor) {
					event.preventDefault();
					insertImage(files[0], editor);
					return true;
				}
				return false;
			},
		},
		onUpdate: ({ editor: editorInstance }) => {
			onChangeMarkdown((editorInstance.storage as any).markdown.getMarkdown());
		},
	});

	const editorState = useEditorState({
		editor,
		selector: (ctx) => ({
			bold: ctx.editor?.isActive('bold') ?? false,
			italic: ctx.editor?.isActive('italic') ?? false,
			strike: ctx.editor?.isActive('strike') ?? false,
			h2: ctx.editor?.isActive('heading', { level: 2 }) ?? false,
			h3: ctx.editor?.isActive('heading', { level: 3 }) ?? false,
			bulletList: ctx.editor?.isActive('bulletList') ?? false,
			orderedList: ctx.editor?.isActive('orderedList') ?? false,
			blockquote: ctx.editor?.isActive('blockquote') ?? false,
			codeBlock: ctx.editor?.isActive('codeBlock') ?? false,
			link: ctx.editor?.isActive('link') ?? false,
		}),
	});

	if (!editor) return null;

	const setLink = () => {
		const previous = editor.getAttributes('link').href;
		const url = window.prompt('Link URL', previous ?? 'https://');

		if (url === null) return;
		if (url === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}

		editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
	};

	const toolbarButton = (title: string, active: boolean, onClick: () => void, icon: React.ReactNode, disabled = false) => (
		<SimpleTooltip title={title}>
			<button
				type='button'
				onClick={onClick}
				disabled={disabled}
				className={cn(
					'flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
					active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
				)}
			>
				{icon}
			</button>
		</SimpleTooltip>
	);

	return (
		<div className={cn('rounded-lg border border-input shadow-xs transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30', className)}>
			<div className='flex flex-wrap items-center gap-0.5 border-b border-border p-1'>
				{toolbarButton('Bold', editorState?.bold ?? false, () => editor.chain().focus().toggleBold().run(), <Bold />)}
				{toolbarButton('Italic', editorState?.italic ?? false, () => editor.chain().focus().toggleItalic().run(), <Italic />)}
				{toolbarButton('Strikethrough', editorState?.strike ?? false, () => editor.chain().focus().toggleStrike().run(), <Strikethrough />)}

				<div className='mx-1 h-5 w-px bg-border' />

				{toolbarButton('Heading', editorState?.h2 ?? false, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 />)}
				{toolbarButton('Subheading', editorState?.h3 ?? false, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 />)}

				<div className='mx-1 h-5 w-px bg-border' />

				{toolbarButton('Bullet List', editorState?.bulletList ?? false, () => editor.chain().focus().toggleBulletList().run(), <List />)}
				{toolbarButton('Numbered List', editorState?.orderedList ?? false, () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered />)}
				{toolbarButton('Quote', editorState?.blockquote ?? false, () => editor.chain().focus().toggleBlockquote().run(), <Quote />)}
				{toolbarButton('Code Block', editorState?.codeBlock ?? false, () => editor.chain().focus().toggleCodeBlock().run(), <Code />)}

				<div className='mx-1 h-5 w-px bg-border' />

				{toolbarButton('Link', editorState?.link ?? false, setLink, <Link2 />)}
				{toolbarButton('Upload Image', false, () => fileInputRef.current?.click(), uploading ? <Loader2 className='animate-spin' /> : <ImagePlus />, uploading)}

				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					className='hidden'
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) insertImage(file, editor);
						e.target.value = '';
					}}
				/>
			</div>

			<EditorContent
				editor={editor}
				className={cn(
					'[&_.tiptap>*+*]:mt-2',
					'[&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold',
					'[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6',
					'[&_.tiptap_blockquote]:border-l-2 [&_.tiptap_blockquote]:border-border [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:text-muted-foreground',
					'[&_.tiptap_pre]:rounded-md [&_.tiptap_pre]:bg-muted [&_.tiptap_pre]:p-2 [&_.tiptap_pre]:font-mono [&_.tiptap_pre]:text-xs',
					'[&_.tiptap_code]:rounded [&_.tiptap_code]:bg-muted [&_.tiptap_code]:px-1 [&_.tiptap_code]:font-mono [&_.tiptap_code]:text-xs',
					'[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md',
					'[&_.tiptap_p.is-editor-empty:first-child]:before:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child]:before:float-left [&_.tiptap_p.is-editor-empty:first-child]:before:h-0 [&_.tiptap_p.is-editor-empty:first-child]:before:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]'
				)}
			/>
		</div>
	);
}
