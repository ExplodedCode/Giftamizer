import * as React from 'react';
import { Check } from 'lucide-react';

import { cn } from '../../lib/utils';

type StepperProps = {
	steps: string[];
	activeStep: number;
	className?: string;
};

/**
 * Horizontal stepper (SignUp) — purely presentational; step state lives in
 * the consuming page, matching the old MUI Stepper usage.
 */
function Stepper({ steps, activeStep, className }: StepperProps) {
	return (
		<div className={cn('flex w-full items-center', className)}>
			{steps.map((label, index) => {
				const completed = index < activeStep;
				const active = index === activeStep;
				return (
					<React.Fragment key={label}>
						{index > 0 && <div className={cn('mx-2 h-px flex-1 transition-colors', completed || active ? 'bg-primary' : 'bg-border')} />}
						<div className='flex items-center gap-2'>
							<span
								className={cn(
									'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
									completed || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
								)}
							>
								{completed ? <Check className='size-3.5' /> : index + 1}
							</span>
							<span className={cn('text-sm whitespace-nowrap', active ? 'font-semibold' : completed ? 'font-medium' : 'text-muted-foreground')}>{label}</span>
						</div>
					</React.Fragment>
				);
			})}
		</div>
	);
}

type VerticalStepperStep = {
	label: React.ReactNode;
	content: React.ReactNode;
	optional?: React.ReactNode;
};

/**
 * Vertical stepper with inline step content (SecretSantaSetup wizard).
 */
function VerticalStepper({ steps, activeStep, className }: { steps: VerticalStepperStep[]; activeStep: number; className?: string }) {
	return (
		<div className={cn('flex flex-col', className)}>
			{steps.map((step, index) => {
				const completed = index < activeStep;
				const active = index === activeStep;
				const last = index === steps.length - 1;
				return (
					<div key={index} className='flex gap-3'>
						<div className='flex flex-col items-center'>
							<span
								className={cn(
									'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
									completed || active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
								)}
							>
								{completed ? <Check className='size-3.5' /> : index + 1}
							</span>
							{!last && <div className={cn('my-1 w-px flex-1 transition-colors', completed ? 'bg-primary' : 'bg-border')} />}
						</div>
						<div className={cn('flex min-w-0 flex-1 flex-col pb-4', last && 'pb-0')}>
							<div className={cn('flex min-h-6 items-center text-sm', active ? 'font-semibold' : completed ? 'font-medium' : 'text-muted-foreground')}>
								{step.label}
								{step.optional && <span className='ml-2 text-xs font-normal text-muted-foreground'>{step.optional}</span>}
							</div>
							{active && <div className='mt-2'>{step.content}</div>}
						</div>
					</div>
				);
			})}
		</div>
	);
}

export { Stepper, VerticalStepper };
