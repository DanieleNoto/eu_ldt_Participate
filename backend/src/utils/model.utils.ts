// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
//   # Pierluigi Spedicato
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ScopeOptions, WhereAttributeHash } from 'sequelize/types/model';
import logger from './logger';

interface Search {
	field: string;
	query: string[];
}

export const getModelScope = (
	model: any,
	scope: string | ScopeOptions | readonly (string | ScopeOptions)[] | WhereAttributeHash | undefined
) => {
	try {
		if (scope) {
			return model.scope(scope);
		}
	} catch (error) {
		logger.debug(error);
	}

	return model;
};

export const findForScope = (model: any, search: Search[] = []) => {
	const index = search.findIndex((item: Search) => model.options.scopes[item.field]);

	if (index !== -1) {
		const item = search[index];
		// Remove the item if found
		search.splice(index, 1);
		return { method: [item.field, item.query[0]] };
	}

	return undefined;
};
