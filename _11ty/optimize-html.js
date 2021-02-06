const minify = require("html-minifier").minify;
const AmpOptimizer = require("@ampproject/toolbox-optimizer");
const ampOptimizer = AmpOptimizer.create({
  blurredPlaceholders: true,
  imageBasePath: "./_site/",
  //verbose: true,
});
const PurgeCSS = require("purgecss").PurgeCSS;
const csso = require("csso");

/**
 * Inlines the CSS.
 * Makes font display display-optional
 * Minifies and optimizes the JS
 * Optimizes HTML
 * Optimizes AMP
 */

const purifyCss = async (rawContent, outputPath) => {
  let content = rawContent;
  if (
    outputPath &&
    outputPath.endsWith(".html") &&
    !isAmp(content) &&
    !/data-style-override/.test(content)
  ) {
    let before = require("fs").readFileSync("css/main.css", {
      encoding: "utf-8",
    });

    before = before.replace(
      /@font-face {/g,
      "@font-face {font-display:optional;"
    );

    const purged = await new PurgeCSS().purge({
      content: [
        {
          raw: rawContent,
          extension: "html",
        },
      ],
      css: [
        {
          raw: before,
        },
      ],
      /*extractors: [
        {
          extractor: require("purge-from-html").extract,
          extensions: ["html"],
        },
      ],*/
      fontFace: true,
      variables: true,
    });

    const after = csso.minify(purged[0].css).css;
    //console.log("CSS reduction", before.length - after.length);

    content = content.replace("</head>", `<style>${after}</style></head>`);
  }
  return content;
};

const minifyHtml = (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && !isAmp(content)) {
    content = minify(content, {
      removeAttributeQuotes: true,
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeComments: true,
      sortClassName: true,
      sortAttributes: true,
      html5: true,
      decodeEntities: true,
      removeOptionalTags: true,
    });
  }
  return content;
};

const optimizeAmp = async (rawContent, outputPath) => {
  let content = rawContent;
  if (outputPath && outputPath.endsWith(".html") && isAmp(content)) {
    content = await ampOptimizer.transformHtml(content);
  }
  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("purifyCss", purifyCss);
    eleventyConfig.addTransform("minifyHtml", minifyHtml);
    eleventyConfig.addTransform("optimizeAmp", optimizeAmp);
  },
};

function isAmp(content) {
  return /\<html amp/i.test(content);
}
