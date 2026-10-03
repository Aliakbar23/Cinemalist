// Polyfill for Windows FAT32 filesystems where libuv maps ERROR_NOT_A_REPARSE_POINT to EISDIR
const fs = require("fs");

if (process.platform === "win32") {
  const pathMod = require("path");
  const patchPath = pathMod.resolve(__dirname, "fat32-patch.js").replace(/\\/g, "/");
  if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes("fat32-patch.js")) {
    process.env.NODE_OPTIONS = ((process.env.NODE_OPTIONS || "") + ` --require "${patchPath}"`).trim();
  }

  const origReadlink = fs.readlink;
  const origReadlinkSync = fs.readlinkSync;

  fs.readlink = function (path, options, callback) {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    return origReadlink.call(fs, path, options, (err, linkString) => {
      if (err && (err.code === "EISDIR" || err.code === "UNKNOWN" || err.code === "ERR_FS_EISDIR")) {
        const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        einval.code = "EINVAL";
        return callback(einval);
      }
      return callback(err, linkString);
    });
  };

  fs.readlinkSync = function (path, options) {
    try {
      return origReadlinkSync.call(fs, path, options);
    } catch (err) {
      if (err && (err.code === "EISDIR" || err.code === "UNKNOWN" || err.code === "ERR_FS_EISDIR")) {
        const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
        einval.code = "EINVAL";
        throw einval;
      }
      throw err;
    }
  };

  if (fs.promises) {
    const origPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function (path, options) {
      try {
        return await origPromisesReadlink.call(fs.promises, path, options);
      } catch (err) {
        if (err && (err.code === "EISDIR" || err.code === "UNKNOWN" || err.code === "ERR_FS_EISDIR")) {
          const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
          einval.code = "EINVAL";
          throw einval;
        }
        throw err;
      }
    };
  }
}
