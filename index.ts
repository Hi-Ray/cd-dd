import Axios from "axios";
import Download from 'download'

import {Command} from "commander";
import {colorConsole} from "tracer";
import {createWriteStream, mkdirSync} from 'fs'

const logger = colorConsole()


const downloadFolder = (URL: string, currentPath: string = '') => {
    // Check if it's a community dragon link
    if (!URL.includes('communitydragon.org')) {
        logger.fatal('URL is not a valid CommunityDragon link.')
        return
    }

    // Check if it's a folder
    if (!URL.endsWith('/')) {
        logger.fatal('URL is not a folder.')
        return
    }
    // Foir now set a default
    let startingStr = URL;

    // Strip the "https://"
    if (URL.startsWith('https://')) {
        startingStr = URL.split('//')[1]
    }

    // remove Community dragon temporarily
    let removeCdrag = startingStr.split('/')

    removeCdrag.shift()

    // Re add the raw link with the json token
    removeCdrag.unshift('raw.communitydragon.org', 'json')

    // Add back in
    let jsonifiedString = `https://${removeCdrag.join('/')}`

    // Make a dir
    try {
        mkdirSync('out')
    } catch (e) {
        logger.info(`The directory out already exists`)
    }

    // Download le files.
    Axios.get(jsonifiedString).then(({data}) => {
        for (let i = 0; i < data.length; i++) {
            // If is directory recursively download
            if (data[i].type === 'directory') {
                try {
                    // Create directory
                    mkdirSync(`out/${currentPath}${data[i].name}`)
                    logger.info(`created out/${currentPath}${data[i].name}`)
                } catch (e) {
                    // Error incase directory exists
                    logger.error(`Directory out/${currentPath}${data[i].name} exists already`)
                }
                // Download the file
                downloadFolder(`${URL}${data[i].name}/`, currentPath + data[i].name + '/')
                logger.info(`Downloaded ${currentPath + data[i].name + '/'}`)
            } else {
                // Just download if in root directory
                Download(`${URL}${data[i].name}`).pipe(createWriteStream(`out/${currentPath +  data[i].name}`))
                logger.info(`Downloaded out/${currentPath +  data[i].name}`)
            }
        }
    })
}

const program = (new Command())
    .argument('<URL>', 'URL starting with https://')
    .action((url: string) => downloadFolder(url))
    .version('1.0.0');

// Parse the CLI
program.parse()
