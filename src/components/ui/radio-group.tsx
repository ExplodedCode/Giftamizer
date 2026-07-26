import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '../../lib/utils';

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
	return <RadioGroupPrimitive.Root data-slot='radio-group' className={cn('grid gap-2', className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
	return (
		<RadioGroupPrimitive.Item
			data-slot='radio-group-item'
			className={cn(
				'aspect-square size-4 cursor-pointer rounded-full border border-input text-primary shadow-xs transition-colors outline-none',
				'focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary',
				className
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator className='relative flex items-center justify-center'>
				<Circle className='size-2 fill-primary text-primary' />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	);
}

export { RadioGroup, RadioGroupItem };
