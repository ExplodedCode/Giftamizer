import type { SupabaseClient } from '@supabase/supabase-js';

export type SupabaseContextType = {
	sb: SupabaseClient | null;
};

// export type SelectArg =
// 	| string
// 	| {
// 			str: string;
// 			head?: boolean;
// 			count?: null | 'exact' | 'planned' | 'estimated';
// 	  };
