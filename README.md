# Community Dragon Directory Downloader
[![NPM Version](https://img.shields.io/npm/v/cdragon-dd.svg?style=flat-square)](https://www.npmjs.com/package/cdragon-dd) [![NPM Version](https://img.shields.io/npm/dm/cdragon-dd.svg?style=flat-square)](https://www.npmjs.com/package/cdragon-dd)  
Download directories from community dragon's cdn


## IMPORTANT
Your urls must end in a "/" you should just copy and paste your urls into the command line

## Usage

You can either download and run a prebuilt binary from the [releases tab](https://github.com/Hi-Ray/cd-dd/releases) or install the package via npmjs.  
If you want to install this package without npmjs, please read the documentation [here](https://github.com/Hi-Ray/cd-dd/blob/master/install-with-git.md).
```shell
> npm i cdragon-dd # install the package for your current project
> npm i cdragon-dd -g # install the package as a global CLI tool
> cd-dd <url> [...flags]
```

## Usage example

Download all the files in the directory (URL). 
```shell
> cd-dd https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and its subdirectories (recursive). 
```shell
> cd-dd -r https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and its subdirectories (recursive) into the local directory `./data`. 
```shell
> cd-dd -o ./data -r https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and don't cache results. 
```shell
> cd-dd -k replace -r https://raw.communitydragon.org/latest/game/data/images/
> cd-dd -k nothing -r https://raw.communitydragon.org/latest/game/data/images/
```

## Flags
```
Usage: cd-dd [options] <URL>

Arguments:
  URL                      URL starting with https://

Options:
  -o, --output <output>    Output directory location. Default is ./out
  -r, --recursive          Recursively download directory and files
  -k, --keep-files [mode]  Keep files if they already exist in the output directory (choices: "all", "replace", "nothing", default: "all")
  -V, --version            output the version number
  -h, --help               display help for command
```

## How does caching work?
When the keep-files flag is set to "all" or "replace", a `.cddd` file will be created in every downloaded directory which holds a compressed version of the downloaded files which can identify whether a the current version of the file was already downloaded or not.  

If the keep-files flag is set to "all", existing valid files not be downloaded nor replaced.  
If the keep-files flag is set to "replace" existing files are downloaded and replaced and a .cddd cache file will be created but ignored. 
In the keep-files "nothing" mode, the .cddd flag is not created. Use this mode only if you are sure you are not going to download the same data twice at any point. 
