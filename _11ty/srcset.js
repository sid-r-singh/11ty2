const { promisify } = require("util");
const exists = promisify(require("fs").exists);
const sharp = require("sharp");

/**
 * Generates sensible sizes for each image for use in a srcset.
 */

const widths = [1920, 1280, 640, 320];

const extension = {
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
};

module.exports = async function srcset(filename, format) {
  const names = await Promise.all(
    widths.map((w) => resize(filename, w, format))
  );
  return names.map((n, i) => `${n} ${widths[i]}w`).join(", ");
};

async function resize(filename, width, format) {
  const out = sizedName(filename, width, format);
  if (await exists("_site" + out)) {
    return out;
  }
  await sharp("_site" + filename)
    .rotate() // Manifest rotation from metadata
    .resize(width)
    [format]({
      quality: 60,
      reductionEffort: 6,
    })
    .toFile("_site" + out);

  return out;
}

function sizedName(filename, width, format) {
  const ext = extension[format];
  if (!ext) {
    throw new Error(`Unknown format ${format}`);
  }
  return filename.replace(/\.\w+$/, (_) => "-" + width + "w" + "." + ext);
}
