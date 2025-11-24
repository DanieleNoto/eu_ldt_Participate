// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ErrorInfo } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface ErrorBoundaryState {
	hasError: boolean;
}

class ErrorBoundary extends React.Component<WithTranslation, ErrorBoundaryState> {
	constructor(props: WithTranslation) {
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
		const { t } = this.props;
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				<div className="mt-10 px-2">
					<h1 className="text-5xl text-neta-complementary-red font-extrabold">{t('errorBoundary.title')}</h1>
					<h2 className="text-3xl font-extrabold">{t('errorBoundary.subtitle')}</h2>
					<h4>{t('errorBoundary.description')}</h4>
					<div>
						<a
							href="/dashboard"
							className="flex flex-row space-x-1 bg-neta-complementary-dark-yellow text-white px-3 py-0.5"
							aria-label={t('errorBoundary.goBackToHome')}
						>
							<span>{t('errorBoundary.goBackTo')}</span>
							<span className="font-extrabold">{t('errorBoundary.home')}</span>
							<span className="m-0"> &gt; </span>
						</a>
					</div>
				</div>
			);
		}

		return (this.props as any).children;
	}
}

export default withTranslation()(ErrorBoundary);
