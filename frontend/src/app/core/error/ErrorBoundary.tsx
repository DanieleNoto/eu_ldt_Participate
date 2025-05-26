/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ErrorInfo } from 'react';

export default class ErrorBoundary extends React.Component {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: unknown) {
		// Update state so the next render will show the fallback UI.
		console.error(error);
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error(error, errorInfo);
	}

	render() {
		if ((this.state as any).hasError) {
			// You can render any custom fallback UI
			return (
				<div className="mt-10 px-2">
					<h1 className="text-5xl text-neta-complementary-red font-extrabold">500</h1>
					<h2 className="text-3xl font-extrabold">Qualcosa è andato storto!</h2>
					<h4>Ci dispiace ma non è stato possibile fornirti la pagina cercata. Riprova più tardi</h4>
					<div>
						<a
							href="/dashboard"
							className="flex flex-row space-x-1 bg-neta-complementary-dark-yellow text-white px-3 py-0.5"
							aria-label="Torna alla Home"
						>
							<span>Torna alla </span>
							<span className="font-extrabold">Home</span>
							<span className="m-0"> &gt; </span>
						</a>
					</div>
				</div>
			);
		}

		return (this.props as any).children;
	}
}
