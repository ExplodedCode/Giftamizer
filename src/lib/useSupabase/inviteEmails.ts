// The invite edge function answers 429 when an email wasn't sent because of a
// rate limit. The invite (or Secret Santa drawing) itself still went through.
export interface UnsentInviteEmail {
	name: string;
	reason: string;
}

// Undefined unless `error` (from client.functions.invoke) is a rate limit.
export const getUnsentInviteEmail = async (error: any, name: string): Promise<UnsentInviteEmail | undefined> => {
	if (error?.context?.status !== 429) return undefined;

	let reason = 'The invite email limit has been reached.';
	try {
		const body = await error.context.json();
		if (typeof body?.message === 'string') reason = body.message;
	} catch {
		// keep the default reason
	}
	return { name, reason };
};

// One message per reason, so a long list of people doesn't become a stack of snackbars.
export const describeUnsentInviteEmails = (unsent: UnsentInviteEmail[]): string[] =>
	[...new Set(unsent.map((u) => u.reason))].map((reason) => {
		const names = unsent.filter((u) => u.reason === reason).map((u) => u.name);
		const others = names.length - 3;
		const shown = others > 0 ? `${names.slice(0, 3).join(', ')} and ${others} other${others === 1 ? '' : 's'}` : names.join(', ');
		return `No email was sent to ${shown}. ${reason}`;
	});
