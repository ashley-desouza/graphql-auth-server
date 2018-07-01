// Check if we are working in the Production or Development environments
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./production');
} else {
  module.exports = require('./development');
}
