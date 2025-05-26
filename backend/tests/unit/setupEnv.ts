import dotenv from 'dotenv';
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../', '.env.test'), override: true });
