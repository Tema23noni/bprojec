#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import process from 'node:process';
import inquirer from "inquirer";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from 'node:url';
import degit from "degit";
import { spawn } from 'node:child_process';


const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
    .name("bproj")
    .description(
        chalk.bgGray(`A simple CLI for building a project 
        ${chalk.bgGreenBright.bold('Vue')}, 
        ${chalk.bgBlue.bold('React')}, 
        ${chalk.bgGreen.bold('Express')}`)
    )
    .version("1.0.0");

program.command('new').description('Create a new project').action(async () => {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'projectType',
            message: chalk.bgGray.green.bold('Select a project type:'),
            choices: ['Vue', 'React', 'Express'],
        },
        {
            type: 'input',
            name: 'projectName',
            message: chalk.bgGray.blue.bold('Enter the project name:'),
        },
        {
            type: 'input',
            name: 'packageManager',
            message: chalk.bgGray.red.bold('Enter the package manager (npm/yarn):'),
            choices: ['npm', 'yarn'],
            default: 'npm',
        },
    ]).catch(() => {
        console.error(chalk.red.bold('Error: Invalid input. Exiting...'));
        process.exit(1);
    })

    fs.readdir(__dirname, (err, files) => {
        if (files.includes(answers.projectName)) {
            process.exit(1);
        }
    });

    console.log(chalk.blue(`Создаём проект ${answers.projectName}...`));

    console.log(answers.projectType.toLowerCase());
    const emitter = degit(`https://github.com/Tema23noni/project-init#${answers.projectType.toLowerCase()}-init`, {
        cache: false,
        force: true,
    });

    try {
        let path = !!answers.projectName ? answers.projectName : __dirname;
        console.log(path, path !== __dirname);
        if (path !== __dirname) {
            path = path.replace('/\//g', '');
            fs.mkdirSync(path, { recursive: true });
            console.log(chalk.green(`Папка ${answers.projectName} успешно создана.`));

            process.chdir(path);
        }
        await emitter.clone('.');
        console.log(`Текущая рабочая директория: ${process.cwd()} ${path}`);

        console.log(chalk.green(`Проект ${answers.projectName} успешно создан!`));
    }
    catch (error) {
        console.error(chalk.red(`Ошибка при создании директории: ${error.message}`));
        process.exit(1);
    }

    try {
        console.log('Устанавливаем зависимости...');
        await getInstallPackage(answers.packageManager,['install']);
        console.log(chalk.green('Зависимости установлены!'));

        console.log(chalk.green('Запуск проекта...'));
        await getInstallPackage(answers.packageManager,[`${answers.packageManager === 'npm' ? 'run serve' : 'serve'}`]);
    } catch (error) {
        console.error(chalk.red(`Ошибка при создании проекта: ${error.message}`));
        process.exit(1);
    }

})

function getInstallPackage(packageManager, args) {
    return new Promise((resolve, reject) => {
        const process = spawn(packageManager, args, { stdio: 'inherit' });

        process.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Команда ${packageManager} ${args.join(' ')} завершилась с ошибкой`));
            } else {
                resolve();
            }
        });
    });
}

program.parse(process.args);
