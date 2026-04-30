// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement;
		first<T = Record<string, unknown>>(): Promise<T | null>;
		all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
		run(): Promise<{ meta?: { last_row_id?: number } }>;
	}

	interface D1Database {
		prepare(query: string): D1PreparedStatement;
		batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
			};
		}
	}
}

export {};
