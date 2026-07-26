import * as React from 'react';
import { Bell, UserPlus, type LucideIcon } from 'lucide-react';

/**
 * Notification icons are stored by name in the `notifications` table (written
 * by backend triggers/edge functions). The DB writes exactly two values today:
 * 'GroupAdd' (SQL trigger) and 'gift' (invite edge function — special-cased to
 * the custom GiftIcon at the call site). Unknown names fall back to a bell,
 * matching the old behavior.
 */
const iconMap: Record<string, LucideIcon> = {
	GroupAdd: UserPlus,
};

export function NotificationIcon({ icon, className }: { icon: string | undefined | null; className?: string }) {
	const Icon = icon ? iconMap[icon] ?? Bell : Bell;
	return <Icon className={className} />;
}
