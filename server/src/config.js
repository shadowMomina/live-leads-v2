const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const required = ['VERIFY_TOKEN', 'PAGE_ACCESS_TOKEN', 'APP_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    console.error('Missing in .env:', missing.join(', '));
    process.exit(1);
}

module.exports = {
    port: process.env.PORT || 3000,
    verifyToken: process.env.VERIFY_TOKEN,
    pageToken: process.env.PAGE_ACCESS_TOKEN,
    appSecret: process.env.APP_SECRET,
    graphVersion: process.env.GRAPH_VERSION || 'v26.0',
};