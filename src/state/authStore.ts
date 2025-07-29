
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
	uploadImage: (file: File) => Promise<string>;
	clearError: () => void;
}

interface AuthResponse {
	success?: boolean;
	user?: User;
	token?: string;
	message?: string;
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

					if (response.status === 200 && response.data.user && response.data.token) {
						const { user, token } = response.data;
						set({
							token,
							isAuthenticated: true,
							currentUser: user,
							isLoading: false,
						});
					} else {
						set({
							error: response.data?.message || "Login failed",
							isLoading: false,
						});
					}
				} catch (err: unknown) {
					// Handle error response from server
					const error = err as { response?: { data?: { message?: string } } };
					const errorMessage = error.response?.data?.message || "An error occurred during login";
					set({
						error: errorMessage,
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

					// Check for success status codes (200 or 201)
					if ((response.status === 200 || response.status === 201) && response.data.user && response.data.token) {
						const { user, token } = response.data;

						// Auto-login after successful registration
						set({
							token,
							isAuthenticated: true,
							currentUser: user,
							isLoading: false,
						});
					} else {
						set({
							error: response.data?.message || "Registration failed",
							isLoading: false,
						});
					}
				} catch (err: unknown) {
					// Handle error response from server
					const error = err as { response?: { data?: { message?: string } } };
					const errorMessage = error.response?.data?.message || "An error occurred during registration";
					set({
						error: errorMessage,
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

			uploadImage: async (file: File) => {
				const formData = new FormData();
				formData.append("image", file);

				try {
					const response = await apiClient.post("/auth/upload", formData, {
						headers: {
							"Content-Type": "multipart/form-data",
						},
					});

					if (response.status === 200) {
						return response.data.url;
					} else {
						throw new Error("Failed to upload image");
					}
				} catch (error) {
					console.error("Error uploading image:", error);
					throw error;
				}
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
