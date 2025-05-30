import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/state/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTheme } from "@/components/ThemeProvider";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";

const registerSchema = z
	.object({
		username: z.string().min(3, { message: "Username must be at least 3 characters" }),
		email: z.string().email({ message: "Please enter a valid email address" }),
		password: z.string().min(6, { message: "Password must be at least 6 characters" }),
		confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
	const { isAuthenticated, register, error, clearError, isLoading } = useAuthStore();
	const { toast } = useToast();
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();

	// Form hook
	const form = useForm<RegisterFormValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			username: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			navigate("/");
		}
	}, [isAuthenticated, navigate]);

	// Show error toast when auth error occurs
	useEffect(() => {
		if (error) {
			toast({
				title: "Registration Error",
				description: error,

				variant: "destructive",
			});
			clearError();
		}
	}, [error, toast, clearError]);

	const onSubmit = async (data: RegisterFormValues) => {
		await register({
			username: data.username,
			email: data.email,
			password: data.password,
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="absolute top-4 right-4">
				<Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
					{theme === "dark" ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5" />}
				</Button>
			</div>

			<Card className="w-full max-w-md animate-fade-in">
				<CardHeader className="text-center">
					<CardTitle className="text-3xl font-bold">
						ChopKhui <span className="text-primary">Register</span>
					</CardTitle>
					<CardDescription>Create a new account to get started</CardDescription>
				</CardHeader>

				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input placeholder="johndoe" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input placeholder="your@email.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Confirm Password</FormLabel>
										<FormControl>
											<Input type="password" placeholder="••••••••" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button type="submit" className="w-full mt-2" disabled={isLoading}>
								{isLoading ? "Creating account..." : "Register"}
							</Button>
						</form>
					</Form>
				</CardContent>

				<CardFooter className="flex flex-col space-y-2 text-center text-sm">
					<div>
						Already have an account?{" "}
						<Link to="/login" className="text-primary hover:underline font-medium">
							Login now
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
};

export default Register;
