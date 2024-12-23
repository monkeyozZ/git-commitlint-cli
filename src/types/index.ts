export type PackageManager = 'npm' | 'yarn' | 'pnpm'

export interface SetupResponse {
  language: 'javascript' | 'typescript'
  eslint: boolean
  prettier: boolean
  husky: boolean
  commitlint: boolean
  czGit: boolean
  packageManager: PackageManager
}
