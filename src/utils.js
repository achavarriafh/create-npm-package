import { spawn } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import { yellow } from 'colorette';
import { promisify } from 'util';
const childrenProcesses = [];
let tmpDirectory = null;
export function setTmpDirectory(dir) {
    tmpDirectory = dir;
    if (dir) {
        rimraf(dir);
        process.once('uncaughtException', () => cleanup(true));
        process.once('exit', () => cleanup());
        process.once('SIGINT', () => cleanup());
        process.once('SIGTERM', () => cleanup());
    }
}
export function cleanup(didError = false) {
    if (tmpDirectory) {
        killChildren();
    }
    setTimeout(() => {
        if (tmpDirectory) {
            rimraf(tmpDirectory);
            tmpDirectory = null;
        }
        process.exit(didError ? 1 : 0);
    }, 200);
}
export function killChildren() {
    childrenProcesses.forEach(p => p.kill('SIGINT'));
}
export function npm(command, projectPath, stdio = 'ignore') {
    return new Promise((resolve, reject) => {
        const p = spawn('npm', [command], {
            shell: true,
            stdio,
            cwd: projectPath,
        });
        p.once('exit', () => resolve());
        p.once('error', reject);
        childrenProcesses.push(p);
    });
}
export function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(entry => {
            const entry_path = join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            }
            else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}
export function onlyUnix(str) {
    return isWin() ? str : '';
}
export function printDuration(duration) {
    if (duration > 1000) {
        return `in ${(duration / 1000).toFixed(2)} s`;
    }
    else {
        const ms = parseFloat(duration.toFixed(3));
        return `in ${ms} ms`;
    }
}
export function isWin() {
    return process.platform === 'win32';
}
export function terminalPrompt() {
    return isWin() ? '>' : '$';
}
export const renameAsync = promisify(fs.rename);
export function nodeVersionWarning() {
    try {
        const v = process.version.replace('v', '').split('.');
        const major = parseInt(v[0], 10);
        if (major < 10) {
            console.log(yellow(`Your current version of Node is ${process.version}, however the recommendation is a minimum of Node v10. Note that future versions of Stencil will eventually remove support for non-LTS Node versions.`));
        }
    }
    catch (e) { }
}
