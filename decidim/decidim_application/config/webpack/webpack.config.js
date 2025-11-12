/* eslint-disable */
process.env.NODE_ENV ??= 'development';

const { webpackConfig, merge } = require('@decidim/webpacker');
const customConfig = require('./custom');

const combinedConfig = merge(webpackConfig, customConfig);

if (combinedConfig.output) {
	combinedConfig.output.publicPath = '/decidim-packs/';
}

module.exports = combinedConfig;
