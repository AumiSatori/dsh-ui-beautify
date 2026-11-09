import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname, join} from 'node:path'

const require = createRequire(import.meta.url)
const playwright = dirname(require.resolve('playwright/package.json'))
const {babelParse, traverse} = require(join(playwright, 'lib/transform/babelBundle.js'))
const reactMembers = new Set(['memo', 'forwardRef', 'useState', 'useRef', 'useMemo', 'useCallback', 'useEffect', 'useLayoutEffect', 'useContext', 'useId', 'useReducer', 'useSyncExternalStore', 'createContext', 'createElement', 'cloneElement', 'isValidElement'])

// Resolve exported primitives and their exact dependency declarations from the
// installed frontend. Minifier names can change without changing these exports.
// React comes from the isolated fixture so Hooks share its renderer instance.
export function nativeFrontendModule(source, exports) {
  const ast = babelParse(source, 'native-frontend.js', true)
  let scope
  traverse(ast, {Program(path) {scope = path.scope; path.stop()}})
  const aliases = new Map(), declarations = new Map(), visiting = new Set()

  function collect(name) {
    if (aliases.has(name) || declarations.has(name) || visiting.has(name)) return
    const binding = scope.getBinding(name)
    assert.ok(binding, 'Native frontend binding ' + name)
    visiting.add(name)
    binding.path.traverse({
      MemberExpression(path) {
        const {object, property, computed} = path.node
        if (computed || object.type !== 'Identifier' || property.type !== 'Identifier') return
        const owner = path.scope.getBinding(object.name)
        if (owner?.scope !== scope) return
        if (reactMembers.has(property.name)) aliases.set(object.name, 'React')
        if (property.name === 'jsx' || property.name === 'jsxs') aliases.set(object.name, 'jsxRuntime')
        if (property.name === 'createPortal' || property.name === 'flushSync') aliases.set(object.name, 'ReactDOM')
      },
    })
    binding.path.traverse({
      ReferencedIdentifier(path) {
        const dependency = path.scope.getBinding(path.node.name)
        if (dependency?.scope === scope && dependency !== binding) collect(path.node.name)
      },
    })
    const node = binding.path.node
    const code = node.type === 'VariableDeclarator'
      ? `const ${source.slice(node.start, node.end)};`
      : source.slice(node.start, node.end)
    declarations.set(name, {start: node.start, code})
    visiting.delete(name)
  }

  const names = {}
  for (const name of exports) {
    const binding = source.match(new RegExp(`\\b${name}:([\\w$]+)`))?.[1]
    assert.ok(binding, 'Native frontend export ' + name)
    names[name] = binding
    collect(binding)
  }
  const prefix = [...aliases].map(([name, value]) => `const ${name}=${value};`).join('\n')
  const body = [...declarations].filter(([name]) => !aliases.has(name)).map(([, value]) => value).sort((a, b) => a.start - b.start).map(value => value.code).join('\n')
  return {code: prefix + '\n' + body, names}
}
