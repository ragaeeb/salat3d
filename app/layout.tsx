import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Sun Position Visualizer",
	description: "Interactive sun path visualizer built with Next.js 16 and React Three Fiber",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
