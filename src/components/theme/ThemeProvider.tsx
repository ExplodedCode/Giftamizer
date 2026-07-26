import * as React from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'giftamizer-theme';

type ThemeContextValue = {
	theme: ThemePreference;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getStoredTheme(): ThemePreference {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	} catch {
		// localStorage unavailable
	}
	return 'system';
}

function getSystemTheme(): ResolvedTheme {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = React.useState<ThemePreference>(getStoredTheme);
	const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(getSystemTheme);

	// Follow OS changes while in system mode.
	React.useEffect(() => {
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = () => setSystemTheme(mql.matches ? 'dark' : 'light');
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	}, []);

	const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

	React.useEffect(() => {
		document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
	}, [resolvedTheme]);

	const setTheme = React.useCallback((next: ThemePreference) => {
		setThemeState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// localStorage unavailable
		}
	}, []);

	const value = React.useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = React.useContext(ThemeContext);
	if (!context) throw new Error('useTheme must be used within ThemeProvider');
	return context;
}
