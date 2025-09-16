const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
	if (!fs.existsSync(src)) {
		console.error(`✗ Source directory ${src} not found`);
		return false;
	}

	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (let entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			copyDir(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
	return true;
}

// Ensure the build/src/config directory exists
const buildConfigDir = path.join('build', 'src', 'config');
if (!fs.existsSync(buildConfigDir)) {
	fs.mkdirSync(buildConfigDir, { recursive: true });
}

// Copy qaTree.json to build directory
const sourcePath = path.join('src', 'config', 'qaTree.json');
const destPath = path.join(buildConfigDir, 'qaTree.json');

if (fs.existsSync(sourcePath)) {
	fs.copyFileSync(sourcePath, destPath);
	console.log('✓ Copied qaTree.json to build directory');
} else {
	console.error('✗ qaTree.json not found in src/config/');
	process.exit(1);
}

// Copy i18n translations to build directory
const i18nSourceDir = path.join('src', 'i18n');
const i18nDestDir = path.join('build', 'src', 'i18n');

if (copyDir(i18nSourceDir, i18nDestDir)) {
	console.log('✓ Copied i18n translations to build directory');
} else {
	console.error('✗ Failed to copy i18n translations');
	process.exit(1);
}
