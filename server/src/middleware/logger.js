const morgan = require('morgan');

const logger = morgan(':date[iso] :method :url :status :response-time ms');

module.exports = logger;
