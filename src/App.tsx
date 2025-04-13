import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { useAuthStore } from "./state/authStore";
import Login from "./pages/login";
import Register from "./pages/register";

const queryClient = new QueryClient();

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated } = useAuthStore();

	if (!isAuthenticated) {
		return <Navigate to="/auth" replace />;
	}

	return <>{children}</>;
};

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<Toaster />
				<Sonner />
				<BrowserRouter>
					<Routes>
						{/* Auth route */}
						<Route path="/auth" element={<Auth />} />

						{/* Protected routes */}
						<Route
							path="/"
							element={
								<ProtectedRoute>
									<Index />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/about"
							element={
								<ProtectedRoute>
									<About />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/contact"
							element={
								<ProtectedRoute>
									<Contact />
								</ProtectedRoute>
							}
						/>
						<Route path="/login" element={<Login />}></Route>
            <Route path="/register" element={<Register />}></Route>

						{/* Catch-all route */}
						<Route path="*" element={<NotFound />} />
					</Routes>
				</BrowserRouter>
			</TooltipProvider>
		</QueryClientProvider>
	);
};

export default App;
