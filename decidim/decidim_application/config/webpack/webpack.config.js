// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
// # Denis Vasilev Dimchev
// # Gianfranco Cedro
// # Marco Pinnella
/* eslint-disable */
process.env.NODE_ENV ??= 'development';

const { webpackConfig, merge } = require('@decidim/webpacker');
const customConfig = require('./custom');

webpackConfig.optimization = {};
const combinedConfig = merge(webpackConfig, customConfig);

module.exports = combinedConfig;
