#!/usr/bin/env bash

const { program } = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')
const execa = require('execa')
const { resolve } = require('path')
const { existsSync, writeFileSync } = require('fs')
const ora = require('ora')

const pkg = require('../package.json')
const { version } = pkg

program.version(version, '-v, --version')

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
]

// 安装eslint
const installEslint = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      'eslint',
      'lint-staged',
      'eslint-config-standard',
      'eslint-plugin-import',
      'eslint-plugin-node',
      'eslint-plugin-promise',
      '-D',
    ],
    {
      stdio: 'inherit',
    }
  )
}
// 安装prettier
const installPrettier = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      'prettier',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      '-D',
    ],
    {
      stdio: 'inherit',
    }
  )
}

// 安装commitlint
const installCommitlint = (packageManager) => {
  execa.sync(
    packageManager,
    [
      'install',
      'husky',
      '@commitlint/cli',
      '@commitlint/config-conventional',
      'conventional-changelog-atom',
      'commitizen',
      '-D',
    ],
    {
      stdio: 'inherit',
    }
  )
}

// 安装eslint-plugin-vue
const installEslintPluginVue = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-vue', '-D'], {
    stdio: 'inherit',
  })
}
// 安装eslint-plugin-react
const installEslintPluginReact = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-react', '-D'], {
    stdio: 'inherit',
  })
}
// 安装eslint-plugin-angular
const installEslintPluginAngular = (packageManager) => {
  execa.sync(packageManager, ['install', 'eslint-plugin-angular', '-D'], {
    stdio: 'inherit',
  })
}

// 安装依赖
const installDependencies = (packageManager, answers) => {
  installEslint(packageManager)
  if (answers.projectFramework === 'Vue') {
    installEslintPluginVue(packageManager)
  }
  if (answers.projectFramework === 'React') {
    installEslintPluginReact(packageManager)
  }
  if (answers.projectFramework === 'Angular') {
    installEslintPluginAngular(packageManager)
  }
  if (answers.isPrettier) {
    installPrettier(packageManager)
  }
  if (answers.isCommitlint) {
    installCommitlint(packageManager)
  }
}

// 初始化或合并eslint配置文件
const initEslintConfig = (answers) => {
  // 判断是否存在.eslintrc.js文件，如果存在，则合并，不存在则创建.eslintrc.js文件
  const eslintConfigPath = resolve(process.cwd(), '.eslintrc.js')
  // 基础的eslint的配置文件
  const eslintConfig = {
    root: true,
    env: {
      node: true,
      es6: true,
      browser: true,
    },
    extends: [],
    parserOptions: {
      ecmaVersion: 2020,
    },
  }
  // 根据用户选择的语言，添加对应的eslint配置
  if (answers.projectType === 'typeScript') {
    eslintConfig.extends.push('plugin:@typescript-eslint/recommended')
  }
  if (answers.projectType === 'javaScript') {
    eslintConfig.extends.push('eslint:recommended')
  }
  // 根据用户选择的框架，添加对应的eslint配置
  if (answers.projectFramework === 'Vue') {
    eslintConfig.extends.push('plugin:vue/recommended')
  }
  if (answers.projectFramework === 'React') {
    eslintConfig.extends.push('plugin:react/recommended')
  }
  if (answers.projectFramework === 'Angular') {
    eslintConfig.extends.push('plugin:angular/recommended')
  }
  if (answers.isPrettier) {
    eslintConfig.extends.push('prettier')
  }
  if (existsSync(eslintConfigPath)) {
    const eslintConfigFile = require(eslintConfigPath)
    Object.assign(eslintConfig, eslintConfigFile)
  }

  writeFileSync(
    eslintConfigPath,
    `module.exports = ${JSON.stringify(eslintConfig, null, 2)}`
  )
  // 判断是否存在 lint-staged 配置文件，如果存在，则合并，不存在则创建 lint-staged 配置文件
  const lintStagedConfigPath = resolve(process.cwd(), '.lintstagedrc.js')
  const lintStagedConfig = {
    '*.{js,ts,tsx,jsx,vue}': ['eslint --fix'],
  }
  if (existsSync(lintStagedConfigPath)) {
    const lintStagedConfigFile = require(lintStagedConfigPath)
    Object.assign(lintStagedConfig, lintStagedConfigFile)
  }
  writeFileSync(
    lintStagedConfigPath,
    `module.exports = ${JSON.stringify(lintStagedConfig, null, 2)}`
  )
}
// 初始化项目
const initProject = () => {
  const packageJsonPath = resolve(process.cwd(), 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.log(chalk.red('package.json文件不存在'))
    return
  }
  program
    .command('init')
    .description('初始化项目')
    .option('-i, --init', '初始化项目')
    .action(() => {
      inquirer.prompt(promptList).then((answers) => {
        const spinner = ora('正在初始化项目').start()
        spinner.color = 'yellow'

        if (answers.isInit) {
          // 安装依赖
          installDependencies(answers.packageManager, answers)
          // 初始化或合并eslint配置文件
          initEslintConfig(answers)
          if (answers.isPrettier) {
            // 判断是否存在.prettierrc.js文件，如果存在，则合并，不存在则创建..prettierrc.js文件
            const prettierConfigPath = resolve(process.cwd(), '.prettierrc.js')
            // 基础的prettier的配置文件
            const prettierConfig = {
              semi: false,
              singleQuote: true,
              trailingComma: 'all',
            }
            if (existsSync(prettierConfigPath)) {
              const prettierConfigFile = require(prettierConfigPath)
              Object.assign(prettierConfig, prettierConfigFile)
            }
          }
          if (answers.isCommitlint) {
            // 判断是否存在.commitlintrc.js文件，如果存在，则合并，不存在则创建..commitlintrc.js文件
            const commitlintConfigPath = resolve(
              process.cwd(),
              '.commitlintrc.js'
            )
            // 基础的commitlint的配置文件
            const commitlintConfig = {
              extends: ['@commitlint/config-conventional'],
              parserPreset: 'conventional-changelog-atom',
              rules: {
                'type-case': [2, 'always', ['lower-case', 'upper-case']],
                'type-enum': [
                  2,
                  'always',
                  [
                    'workflow',
                    'ci',
                    'wip',
                    'types',
                    'feat',
                    'fix',
                    'docs',
                    'style',
                    'refactor',
                    'perf',
                    'test',
                    'chore',
                    'revert',
                    'build',
                  ],
                ],
              },
            }
            if (existsSync(commitlintConfigPath)) {
              const commitlintConfigFile = require(commitlintConfigPath)
              Object.assign(commitlintConfig, commitlintConfigFile)
            }
            writeFileSync(
              commitlintConfigPath,
              `module.exports = ${JSON.stringify(commitlintConfig, null, 2)}`
            )

            // 设置git hooks
            execa.sync('npx', ['husky', 'init'], {
              stdio: 'inherit',
            })

            // 将npx lint-staged写入到工作目录下的.husky/pre-commit
            writeFileSync(
              resolve(process.cwd(), '.husky/pre-commit'),
              'npx lint-staged'
            )

            // 将npx --no -- commitlint --edit \$1写入到工作目录下的.husky/commit-msg
            writeFileSync(
              resolve(process.cwd(), '.husky/commit-msg'),
              'npx --no -- commitlint --edit $1'
            )
          }
          spinner.stop()
          console.log(chalk.green('初始化成功'))
        }
      })
    })
}
initProject()
program.parse(process.argv)
