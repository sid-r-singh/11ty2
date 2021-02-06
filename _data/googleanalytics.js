const metadata = require("./metadata.json");

module.exports = function () {
  let id = metadata.googleAnalyticsId;
  if (/Update me/.test(id)) {
    id = null;
  }
  return id;
};
