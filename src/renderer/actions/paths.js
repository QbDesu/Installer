const fs = require("fs");
const path = require("path");

export const platforms = {stable: "Discord", canary: "Discord Canary", ptb: "Discord PTB"};
export const locations = {stable: "", canary: "", ptb: ""};

const getDiscordPath = function(releaseChannel) {
    let resourcePath = "";
    if (process.platform === "win32") {
        const basedir = path.join(process.env.LOCALAPPDATA, releaseChannel.replace(/ /g, ""));
        if (!fs.existsSync(basedir)) return "";
        const version = fs.readdirSync(basedir).filter(f => fs.lstatSync(path.join(basedir, f)).isDirectory() && f.split(".").length > 1).sort().reverse()[0];
        if (!version) return "";
        resourcePath = path.join(basedir, version, "resources");
    }
    else if (process.platform === "darwin") {
        resourcePath = path.join("/Applications", `${releaseChannel}.app`, "Contents", "Resources");
    }
    else {
        resourcePath = path.join("/usr", "share", releaseChannel.toLowerCase().replace(/ /g, "-"), "resources");
    }

    if (fs.existsSync(resourcePath)) return resourcePath;
    return "";
};

for (const channel in platforms) {
    locations[channel] = getDiscordPath(platforms[channel]);
}

export const getBrowsePath = function(channel) {
    if (process.platform === "win32") return path.join(process.env.LOCALAPPDATA, platforms[channel].replace(" ", ""));
    else if (process.platform === "darwin") return path.join("/Applications", `${platforms[channel]}.app`);
    return path.join("/usr", "share", platforms[channel].toLowerCase().replace(" ", "-"));
};

export const validatePath = function(channel, proposedPath) {
    if (process.platform === "win32") return validateWindows(channel, proposedPath);
    else if (process.platform === "darwin") return validateMac(channel, proposedPath);
    return validateLinux(channel, proposedPath);
};

const validateWindows = function(channel, proposedPath) {
    const channelName = platforms[channel].replace(" ", "");

    const isParentDir = fs.existsSync(path.join(proposedPath, channelName));
    if (isParentDir) proposedPath = path.join(proposedPath, channelName);

    let resourcePath = "";
    const selected = path.basename(proposedPath);
    const isBaseDir = selected === channelName;
    if (isBaseDir) {
        const version = fs.readdirSync(proposedPath).filter(f => fs.lstatSync(path.join(proposedPath, f)).isDirectory() && f.split(".").length > 1).sort().reverse()[0];
        if (!version) return "";
        resourcePath = path.join(proposedPath, version, "resources");
    }

    if (selected.startsWith("app-") && selected.split(".").length > 2) resourcePath = path.join(proposedPath, "resources");
    if (selected === "resources") resourcePath = proposedPath;

    const executablePath = path.join(resourcePath, "..", `${channelName}.exe`);
    if (fs.existsSync(executablePath)) return resourcePath;
    return "";
};

const validateMac = function(channel, proposedPath) {
    let resourcePath = "";
    const selected = path.basename(proposedPath);
    if (selected === `${platforms[channel]}.app`) resourcePath = path.join(proposedPath, "Contents", "Resources");
    if (selected === "Contents") resourcePath = path.join(proposedPath, "Resources");
    if (selected === "Resources") resourcePath = proposedPath;

    const executablePath = path.join(resourcePath, "..", "MacOS", platforms[channel]);
    if (fs.existsSync(executablePath)) return resourcePath;
    return "";
};

const validateLinux = function(channel, proposedPath) {
    const channelName = platforms[channel].toLowerCase().replace(" ", "-");

    let resourcePath = "";
    const selected = path.basename(proposedPath);
    if (selected === channelName) resourcePath = path.join(proposedPath, "resources");
    if (selected === "resources") resourcePath = proposedPath;

    const executablePath = path.join(resourcePath, "..", "MacOS", platforms[channel]);
    if (fs.existsSync(executablePath)) return resourcePath;
    return "";
};