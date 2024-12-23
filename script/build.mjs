import * as esbuild from 'esbuild'

esbuild
  .build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    platform: 'node',
    outfile: 'lib/index.cjs',
    banner: { js: '#!/usr/bin/env node' }, // 添加 shebang
    format: 'cjs',
    target: 'node14',
    logLevel: 'info',
    // 插件
    plugins: [
      {
        name: 'alias',
        setup({ onResolve, resolve }) {
          onResolve(
            { filter: /^prompts$/, namespace: 'file' },
            async ({ importer, resolveDir }) => {
              const result = await resolve('prompts/lib/index.js', {
                importer,
                resolveDir,
                kind: 'import-statement',
              })
              return result
            }
          )
        },
      },
    ],
  })
  .catch(() => process.exit(1))
