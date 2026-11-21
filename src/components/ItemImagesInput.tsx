import React from 'react';

import { GripVertical, X } from 'lucide-react';

import ImageCropper from './ImageCropper';
import { useSnackbar } from '../lib/snackbar';
import { ItemImageDraft } from '../lib/useSupabase/types';
import { remoteUrlToDataUrl } from '../lib/useSupabase/utils';
import { cn } from '../lib/utils';
import { SimpleTooltip } from './ui/tooltip';

export const MAX_ITEM_IMAGES = 6;

/** A brand-new (not yet persisted) draft image, with a unique client-side identity. */
export const newImageDraft = (url: string, source?: string): ItemImageDraft => ({ url, source, tempId: crypto.randomUUID() });

/**
 * Returns a function that downloads a scraped remote image and adds it to the
 * draft as a `data:` URL, so it gets uploaded on save like any picked image.
 * (Adding the bare remote URL would save an item_images row with no file in
 * storage behind it.) If the remote host blocks the download, the user is
 * told to upload it manually instead.
 */
export function useRemoteImageImport(setImages: React.Dispatch<React.SetStateAction<ItemImageDraft[]>>) {
	const { enqueueSnackbar } = useSnackbar();

	return React.useCallback(
		async (src: string, opts?: { onlyIfEmpty?: boolean; silent?: boolean }) => {
			const dataUrl = await remoteUrlToDataUrl(src);
			if (!dataUrl) {
				if (!opts?.silent) enqueueSnackbar("Couldn't import that image from the website. Save it and upload it manually instead.", { variant: 'warning' });
				return;
			}

			setImages((prev) => {
				if (prev.length >= MAX_ITEM_IMAGES) return prev;
				if (opts?.onlyIfEmpty && prev.length > 0) return prev;
				if (prev.some((i) => i.source === src)) return prev;
				return [...prev, newImageDraft(dataUrl, src)];
			});
		},
		[setImages, enqueueSnackbar]
	);
}

type ItemImagesInputProps = {
	value: ItemImageDraft[];
	onChange: (value: ItemImageDraft[]) => void;
	/** Auto-populates the trailing "add" tile when there are no images yet (e.g. a freshly scraped URL preview). */
	importedImage?: string;
	/** Fires when any child crop dialog opens/closes, so a parent tour can hide its tooltips while one is open. */
	onDialogOpenChange?: (open: boolean) => void;
	tourElement?: string;
};

// A new/not-yet-persisted image has no id yet, so it carries a client-side
// tempId for React keys and drag tracking. (Not its url: that's a huge data:
// string that changes on re-crop, and identical crops would collide.)
const keyOf = (img: ItemImageDraft, index: number) => img.id ?? img.tempId ?? `idx-${index}`;

/**
 * Multi-image picker built by composing one ImageCropper per current image
 * plus a trailing "add" instance - each crop dialog, dropzone and paste
 * handler is reused as-is rather than reimplemented. Reordering is a
 * press-and-drag on each tile's grip handle (pointer events, so it works
 * the same with mouse or touch) rather than the tile itself, so it never
 * competes with the tile's own click-to-crop. The array only reorders once,
 * on drop (not continuously during the drag) - the dragged tile just follows
 * the pointer and the tile currently under it is highlighted as the target,
 * which avoids the array (and everyone's layout) shifting under the pointer
 * mid-gesture.
 */
export default function ItemImagesInput({ value, onChange, importedImage, onDialogOpenChange, tourElement }: ItemImagesInputProps) {
	const containerRef = React.useRef<HTMLDivElement>(null);

	const dragState = React.useRef<{ key: string; pointerId: number; startX: number; startY: number } | null>(null);
	const [dragKey, setDragKey] = React.useState<string | null>(null);
	const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
	const [hoverKey, setHoverKey] = React.useState<string | null>(null);

	const remove = (index: number) => {
		onChange(value.filter((_, i) => i !== index));
	};

	const findTileUnder = (x: number, y: number, excludeKey: string) => {
		const tiles = containerRef.current?.querySelectorAll<HTMLElement>('[data-tile-key]') ?? [];
		return Array.from(tiles)
			.filter((el) => el.dataset.tileKey !== excludeKey)
			.find((el) => {
				const rect = el.getBoundingClientRect();
				return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
			})?.dataset.tileKey;
	};

	const handleDragStart = (e: React.PointerEvent<HTMLButtonElement>, key: string) => {
		if (dragState.current) return;
		e.preventDefault();
		e.currentTarget.setPointerCapture(e.pointerId);
		dragState.current = { key, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY };
		setDragKey(key);
		setDragOffset({ x: 0, y: 0 });
		setHoverKey(null);
	};

	const handleDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== e.pointerId) return;

		setDragOffset({ x: e.clientX - drag.startX, y: e.clientY - drag.startY });
		setHoverKey(findTileUnder(e.clientX, e.clientY, drag.key) ?? null);
	};

	const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
		const drag = dragState.current;
		if (!drag || drag.pointerId !== e.pointerId) return;

		if (hoverKey && hoverKey !== drag.key) {
			const fromIndex = value.findIndex((img, i) => keyOf(img, i) === drag.key);
			const toIndex = value.findIndex((img, i) => keyOf(img, i) === hoverKey);
			if (fromIndex !== -1 && toIndex !== -1) {
				const next = value.slice();
				const [moved] = next.splice(fromIndex, 1);
				next.splice(toIndex, 0, moved);
				onChange(next);
			}
		}

		dragState.current = null;
		setDragKey(null);
		setDragOffset({ x: 0, y: 0 });
		setHoverKey(null);
	};

	return (
		<div ref={containerRef} className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
			{value.map((img, index) => {
				const key = keyOf(img, index);
				const dragging = dragKey === key;
				const isHoverTarget = dragKey !== null && hoverKey === key;

				return (
					<div
						key={key}
						data-tile-key={key}
						className={cn('relative', dragging && 'z-30')}
						style={dragging ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` } : undefined}
					>
						<ImageCropper
							value={img.url || undefined}
							// ImageCropper's own in-dialog clear button calls onChange(undefined); removing a
							// slot is handled by the X badge below instead, so a clear here is a no-op re-crop.
							onChange={(url) => onChange(value.map((v, i) => (i === index ? { ...v, url: url ?? v.url } : v)))}
							onClick={() => onDialogOpenChange?.(true)}
							onClose={() => onDialogOpenChange?.(false)}
							square
							className={cn(
								'aspect-square w-full transition-shadow',
								dragging && 'shadow-lg',
								isHoverTarget && 'outline-2 outline-offset-2 outline-primary'
							)}
							{...(index === 0 ? { tour_element: tourElement } : {})}
						/>

						<SimpleTooltip title='Remove image'>
							<button
								type='button'
								aria-label='Remove image'
								onClick={() => remove(index)}
								className='absolute -top-1.5 -right-1.5 z-10 cursor-pointer rounded-full bg-black/60 p-1 text-white shadow transition-colors hover:bg-black/80'
							>
								<X className='size-3.5' />
							</button>
						</SimpleTooltip>

						{value.length > 1 && (
							<SimpleTooltip title='Drag to reorder'>
								<button
									type='button'
									aria-label='Drag to reorder'
									onPointerDown={(e) => handleDragStart(e, key)}
									onPointerMove={handleDragMove}
									onPointerUp={endDrag}
									onPointerCancel={endDrag}
									className={cn(
										'absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 cursor-grab touch-none rounded-full bg-background p-1 text-muted-foreground shadow ring-1 ring-border transition-colors hover:text-foreground active:cursor-grabbing',
										dragging && 'scale-110 cursor-grabbing text-foreground'
									)}
								>
									<GripVertical className='size-3.5' />
								</button>
							</SimpleTooltip>
						)}
					</div>
				);
			})}

			{value.length < MAX_ITEM_IMAGES && (
				<ImageCropper
					// ImageCropper keeps the last picked image in its own state so reopening it
					// shows that image again. That's right for a tile you're re-cropping but wrong
					// for the "add" tile, so remount it (fresh, empty) after every add/remove.
					key={`add-${value.length}`}
					value={undefined}
					onChange={(url) => {
						if (url) onChange([...value, newImageDraft(url)]);
					}}
					onClick={() => onDialogOpenChange?.(true)}
					onClose={() => onDialogOpenChange?.(false)}
					square
					className='aspect-square w-full'
					importedImage={value.length === 0 ? importedImage : undefined}
					{...(value.length === 0 ? { tour_element: tourElement } : {})}
				/>
			)}
		</div>
	);
}
