import { red, green, bold, blue } from 'kleur/colors'
import prompts, { PromptObject } from 'prompts'
import path from 'path'
import ora from 'ora'
import fs from 'fs'
import {
  getEslintVersion,
  copyConfigFile,
  mergePackageJson,
  isEslintIntegrated,
  isPrettierIntegrated,
  isHuskyIntegrated,
  isCommitlintIntegrated,
  isCzGitIntegrated,
  checkExistingConfig,
  mergeConfigFile,
  installWithPackageManager,
} from './utils/index'
import { SetupResponse } from './types'

async function setupProject() {
  console.log(bold(blue('\n🚀 欢迎使用项目配置工具！\n')))

  const questions: PromptObject[] = [
    {
      type: 'select',
      name: 'language',
      message: bold(blue('请选择使用的语言类型')),
      choices: [
        { title: bold('JavaScript'), value: 'javascript' },
        { title: bold('TypeScript'), value: 'typescript' },
      ],
    },
    {
      type: 'confirm',
      name: 'eslint',
      message:
        bold(blue('是否需要集成 Eslint?')) + ' (Eslint 是一个代码质量检查工具)',
      initial: !isEslintIntegrated(),
    },
    {
      type: 'confirm',
      name: 'prettier',
      message:
        bold(blue('是否需要集成 Prettier?')) +
        ' (Prettier 是一个代码格式化工具)',
      initial: !isPrettierIntegrated(),
    },
    {
      type: 'confirm',
      name: 'husky',
      message:
        bold(blue('是否需要集成 Husky + Lint-staged?')) +
        ' (Husky 是一个用于管理 Git hooks 的工具)',
      initial: !isHuskyIntegrated(),
    },
    {
      type: 'confirm',
      name: 'commitlint',
      message:
        bold(blue('是否需要集成 Commitlint?')) +
        ' (Commitlint 是一个用于校验提交信息的工具)',
      initial: !isCommitlintIntegrated(),
    },
    {
      type: 'confirm',
      name: 'czGit',
      message:
        bold(blue('是否需要集成 cz-git?')) +
        ' (cz-git 是一个辅助生成标准化规范化的 commit message 的工具)',
      initial: !isCzGitIntegrated(),
    },
    {
      type: 'select',
      name: 'packageManager',
      message: bold(blue('请选择包管理工具')),
      choices: [
        { title: bold('npm'), value: 'npm' },
        { title: bold('yarn'), value: 'yarn' },
        { title: bold('pnpm'), value: 'pnpm' },
      ],
      initial: 2,
    },
  ]

  const response = (await prompts(questions, {
    onCancel: () => {
      console.log(red('\n❌ 操作已取消\n'))
      process.exit(0)
    },
  })) as SetupResponse

  const spinner = ora(bold('正在处理配置...')).start()

  try {
    const baseConfigDir = path.join(
      __dirname,
      '..',
      'presetConfig',
      response.language,
    )

    const dependencies: Record<string, string> = {}
    const devDependencies: Record<string, string> = {}

    const mergeDependenciesFromPreset = (configDir: string) => {
      const presetPackageJsonPath = path.join(configDir, 'package.json')
      if (fs.existsSync(presetPackageJsonPath)) {
        const presetPackageJson = JSON.parse(
          fs.readFileSync(presetPackageJsonPath, 'utf-8'),
        )
        Object.assign(dependencies, presetPackageJson.dependencies)
        Object.assign(devDependencies, presetPackageJson.devDependencies)
      } else {
        throw new Error(`${presetPackageJsonPath} 文件不存在`)
      }
    }

    if (response.eslint) {
      spinner.text = bold('配置 ESLint...')
      const eslintVersion = getEslintVersion()
      const isEslint9OrAbove = eslintVersion && parseInt(eslintVersion, 10) >= 9

      const eslintConfigDir = path.join(baseConfigDir, 'eslint')
      const altForms = isEslint9OrAbove
        ? ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
        : [
            '.eslintrc.js',
            '.eslintrc.cjs',
            '.eslintrc.yaml',
            '.eslintrc.yml',
            '.eslintrc.json',
            'eslintConfig',
          ]

      const existingConfig = checkExistingConfig(altForms)
      if (!existingConfig) {
        copyConfigFile(eslintConfigDir, '.eslintrc.js')
      }

      if (!isEslintIntegrated()) {
        mergeDependenciesFromPreset(eslintConfigDir)
      }
    }

    if (response.prettier) {
      spinner.text = bold('配置 Prettier...')
      const prettierConfigDir = path.join(baseConfigDir, 'prettier')
      const altForms = [
        '.prettierrc',
        '.prettierrc.js',
        '.prettierrc.mjs',
        '.prettierrc.cjs',
        '.prettierrc.json',
        '.prettierrc.yaml',
        '.prettierrc.yml',
        '.prettierrc.toml',
        'prettier.config.js',
        'prettier.config.cjs',
        'prettier.config.mjs',
      ]

      const existingConfig = checkExistingConfig(altForms)
      if (!existingConfig) {
        copyConfigFile(prettierConfigDir, '.prettierrc')
      }

      if (!isPrettierIntegrated()) {
        mergeDependenciesFromPreset(prettierConfigDir)
      }
    }

    if (response.husky) {
      spinner.text = bold('配置 Husky...')
      const huskyConfigDir = path.join(baseConfigDir, '..', 'base', 'husky')
      mergeDependenciesFromPreset(huskyConfigDir)

      // 生成 lint-staged 配置
      const lintStagedConfig: Record<string, string[]> = {}
      const fileExtensions =
        response.language === 'typescript' ? ['*.{ts,tsx}'] : ['*.{js,jsx}']

      // 需要 Prettier 格式化的文件类型
      const prettierExtensions = ['json', 'css', 'scss', 'less', 'md', 'html']

      if (response.eslint && response.prettier) {
        // ESLint 和 Prettier 都启用时
        lintStagedConfig[fileExtensions[0]] = [
          'eslint --fix',
          'prettier --write',
        ]
        lintStagedConfig[`*.{${prettierExtensions.join(',')}}`] = [
          'prettier --write',
        ]
      } else if (response.eslint) {
        // 只启用 ESLint
        lintStagedConfig[fileExtensions[0]] = ['eslint --fix']
      } else if (response.prettier) {
        // 只启用 Prettier
        lintStagedConfig[
          `*.{${[...fileExtensions[0].slice(2), ...prettierExtensions].join(',')}}`
        ] = ['prettier --write']
      }

      // 更新 package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      packageJson['lint-staged'] = lintStagedConfig

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      console.log(green('✨ 已添加 lint-staged 配置'))
    }

    if (response.czGit) {
      spinner.text = bold('配置 cz-git...')
      const czGitConfigDir = path.join(baseConfigDir, '..', 'base', 'cz-git')
      copyConfigFile(czGitConfigDir, 'cz.config.js')
      await mergeConfigFile(czGitConfigDir, 'package.json', 'config')

      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      packageJson.scripts = {
        ...packageJson.scripts,
        commit: 'czg',
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
      console.log(green('✨ 已添加 commit script'))

      if (!isCzGitIntegrated()) {
        mergeDependenciesFromPreset(czGitConfigDir)
      }
    }

    if (response.commitlint) {
      spinner.text = bold('配置 Commitlint...')
      const commitlintConfigDir = path.join(baseConfigDir, 'commitlint')
      const altForms = [
        '.commitlintrc',
        '.commitlintrc.json',
        '.commitlintrc.yaml',
        '.commitlintrc.yml',
        '.commitlintrc.js',
        '.commitlintrc.cjs',
        '.commitlintrc.mjs',
        '.commitlintrc.ts',
        '.commitlintrc.cts',
        'commitlint.config.js',
        'commitlint.config.cjs',
        'commitlint.config.mjs',
        'commitlint.config.ts',
        'commitlint.config.cts',
      ]

      const existingConfig = checkExistingConfig(altForms)
      if (!existingConfig) {
        copyConfigFile(commitlintConfigDir, '.commitlintrc')
      }

      if (!isCommitlintIntegrated()) {
        mergeDependenciesFromPreset(commitlintConfigDir)
      }
    }

    spinner.text = bold('更新 package.json...')
    mergePackageJson(dependencies, devDependencies)

    spinner.succeed(bold(green('配置文件处理完成！')))

    await installWithPackageManager(response.packageManager, response)
  } catch (error) {
    spinner.fail(bold(red('配置过程中出现错误')))
    console.error(red(String(error)))
    process.exit(1)
  }
}

setupProject()
