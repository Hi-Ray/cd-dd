#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const commander_1 = require("commander");
const tracer_1 = require("tracer");
const https_1 = __importDefault(require("https"));
const fs_1 = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const zlib_1 = require("zlib");
const logger = (0, tracer_1.colorConsole)();
const downloadFile = async (url, filepath) => {
    return new Promise((resolve, reject) => {
        https_1.default.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs_1.default.createWriteStream(filepath))
                    .on("error", reject)
                    .once("close", () => resolve(filepath));
            }
            else {
                res.resume();
                reject(new Error(`Request ${url} Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};
const downloadDirectory = async (URL, options, currentPath = '') => {
    const basePath = path_1.default.resolve(process.env.INIT_CWD ?? process.cwd() ?? "./", options.output ?? "out");
    const additionalPath = path_1.default.resolve(basePath, currentPath);
    if (options.keepFiles === true)
        options.keepFiles = 'all';
    if (!URL.includes('communitydragon.org')) {
        logger.fatal('URL is not a valid CommunityDragon link.');
        return;
    }
    if (!URL.endsWith('/')) {
        logger.fatal('URL is not a directory. URLs must end in a / to be a valid directory.');
        return;
    }
    let startingStr = URL;
    if (URL.startsWith('https://')) {
        startingStr = URL.split('//')[1];
    }
    let removeCdrag = startingStr.split('/');
    let domain = removeCdrag[0];
    removeCdrag.shift();
    removeCdrag.unshift(domain, 'json');
    let jsonifiedString = `https://${removeCdrag.join('/')}`;
    if (basePath === additionalPath) {
        if (!(0, fs_1.existsSync)(basePath)) {
            (0, fs_1.mkdirSync)(basePath, { recursive: true });
        }
        else {
            logger.info(`The directory ${basePath} already exists. This can result in you writing files to a folder that already has other content in it. If that is intended, you are safe to ignore this warning.`);
        }
    }
    axios_1.default.get(jsonifiedString).then(async ({ data }) => {
        logger.info(`data length: ${data.length}`);
        if (options.keepFiles === 'all' && (0, fs_1.existsSync)(`${additionalPath}/.cddd`)) {
            const file = (0, fs_1.openSync)(`${additionalPath}/.cddd`, 'r');
            const content = (0, fs_1.readFileSync)(file);
            (0, fs_1.closeSync)(file);
            const files = JSON.parse((0, zlib_1.gunzipSync)(content).toString('utf-8'));
            let index = 0;
            files.forEach((file) => {
                const fileName = file[0];
                const fileAge = file[1];
                for (let i = index; i < data.length; i++) {
                    if (data[i].name === fileName) {
                        index = i;
                        if (fileAge === Math.floor(new Date(data[i].mtime).getTime() / 1000)
                            && data[i].type !== 'directory' && (0, fs_1.existsSync)(`${basePath}/${currentPath}${data[i].name}`)) {
                            data[i].fetch = false;
                        }
                        break;
                    }
                }
            });
        }
        for (let i = 0; i < data.length; i++) {
            if (data[i].type === 'directory') {
                if (!options.recursive || data[i].fetch === false) {
                    data[i] = [];
                    continue;
                }
                try {
                    (0, fs_1.mkdirSync)(`${basePath}/${currentPath}${data[i].name}`);
                    logger.info(`created ${basePath}/${currentPath}${data[i].name}`);
                }
                catch (e) {
                    logger.info(`Directory ${basePath}/${currentPath}${data[i].name} exists already`);
                }
                try {
                    await downloadDirectory(`${URL}${data[i].name}/`, options, currentPath + data[i].name + '/');
                    logger.info(`Downloaded ${currentPath + data[i].name + '/'}`);
                }
                catch (e) {
                    logger.error(`Failed to download: ${currentPath + data[i].name + '/'}`);
                }
                data[i] = [];
            }
            else {
                if (data[i].fetch !== false) {
                    try {
                        await downloadFile(`${URL}${data[i].name}`, `${basePath}/${currentPath + data[i].name}`);
                        logger.info(`Downloaded ${basePath}/${currentPath + data[i].name}`);
                    }
                    catch (e) {
                        logger.error(`Failed to download: ${basePath}/${currentPath + data[i].name}`);
                    }
                }
                data[i] = [data[i].name, Math.floor(new Date(data[i].mtime).getTime() / 1000)];
            }
        }
        data = data.filter((n) => n.length);
        if (data.length > 0 && options.keepFiles !== 'nothing') {
            const file = (0, fs_1.openSync)(`${additionalPath}/.cddd`, 'w+');
            (0, fs_1.writeFileSync)(file, (0, zlib_1.gzipSync)(JSON.stringify(data)));
            (0, fs_1.closeSync)(file);
        }
    });
};
const program = (new commander_1.Command())
    .argument('<URL>', 'URL starting with https://')
    .option('-o, --output <output>', 'Output directory location. Default is ./out')
    .option('-r, --recursive', 'Recursively download directory and files')
    .addOption(new commander_1.Option('-k, --keep-files [mode]', 'Keep files if they already exist in the output directory').choices(['all', 'replace', 'nothing']).default("all"))
    .action((url, options) => downloadDirectory(url, options))
    .version('1.0.0');
program.parse();
