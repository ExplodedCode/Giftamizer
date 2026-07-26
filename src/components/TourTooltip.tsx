import * as React from 'react';

import { Mask } from '@reactour/mask';
import { useFloating, offset, flip, shift, arrow, autoUpdate, FloatingArrow, FloatingPortal, type Placement } from '@floating-ui/react';

type RectType = {
	bottom: number;
	height: number;
	left: number;
	right: number;
	top: number;
	width: number;
	x: number;
	y: number;
};

interface Props {
	open: boolean;
	anchorEl?: Element | null;
	placement?: Placement;
	content: React.ReactElement;
	allowClick?: boolean;
	mask?: boolean;
	arrow?: boolean;
	backgroundColor?: string;
	color?: string;
}

/**
 * Guided-tour callout anchored to a `[tour-element="..."]` DOM node, with an
 * optional @reactour/mask spotlight. Same prop surface as the old MUI-Popper
 * version; positioning now via @floating-ui/react.
 */
export default function TourTooltip({ open, anchorEl, placement = 'top', content, allowClick = false, mask = false, backgroundColor, color }: Props) {
	const arrowRef = React.useRef<SVGSVGElement | null>(null);
	const [rect, setRect] = React.useState<RectType | undefined>();

	const { refs, floatingStyles, context } = useFloating({
		open,
		placement,
		whileElementsMounted: autoUpdate,
		middleware: [offset(mask ? 14 : 10), flip({ padding: 8 }), shift({ padding: 8, crossAxis: true }), arrow({ element: arrowRef })],
		elements: { reference: anchorEl ?? undefined },
	});

	React.useEffect(() => {
		if (anchorEl) {
			setRect(anchorEl.getBoundingClientRect());
		}
	}, [anchorEl]);

	const bg = backgroundColor ?? 'var(--primary)';
	const fg = color ?? 'var(--primary-foreground)';

	if (!open || !anchorEl || rect === undefined) return null;

	return (
		<>
			{mask && rect && (
				<Mask
					sizes={rect}
					styles={{
						maskArea: (base: any) => ({
							...base,
							rx: 4,
						}),
						highlightedArea: (base: any) => ({
							...base,
							display: allowClick ? 'none' : 'block', // don't allow clicking on highlighted element
						}),
					}}
					padding={6}
				/>
			)}

			<FloatingPortal>
				{/* pointerEvents must be forced: Radix's dismissable layer sets
				    `pointer-events: none` on <body> while a modal Dialog or menu is
				    open, which would otherwise make the tour's own buttons dead for
				    every step anchored inside a dialog. */}
				<div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 100000, pointerEvents: 'auto' }}>
					<div className='max-w-[400px] rounded-xl p-4 text-sm shadow-xl' style={{ backgroundColor: bg, color: fg }}>
						{content}
					</div>
					<FloatingArrow ref={arrowRef} context={context} width={18} height={9} style={{ fill: bg }} />
				</div>
			</FloatingPortal>
		</>
	);
}

/** Standard title/body layout for tour callout content. */
export function TourContent({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<p className='text-base font-semibold'>{title}</p>
			{children && <div className='flex flex-col gap-1'>{children}</div>}
		</div>
	);
}
