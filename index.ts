#!/usr/bin/env node
import Axios from "axios";

import { Command, Option } from "commander";
import { colorConsole } from "tracer";
import client from "https";
import fs, { mkdirSync, writeFileSync, existsSync, openSync, readFileSync, closeSync } from 'fs'
import { options } from "./types/options";
import path from "path";
import { gunzipSync, gzipSync } from "zlib";

const logger = colorConsole()

const downloadFile = async (url: string, filepath: string) => {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on("error", reject)
                    .once("close", () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request ${url} Failed With a Status Code: ${res.statusCode}`));
            }
        });
    });
};

const downloadDirectory = async (URL: string, options: options, currentPath: string = '') => {
    const basePath = path.resolve(process.env.INIT_CWD ?? process.cwd() ?? "./", options.output ?? "out");
    const additionalPath = path.resolve(basePath, currentPath);
    if (options.keepFiles === true) options.keepFiles = 'all';

    // Check if it's a community dragon link
    if (!URL.includes('communitydragon.org')) {
        logger.fatal('URL is not a valid CommunityDragon link.')
        return
    }

    // Check if it's a directory
    if (!URL.endsWith('/')) {
        logger.fatal('URL is not a directory. URLs must end in a / to be a valid directory.')
        return
    }

    // For now set a default
    let startingStr = URL;

    // Strip the "https://"
    if (URL.startsWith('https://')) {
        startingStr = URL.split('//')[1]
    }

    // remove Community dragon temporarily
    let removeCdrag = startingStr.split('/')
    let domain = removeCdrag[0];

    removeCdrag.shift()

    // Re add the raw link with the json token
    removeCdrag.unshift(domain, 'json')

    // Add back in
    let jsonifiedString = `https://${removeCdrag.join('/')}`

    // Make a dir
    if (basePath === additionalPath) {
        if (!existsSync(basePath)) {
            mkdirSync(basePath, { recursive: true })
        } else {
            logger.info(`The directory ${basePath} already exists. This can result in you writing files to a folder that already has other content in it. If that is intended, you are safe to ignore this warning.`)
        }
    }

    // Download le files.
    Axios.get(jsonifiedString).then(async ({ data }) => {
        logger.info(`data length: ${data.length}`)

        // Read content of caching file
        if (options.keepFiles === 'all' && existsSync(`${additionalPath}/.cddd`)) {
            const file = openSync(`${additionalPath}/.cddd`, 'r');
            const content = readFileSync(file);
            closeSync(file);
            const files = JSON.parse(gunzipSync(content).toString('utf-8'));

            // Loop through the cached files and compare them to the live version
            let index = 0;
            files.forEach((file: Array<string | number>) => {
                const fileName = file[0] as string;
                const fileAge = file[1] as number;
                for (let i = index; i < data.length; i++) {
                    if (data[i].name === fileName) {
                        index = i;
                        if (fileAge === Math.floor(new Date(data[i].mtime).getTime() / 1000)
                            && data[i].type !== 'directory' && existsSync(`${basePath}/${currentPath}${data[i].name}`)) {
                            data[i].fetch = false;
                        }
                        break;
                    }
                }
            });
        }

        for (let i = 0; i < data.length; i++) {
            // If is directory recursively download
            if (data[i].type === 'directory') {
                if (!options.recursive || data[i].fetch === false) {
                    // Skip directory when recursive download is not enabled
                    data[i] = [];
                    continue;
                }
                try {
                    // Create directory
                    mkdirSync(`${basePath}/${currentPath}${data[i].name}`)
                    logger.info(`created ${basePath}/${currentPath}${data[i].name}`)
                } catch (e) {
                    // Error incase directory exists
                    logger.info(`Directory ${basePath}/${currentPath}${data[i].name} exists already`)
                }
                // Download the files in the directory
				try {
					await downloadDirectory(`${URL}${data[i].name}/`, options, currentPath + data[i].name + '/')
					logger.info(`Downloaded ${currentPath + data[i].name + '/'}`)
				} catch (e) {
					logger.error(`Failed to download: ${currentPath + data[i].name + '/'}`)
				}
                data[i] = [];
            } else {
                if (data[i].fetch !== false) {
                    // Download the file
					try {
						await downloadFile(`${URL}${data[i].name}`, `${basePath}/${currentPath + data[i].name}`);
						logger.info(`Downloaded ${basePath}/${currentPath + data[i].name}`);
					} catch (e) {
						logger.error(`Failed to download: ${basePath}/${currentPath + data[i].name}`)
					}
                }
                data[i] = [data[i].name, Math.floor(new Date(data[i].mtime).getTime() / 1000)]

            }
        }

        // write compressed caching file to folder
        data = data.filter((n: any) => n.length)
        if (data.length > 0 && options.keepFiles !== 'nothing') {
            const file = openSync(`${additionalPath}/.cddd`, 'w+');
            writeFileSync(file, gzipSync(JSON.stringify(data)));
            closeSync(file);
        }

    })
}

const program = (new Command())
    .argument('<URL>', 'URL starting with https://')
    .option('-o, --output <output>', 'Output directory location. Default is ./out')
    .option('-r, --recursive', 'Recursively download directory and files')
    .addOption(new Option('-k, --keep-files [mode]', 'Keep files if they already exist in the output directory').choices(['all', 'replace', 'nothing']).default("all"))
    .action((url: string, options: options) => downloadDirectory(url, options))
    .version('1.0.0');

// Parse the CLI
program.parse()
