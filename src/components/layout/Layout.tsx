
import React from "react";
import { ThemeProvider } from "../ThemeProvider";

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	return (
		<ThemeProvider>
			<div className="flex flex-col min-h-screen bg-background">
				{children}
			</div>
		</ThemeProvider>
	);
};

export default Layout;
