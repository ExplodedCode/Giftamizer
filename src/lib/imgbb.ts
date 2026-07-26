/**
 * Uploads an image to imgbb and returns its public URL.
 *
 * Used by the Support issue editor: uploaded/pasted images are embedded as
 * markdown image URLs in the GitHub issue body, so the host must be publicly
 * reachable (imgbb is; Supabase storage buckets here are private).
 *
 * The key is a client-exposed imgbb key (it was previously hardcoded in the
 * vendored rich text editor); override via REACT_APP_IMGBB_KEY if needed.
 */
const IMGBB_KEY = import.meta.env.REACT_APP_IMGBB_KEY ?? '4907da253c49ac2568239bc7c125bea7';

export async function uploadImage(file: File | Blob): Promise<string> {
	const base64Url = await new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
	const base64Data = base64Url.split(',')[1] || base64Url;

	const formData = new FormData();
	formData.append('key', IMGBB_KEY);
	formData.append('image', base64Data);
	formData.append('name', (file as File).name || 'clipboard.png');

	const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
	if (!response.ok) throw new Error(`Image upload failed (${response.status})`);

	const json = await response.json();
	const url: string | undefined = json?.data?.url;
	if (!url) throw new Error('Image upload failed: no URL returned');
	return url;
}
