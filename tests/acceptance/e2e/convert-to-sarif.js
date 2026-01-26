/** SPDX-License-Identifier: AGPL-3.0
 * Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
 * Authors:
 * Simone Bianchelli
 */

const fs = require('fs');
const path = require('path');
const { convertAxeToSarif } = require('axe-sarif-converter');

const reportsDir = path.join(__dirname, 'a11y-reports');
const sarifDir = path.join(reportsDir, 'sarif');

// Create sarif directory if it doesn't exist
if (!fs.existsSync(sarifDir)) {
	fs.mkdirSync(sarifDir, { recursive: true });
}

// Find all *__latest.json files
const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('__latest.json'));

console.log(`Found ${files.length} JSON files to convert`);

files.forEach(file => {
	const inputPath = path.join(reportsDir, file);
	const outputFile = file.replace('.json', '.sarif');
	const outputPath = path.join(sarifDir, outputFile);

	console.log(`Converting ${file} to SARIF...`);

	try {
		const axeResults = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
		const sarifResults = convertAxeToSarif(axeResults);

		sarifResults.version = '2.1.0';
		sarifResults.$schema =
			'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json';

		fs.writeFileSync(outputPath, JSON.stringify(sarifResults, null, 2));
		console.log(`Successfully converted ${file}`);
	} catch (error) {
		console.error(`Failed to convert ${file}:`, error.message);
	}
});

console.log('Conversion completed');
