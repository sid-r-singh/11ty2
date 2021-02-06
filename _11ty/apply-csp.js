const { JSDOM } = require("jsdom");
const cspHashGen = require("csp-hash-generator");
const syncPackage = require("browser-sync/package.json");

/**
 * Substitute the magic `HASHES` string in the CSP with the actual values of the
 * loaded JS files.
 * The ACTUAL CSP is configured in `_data/csp.js`.
 */

// Allow the auto-reload script in local dev. Would be good to get rid of this magic
// string which would break on ungrades of 11ty.
const AUTO_RELOAD_SCRIPTS = [
  quote(
    cspHashGen(
      "//<![CDATA[\n    document.write(\"<script async src='/browser-sync/browser-sync-client.js?v=" +
        syncPackage.version +
        '\'><\\/script>".replace("HOST", location.hostname));\n//]]>'
    )
  ),
];

function quote(str) {
  return `'${str}'`;
}

const addCspHash = async (rawContent, outputPath) => {
  let content = rawContent;

  if (outputPath && outputPath.endsWith(".html")) {
    const dom = new JSDOM(content);
    const cspAble = [
      ...dom.window.document.querySelectorAll("script[csp-hash]"),
    ];

    const hashes = cspAble.map((element) => {
      const hash = cspHashGen(element.textContent);
      element.setAttribute("csp-hash", hash);
      return quote(hash);
    });
    if (isDevelopmentMode()) {
      hashes.push.apply(hashes, AUTO_RELOAD_SCRIPTS);
    }

    const csp = dom.window.document.querySelector(
      "meta[http-equiv='Content-Security-Policy']"
    );
    if (!csp) {
      return content;
    }
    csp.setAttribute(
      "content",
      csp.getAttribute("content").replace("HASHES", hashes.join(" "))
    );

    content = dom.serialize();
  }

  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("csp", addCspHash);
  },
};

function isDevelopmentMode() {
  return /serve/.test(process.argv.join());
}
