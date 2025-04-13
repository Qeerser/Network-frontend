
import React from "react";
import { ThemeProvider } from "../ThemeProvider";
import Header from "./Header";

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	return (
		
			<div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <Header/>
				{children}
			</div>
	);
};

export default Layout;
