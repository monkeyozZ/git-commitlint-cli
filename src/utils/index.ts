import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { red, green, bold } from 'kleur/colors'
import ora from 'ora'
import { PackageManager, SetupResponse } from '../types'

export function getEslintVersion(): string | null {
  try {
    const versionOutput = execSync('npx eslint --version', {
      encoding: 'utf-8',
    })
    return versionOutput.trim()
  } catch (error) {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const eslintVersion = packageJson.devDependencies.eslint
      if (eslintVersion) {
        return eslintVersion.match(/\d+/)?.[0] ?? null
      }
    }
    return null
  }
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: T,
): T {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(
        source[key],
        deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>,
        ),
      )
    }
  }
  return { ...target, ...source }
}

export function checkPackageJsonConfig(keys: string[]): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    return keys.some((key) => key in packageJson)
  }
  return false
}

export function copyConfigFile(configDir: string, fileName: string) {
  const srcPath = path.join(configDir, fileName)
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (packageJson.type === 'module' && fileName === '.eslintrc.js') {
      fileName = '.eslintrc.cjs'
    }
  }

  const destPath = path.join(process.cwd(), fileName)
  const content = fs.readFileSync(srcPath, 'utf-8')

  fs.writeFileSync(destPath, content)
  console.log(green(`✨ ${fileName} 已创建`))
}

export function mergePackageJson(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
) {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    : {}

  packageJson.dependencies = {
    ...packageJson.dependencies,
    ...dependencies,
  }
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    ...devDependencies,
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log(green('✅ package.json 已更新'))
}

export async function installWithPackageManager(
  packageManager: PackageManager,
  response: SetupResponse,
) {
  console.log(bold(green('\n🚀 开始安装配置...\n')))

  await withSpinner('正在安装依赖', async () => {
    const installCommand = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install',
    }[packageManager]

    execSync(installCommand, { stdio: 'inherit' })
  })

  if (isHuskyIntegrated()) {
    await withSpinner('初始化 Husky', async () => {
      execSync('npx husky init', { stdio: 'inherit' })

      if (response.husky) {
        console.log(green('\n📝 配置 pre-commit 钩子...'))
        const preCommitPath = path.join('.husky', 'pre-commit')
        fs.writeFileSync(preCommitPath, 'npx lint-staged\n')
        fs.chmodSync(preCommitPath, '755')
        console.log(green('✅ pre-commit 钩子已配置'))
      }

      if (response.commitlint) {
        console.log(green('\n📝 配置 commit-msg 钩子...'))
        const commitMsgPath = path.join('.husky', 'commit-msg')
        fs.writeFileSync(
          commitMsgPath,
          'npx --no-install commitlint --edit $1\n',
        )
        fs.chmodSync(commitMsgPath, '755')
        console.log(green('✅ commit-msg 钩子已配置'))
      }
    })
  }

  console.log(bold(green('\n✨ 所有配置已完成！\n')))
}

function checkPackageJsonForDependencies(dependencies: string[]): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }

  return dependencies.some((dep) => dep in allDependencies)
}

export function isEslintIntegrated(): boolean {
  const eslintDependencies = ['eslint']
  return checkPackageJsonForDependencies(eslintDependencies)
}

export function isPrettierIntegrated(): boolean {
  const prettierDependencies = ['prettier']
  return checkPackageJsonForDependencies(prettierDependencies)
}

export function isHuskyIntegrated(): boolean {
  const huskyDependencies = ['husky']
  return checkPackageJsonForDependencies(huskyDependencies)
}

export function isCommitlintIntegrated(): boolean {
  const commitlintDependencies = [
    '@commitlint/cli',
    '@commitlint/config-conventional',
  ]
  return checkPackageJsonForDependencies(commitlintDependencies)
}

export function isCzGitIntegrated(): boolean {
  const czGitDependencies = ['cz-git', 'czg']
  return checkPackageJsonForDependencies(czGitDependencies)
}

export function checkExistingConfig(altForms: string[]): boolean {
  for (const form of altForms) {
    const configPath = path.join(process.cwd(), form)
    if (fs.existsSync(configPath)) {
      console.log(bold(red(`⚠️ 检测到已存在配置文件: ${form}`)))
      return true
    }
  }
  return checkPackageJsonConfig(altForms)
}

export async function mergeConfigFile(
  configDir: string,
  existingConfigPath: string,
  configKey: string,
) {
  if (existingConfigPath === 'package.json') {
    await withSpinner(`合并 ${configKey} 配置`, async () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json')
      const srcPath = path.join(configDir, path.basename(existingConfigPath))

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const newConfig = JSON.parse(fs.readFileSync(srcPath, 'utf-8'))

      packageJson[configKey] = deepMerge(
        packageJson[configKey] || {},
        newConfig[configKey],
      )

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    })
  }
}

// 添加一个通用的加载动画函数
async function withSpinner<T>(
  message: string,
  callback: () => Promise<T> | T,
): Promise<T> {
  const spinner = ora(bold(message)).start()
  try {
    const result = await callback()
    spinner.succeed(bold(green(message + ' 完成')))
    return result
  } catch (error) {
    spinner.fail(bold(red(message + ' 失败')))
    throw error
  }
}
