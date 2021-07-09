const fs = require("fs");
const path = require("path");
const semverRcompare = require("semver/functions/rcompare");
const semverValid = require("semver/functions/valid");

/** @typedef {{basedir: string, dir: string, version: string}} VersionPath  */

/**
 * @param {string} basedir 
 * @returns {VersionPath[]}
 */
const getDiscordVersionsForBaseDir = function(basedir) {
    return fs.readdirSync(basedir).filter(
                dir => 
                    fs.lstatSync(path.join(basedir, dir)).isDirectory() && // filter for directories
                    semverValid(dir.replace("app-","")) && // which have valid semver name (ignoring the app- prefix)
                    fs.existsSync(path.join(basedir, dir, "resources")) // that have a resources folder
            ).map(
                dir => ({
                    basedir,
                    dir,
                    version: dir.replace("app-","")
                })
            );
};

/**
 * @param {VersionPath[]} versions 
 * @returns {string} path
 */
const getHighestVersion = function(versions) {
    const highest = versions.sort((v1,v2)=>semverRcompare(v1.version,v2.version))[0];
    return path.join(highest.basedir, highest.dir, "resources");
};

export const getDiscordPath = function(releaseChannel) {
    const releaseChannelFolder = releaseChannel.replace(" ", "");

    const basedirs = [
        path.join(process.env.PROGRAMDATA, process.env.USERNAME, releaseChannelFolder),
        path.join(process.env.LOCALAPPDATA, releaseChannelFolder)
    ].filter(dir => fs.existsSync(dir));
    if (!basedirs.length) return "";

    const detectedVersions = basedirs.map(getDiscordVersionsForBaseDir).flat();
    console.debug(`Detected versions for channel "${releaseChannel}":`, detectedVersions);

    if (!detectedVersions.length) return "";

    return getHighestVersion(detectedVersions);
};

export const validate = function(channel, proposedPath) {
    const channelName = platforms[channel].replace(" ", "");

    const isParentDir = fs.existsSync(path.join(proposedPath, channelName));
    if (isParentDir) proposedPath = path.join(proposedPath, channelName);

    let resourcePath = "";
    const selected = path.basename(proposedPath);
    if (selected === channelName) {
        const detectedVersions = getDiscordVersionsForBaseDir(proposedPath)
        if (!detectedVersions.length) return "";
        resourcePath = getHighestVersion(detectedVersions);
    }

    if (selected.startsWith("app-") && semverValid(selected.replace("app-", ""))) {
        resourcePath = path.join(proposedPath, "resources");
    }
    if (selected === "resources") resourcePath = proposedPath;

    const executablePath = path.join(resourcePath, "..", `${channelName}.exe`);
    if (fs.existsSync(executablePath)) return resourcePath;
    return "";
};