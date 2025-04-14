
import { apiClient } from "@/hooks/axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
	id: string;
	email: string;
	username: string;
}

interface LoginCredentials {
	email: string;
	password: string;
}

interface RegisterCredentials {
	username: string;
	email: string;
	password: string;
}

interface AuthState {
	// Auth status
	isAuthenticated: boolean;
	currentUser: User | null;
	isLoading: boolean;
	error: string | null;
	token: string | "";

	// Actions
	login: (credentials: LoginCredentials) => Promise<void>;
	register: (credentials: RegisterCredentials) => Promise<void>;
	logout: () => void;
	clearError: () => void;
}

interface AuthResponse {
	user: User;
	token: string;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			isAuthenticated: false,
			currentUser: null,
			isLoading: false,
			error: null,
			token: "",

			login: async ({ email, password }) => {
				set({ isLoading: true, error: null });

				try {
					const response = await apiClient.post<AuthResponse>("/auth/login", {
						email,
						password,
					});

					if (response.status === 200) {
						const { user, token } = response.data;
						set({
							token,
							isAuthenticated: true,
							currentUser: user,
							isLoading: false,
						});
					} else {
						set({
							error: "Invalid email or password",
							isLoading: false,
						});
					}
				} catch (err) {
					set({
						error: "An error occurred during login",
						isLoading: false,
					});
				}
			},

			register: async ({ username, email, password }) => {
				set({ isLoading: true, error: null });

				try {
					const response = await apiClient.post<AuthResponse>("/auth/register", {
						name: username,
						email,
						password,
					});

					if (response.status !== 200) {
						set({
							error: "User with this email already exists",
							isLoading: false,
						});
						return;
					}
					const { user, token } = response.data;

					// Auto-login after successful registration
					set({
						token,
						isAuthenticated: true,
						currentUser: user,
						isLoading: false,
					});
				} catch (err) {
					set({
						error: "An error occurred during registration",
						isLoading: false,
					});
				}
			},

			logout: () => {
				set({
					isAuthenticated: false,
					currentUser: null,
					token: "",
				});
			},

			clearError: () => {
				set({ error: null });
			},
		}),
		{
			// Persist the auth state in local storage
			name: "auth-storage",
			partialize: (state) => ({
				isAuthenticated: state.isAuthenticated,
				currentUser: state.currentUser,
				token: state.token,
			}),
		}
	)
);
