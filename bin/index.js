#!/usr/bin/env bash

const { program } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const execa = require('execa');
const { resolve } = require('path');
const { existsSync } = require('fs');
const { writeFileSync } = require('fs');
const ora = require('ora');

const pkg = require('../package.json');
const { version } = pkg;

program.version(version, '-v, --version');

const promptList = [
  // 具体交互内容
  // 询问项目使用的语言，javaScript, typeScript
  {
    type: 'list',
    message: '请选择项目当前使用的语言',
    name: 'projectType',
    choices: ['javaScript', 'typeScript'],
    default: 'javaScript',
  },
  // 询问项目使用的框架，React, Vue, Angular
  {
    type: 'list',
    message: '请选择项目使用的框架',
    name: 'projectFramework',
    choices: ['Vue', 'React', 'Angular', 'None'],
    default: 'Vue',
  },
  {
    type: 'confirm',
    message: '是否安装Eslint',
    name: 'isEslint',
    default: true,
  },
  {
    type: 'confirm',
    message: '是否安装Prettier',
    name: 'isPrettier',
    default: true,
  },
  {
    type: 'confirm',
    message: '是否需要检查提交信息格式',
    name: 'isCommitlint',
    default: true,
  },
  // 安装的包管理工具
  {
    type: 'list',
    message: '请选择包管理工具',
    name: 'packageManager',
    choices: ['npm', 'yarn', 'pnpm'],
    default: 'npm',
  },
  // 是否初始化项目
  {
    type: 'confirm',
    message: '确认已选择并初始化项目',
    name: 'isInit',
    default: true,
  },
];

// 安装eslint
const installEslint = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      'eslint',
      'eslint-config-airbnb-base',
      'eslint-plugin-import',
      'eslint-plugin-node',
      'eslint-plugin-promise',
      'eslint-plugin-standard',
      '-D',
    ],
    {
      stdio: 'inherit',
    },
  );
};
// 安装prettier
const installPrettier = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      'prettier',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'eslint-plugin-node',
      'eslint-config-standard',
      '-D',
    ],
    {
      stdio: 'inherit',
    },
  );
};
// 安装husky
const installHusky = (packageManager) => {
  execa.sync(packageManager, ['install', 'husky', '-D'], {
    stdio: 'inherit',
  });
};
// 安装commitlint
const installCommitlint = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      '@commitlint/cli',
      '@commitlint/config-conventional',
      'husky',
      'commitizen',
      '-D',
    ],
    {
      stdio: 'inherit',
    },
  );
};
// 安装lint-staged
const installLintStaged = (packageManager) => {
  execa.sync(packageManager, ['install', 'lint-staged', '-D'], {
    stdio: 'inherit',
  });
};
// 安装eslint-plugin-vue
const installEslintPluginVue = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-vue', '-D'], {
    stdio: 'inherit',
  });
};
// 安装eslint-plugin-react
const installEslintPluginReact = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-react', '-D'], {
    stdio: 'inherit',
  });
};
// 安装eslint-plugin-angular
const installEslintPluginAngular = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-angular', '-D'], {
    stdio: 'inherit',
  });
};

// 安装依赖
const installDependencies = (packageManager, answers) => {
  if (answers.isEslint) {
    installEslint(packageManager);
  }
  if (answers.isPrettier) {
    installPrettier(packageManager);
  }

  if (answers.isCommitlint) {
    installHusky(packageManager);
    installLintStaged(packageManager);
    installCommitlint(packageManager);
  }
  if (answers.projectFramework === 'Vue') {
    installEslintPluginVue(packageManager);
  }
  if (answers.projectFramework === 'React') {
    installEslintPluginReact(packageManager);
  }
  if (answers.projectFramework === 'Angular') {
    installEslintPluginAngular(packageManager);
  }
};

// 初始化项目
const initProject = () => {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.log(chalk.red('package.json文件不存在'));
    return;
  }
  program
    .command('init')
    .description('初始化项目')
    .option('-i, --init', '初始化项目')
    .action(() => {
      inquirer.prompt(promptList).then((answers) => {
        const spinner = ora('正在初始化项目').start();
        spinner.color = 'yellow';

        if (answers.isInit) {
          installDependencies(answers.packageManager, answers);
          const fileCategory =
            answers.projectType === 'typeScript' ? 'ts' : 'js';
          if (answers.isEslint) {
            const eslintConfig = {
              extends: [
                'airbnb-base',
                'plugin:node/recommended',
                'plugin:promise/recommended',
                'plugin:standard/recommended',
              ],
              env: {
                browser: true,
                node: true,
                es6: true,
              },
              parserOptions: {
                ecmaVersion: 2018,
              },
              rules: {
                'no-console': 'off',
                'no-debugger': 'off',
              },
            };
            if (answers.projectFramework === 'Vue') {
              eslintConfig.extends.push('plugin:vue/essential');
            }
            if (answers.projectFramework === 'React') {
              eslintConfig.extends.push('plugin:react/recommended');
            }
            if (answers.projectFramework === 'Angular') {
              eslintConfig.extends.push('plugin:angular/johnpapa');
            }
            if (answers.projectType === 'typeScript') {
              eslintConfig.extends.push(
                'plugin:@typescript-eslint/recommended',
              );
              eslintConfig.parser = 'vue-eslint-parser';
              eslintConfig.parserOptions = {
                parser: '@typescript-eslint/parser',
              };
              eslintConfig.plugins = ['@typescript-eslint'];
            }
            // 判断是否存在.eslintrc.js文件，如果存在，则合并，不存在则创建

            const eslintConfigPath = resolve(
              process.cwd(),
              `.eslintrc.${fileCategory}`,
            );
            if (existsSync(eslintConfigPath)) {
              const eslintConfigFile = require(eslintConfigPath);
              eslintConfig.extends = [
                ...eslintConfig.extends,
                ...eslintConfigFile.extends,
              ];
            }

            writeFileSync(
              resolve(process.cwd(), `.eslintrc.${fileCategory}`),
              `module.exports = ${JSON.stringify(eslintConfig, null, 2)}`,
            );
          }
          if (answers.isPrettier) {
            // 判断是否存在.prettierrc文件，如果存在，则合并，不存在则创建.prettierrc文件
            const prettierConfig = {
              singleQuote: true,
              semi: true,
              trailingComma: 'all',
            };
            const prettierConfigPath = resolve(
              process.cwd(),
              `prettier.config.${fileCategory}`,
            );
            if (existsSync(prettierConfigPath)) {
              const prettierConfigFile = require(prettierConfigPath);
              Object.assign(prettierConfig, prettierConfigFile);
            }

            writeFileSync(
              resolve(process.cwd(), `prettier.config.${fileCategory}`),
              `module.exports = ${JSON.stringify(prettierConfig, null, 2)}`,
            );
          }
          if (answers.isCommitlint) {
            writeFileSync(
              resolve(process.cwd(), '.commitlintrc.js'),
              `module.exports = {extends: ['@commitlint/config-conventional']}`,
            );
            // husky的配置用于在提交代码前执行lint-staged和commitlint，commitlint用于检查提交信息格式，lint-staged用于检查提交的文件格式，如果不符合规范，则不允许提交
            // 创建文件夹.husky，创建文件.husky/pre-commit，内容为lint-staged，创建文件.husky/commit-msg
            const huskyPath = resolve(process.cwd(), '.husky');
            if (!existsSync(huskyPath)) {
              fs.mkdirSync(huskyPath);
            }
            const commitMsgPath = resolve(huskyPath, 'commit-msg');
            const preCommitPath = resolve(huskyPath, 'pre-commit');
            writeFileSync(
              commitMsgPath,
              '#!/usr/bin/env sh\n. "$(dirname "$0")/_/husky.sh" && npx --no -- commitlint --edit\n',
            );
            writeFileSync(
              preCommitPath,
              '#!/usr/bin/env sh\n. "$(dirname "$0")/_/husky.sh" && npx lint-staged\n',
            );
            fs.chmodSync(commitMsgPath, '755');
          }
          spinner.stop();
          console.log(chalk.green('初始化成功'));
        }
      });
    });
};
initProject();
program.parse(process.argv);
