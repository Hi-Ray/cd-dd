# Community Dragon Directory Downloader
Download directories from community dragon's cdn

## IMPORTANT
Your urls must end in a "/" you should just copy and paste your urls into the command line

## Requirements
    - Git
    - Nodejs
    - Yarn (Optional but recommended)

## Usage
```shell
> git clone https://github.com/Hi-Ray/cd-dd.git
> yarn # or you can use "npm install"
> yarn start <url> [...flags] # or "npm start <url> [...flags]"
```

## Usage example

Download all the files in the directory (URL). 
```shell
> yarn start https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and its subdirectories (recursive). 
```shell
> yarn start -r https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and its subdirectories (recursive) into the local directory `./data`. 
```shell
> yarn start -o ./data -r https://raw.communitydragon.org/latest/game/data/images/
```

Download all the files in the directory (URL) and don't cache results. 
```shell
> yarn start -k replace -r https://raw.communitydragon.org/latest/game/data/images/
> yarn start -k nothing -r https://raw.communitydragon.org/latest/game/data/images/
```

## Flags
```
Usage: yarn start [options] <URL>

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