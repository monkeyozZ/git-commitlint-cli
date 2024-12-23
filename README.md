# git-commitlint-cli

项目快速集成 Eslint + Prettier + Husky + Commitlint + Lint-staged

## 介绍

`git-commitlint-cli` 是一个命令行工具，帮助开发者快速在项目中集成代码质量和格式化工具。通过简单的交互式命令行界面，用户可以选择需要集成的工具，并自动配置相应的依赖和配置文件。

## 功能

- **Eslint**: 代码质量检查工具
- **Prettier**: 代码格式化工具
- **Husky**: Git hooks 管理工具
- **Commitlint**: 提交信息校验工具
- **Lint-staged**: 在提交代码前对暂存区的文件进行 lint 检查
- **cz-git**: 辅助生成标准化的 commit message

## 安装

确保你的 Node.js 版本在 `v18.3.0` 及以上。

```bash
npm install -g git-commitlint-cli
```

## 使用

```bash
git-commitlint-cli
```
