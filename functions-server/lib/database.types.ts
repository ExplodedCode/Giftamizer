export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					created_at: string | null;
					email: string;
					name: string;
					avatar_token: number;
					user_id: string;
				};
				Insert: {
					created_at?: string | null;
					email: string;
					name: string;
					avatar_token: number;
					user_id: string;
				};
				Update: {
					created_at?: string | null;
					email?: string;
					name?: string;
					avatar_token?: number;
					user_id?: string;
				};
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
	};
}
