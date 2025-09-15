const fs = require('fs');
const path = require('path');

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
