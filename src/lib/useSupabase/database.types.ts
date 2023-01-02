export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
	public: {
		Tables: {
			test: {
				Row: {
					id: number;
					name: string;
					created_at: Date;
				}; // The data expected to be returned from a "select" statement.
				Insert: {
					name: string;
				}; // The data expected passed to an "insert" statement.
				Update: {
					name: string;
				}; // The data expected passed to an "update" statement.
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
