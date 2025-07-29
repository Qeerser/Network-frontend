import { getConfig } from "@/config";
import axios from "axios";

axios.defaults.withCredentials = true;

export const apiClient = axios.create({
	baseURL: getConfig().apiUrl,
	withCredentials: true,
});

// // Request Interceptor
// apiClient.interceptors.request.use(
//     (config) => {
//         config.withCredentials = true;
//         return config;
//     },
//     (error) => Promise.reject(error),
// );

// // Response Interceptor
// apiClient.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         console.error('API Error:', error.response?.data || error.message);
//         return Promise.reject(error);
//     },
// );
