export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
	const res: Response = await fetch(dataUrl);
	const blob: Blob = await res.blob();
	return new File([blob], fileName, { type: 'image/jpeg' });
}

/**
 * Downloads a remote image (e.g. one scraped from a product page) and returns
 * it as a `data:` URL so it can go through the normal upload path. Returns
 * undefined when the browser can't read it - most commonly because the remote
 * host doesn't send CORS headers - rather than throwing, so callers can decide
 * how to tell the user.
 */
export async function remoteUrlToDataUrl(url: string): Promise<string | undefined> {
	try {
		const res = await fetch(url, { mode: 'cors' });
		if (!res.ok) return undefined;

		const blob = await res.blob();
		if (!blob.type.startsWith('image/')) return undefined;

		return await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(blob);
		});
	} catch {
		return undefined;
	}
}
