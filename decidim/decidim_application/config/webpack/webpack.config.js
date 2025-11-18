// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Marco Pinnella
/* eslint-disable */
process.env.NODE_ENV ??= 'development';

const { webpackConfig, merge } = require('@decidim/webpacker');
const customConfig = require('./custom');

const combinedConfig = merge(webpackConfig, customConfig);

if (combinedConfig.output) {
	combinedConfig.output.publicPath = '/decidim-packs/';
}

module.exports = combinedConfig;
