import * as React from 'react';
import { Transition } from 'react-transition-group';

import { cn } from '../../lib/utils';

type CollapseProps = {
	in?: boolean;
	children: React.ReactNode;
	className?: string;
	timeout?: number;
	unmountOnExit?: boolean;
	/** Injected by <TransitionGroup> — must be forwarded for exit removal to work. */
	onExited?: () => void;
	appear?: boolean;
	enter?: boolean;
	exit?: boolean;
};

/**
 * Height-animating collapse that implements react-transition-group's child
 * protocol (`in` / `onExited`), so it works as a drop-in child of the
 * existing <TransitionGroup> lists (Navigation pins, group members, etc.) —
 * replaces MUI's <Collapse>.
 */
function Collapse({ in: inProp = false, children, className, timeout = 225, unmountOnExit = false, onExited, appear, enter, exit }: CollapseProps) {
	const nodeRef = React.useRef<HTMLDivElement>(null);

	const setHeight = (height: string) => {
		if (nodeRef.current) nodeRef.current.style.height = height;
	};

	return (
		<Transition
			nodeRef={nodeRef}
			in={inProp}
			timeout={timeout}
			appear={appear}
			enter={enter}
			exit={exit}
			unmountOnExit={unmountOnExit}
			onExited={onExited}
			onEnter={() => setHeight('0px')}
			onEntering={() => setHeight(`${nodeRef.current?.scrollHeight ?? 0}px`)}
			onEntered={() => setHeight('auto')}
			onExit={() => {
				setHeight(`${nodeRef.current?.scrollHeight ?? 0}px`);
				// Force reflow so the exit transition starts from the measured height.
				void nodeRef.current?.getBoundingClientRect();
			}}
			onExiting={() => setHeight('0px')}
		>
			{(state) => (
				<div
					ref={nodeRef}
					style={{ transitionDuration: `${timeout}ms` }}
					className={cn('overflow-hidden transition-[height] ease-in-out', state === 'exited' && !inProp && !unmountOnExit && 'h-0', className)}
				>
					{children}
				</div>
			)}
		</Transition>
	);
}

export { Collapse };
