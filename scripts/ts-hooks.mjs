// Lets plain Node scripts import the app's TypeScript through the `#/` alias,
// e.g. `node --import ./scripts/ts-hooks.mjs scripts/doodles/preview.mjs`.
// Node strips the types itself; this only adds the missing `.ts` extension.
import { registerHooks } from 'node:module'

const SRC = new URL('../src/', import.meta.url)

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('#/')) return next(new URL(`${specifier.slice(2)}.ts`, SRC).href, context)
    return next(specifier, context)
  },
})
