const app = require('../api_build/server.cjs');
module.exports = app.default || app;
