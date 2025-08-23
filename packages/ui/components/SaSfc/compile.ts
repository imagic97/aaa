import * as Vue from 'vue'
import { type Component } from 'vue'

import {
  parse as sfc__parse,
  compileScript as sfc__compileScript,
  compileTemplate as sfc__compileTemplate,
  compileStyle as sfc__compileStyle,
  type SFCTemplateCompileOptions,
  type SFCStyleCompileOptions,
  MagicString,
  babelParse,
  walkIdentifiers,
  isInDestructureAssignment,
  isStaticProperty,
  extractIdentifiers,
  walk
} from '@vue/compiler-sfc'

import { transform as babel__transform } from '@babel/standalone'

type PreprocessLang = SFCStyleCompileOptions['preprocessLang']

/**
 * 生成随机编号
 */
const _generateId = (): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let ret = ''
  for (let i = 0; i < 6; i++) {
    const ri = Math.floor(Math.random() * characters.length)
    ret += characters[ri]
  }
  return ret
}

/**
 * Babel 转码
 *
 * @param source 代码
 * @param filename 文件名
 */
const _transformCode = (source: string, filename: string) => {
  const result = babel__transform(source, {
    sourceType: 'module',
    sourceMaps: false,
    presets: ['env'],
    envName:'production',
    filename
  })

  if (result !== null && result.code !== undefined && result.code !== null) {
    return result.code
  }

  return ''
}

/**
 * 引用依赖
 *
 * @param path 路径
 */
const _require = (path: string) => {
  switch (path) {
    case 'vue':
      return Vue
    default:
      throw new Error(`不支持的依赖：${path}`)
  }
}

/**
 * 创建 CommonJS 模块
 *
 * @param source 代码
 */
const _createModule = (source: string) => {
  const module: { exports: { [key: string]: any } } = {
    exports: {}
  }

  Function('exports', 'require', 'module', 'Vue', source)
    .apply(module.exports, [
      module.exports,
      _require,
      Vue,
      module
    ])

  return module
}

export default (source: string): {
  component: Component,
  stylesheet: string
} => {
  /**
   * 返回 Vue 组件构造
   */
  const component: { [key: string]: any } = {}

  /**
   * 返回 CSS 代码
   */
  let stylesheet: string = ''

  const id: string = _generateId()
  const isProd: boolean = false
  const sourceMap: boolean = false

  // 解析 SFC
  const result = sfc__parse(source, {
    sourceMap
  })

  if (result.errors.length !== 0) {
    throw result.errors[0]
  }

  const scoped: boolean = result.descriptor.styles.some(el => el.scoped === true)

  if (scoped) {
    component.__scopeId = 'data-v-' + id
  }

  /**
   * <template> 编译配置
   */
  let compileTemplateOptions: SFCTemplateCompileOptions | null = null
  if (result.descriptor.template !== null) {
    compileTemplateOptions = {
      source: result.descriptor.template.content,
      filename: result.descriptor.filename,
      id,
      scoped,
      slotted: result.descriptor.slotted,
      isProd,
      compilerOptions: {
        mode: 'module',
        sourceMap,
        scopeId: scoped ? 'data-v-' + id : undefined,
        slotted: result.descriptor.slotted
      },
      preprocessLang: result.descriptor.template.lang,
      preprocessCustomRequire: _require
    }
  }

  // 编译 <script>
  if (result.descriptor.script !== null || result.descriptor.scriptSetup !== null) {
    const scriptBlock = sfc__compileScript(result.descriptor, {
      id,
      isProd,
      sourceMap
    })

    if (compileTemplateOptions !== null && compileTemplateOptions.compilerOptions !== undefined) {
      compileTemplateOptions.compilerOptions.bindingMetadata = scriptBlock.bindings
    }

    const source = scriptBlock.content
    const transformed = _transformCode(source, result.descriptor.filename)

    Object.assign(component, _createModule(transformed).exports.default)
  }

  // 编译 <template>
  if (compileTemplateOptions !== null) {
    const templateBlock = sfc__compileTemplate(compileTemplateOptions)

    if (templateBlock.errors.length !== 0) {
      throw templateBlock.errors[0]
    }

    const source = templateBlock.code

    const transformed = _transformCode(source, result.descriptor.filename)

    Object.assign(component, _createModule(transformed).exports)
  }

  // 编译 <style>
  for (const el of result.descriptor.styles) {
    // CSS 预编译
    switch (el.lang) {
      case 'sass':
      case 'scss':
        el.lang = undefined
        break
    }

    const styleBlock = sfc__compileStyle({
      source: el.content,
      filename: result.descriptor.filename,
      id,
      scoped: el.scoped === true,
      trim: true,
      isProd,
      preprocessLang: el.lang as PreprocessLang,
      preprocessCustomRequire: _require
    })

    if (styleBlock.errors.length !== 0) {
      throw styleBlock.errors[0]
    }

    stylesheet = styleBlock.code
  }

  return { component, stylesheet }
}

function processModule (src: string, filename: string) {
  const s = new MagicString(src)

  try {

    const ast = babelParse(src, {
      sourceFilename: filename,
      sourceType: 'module',
    }).program.body


    const idToImportMap = new Map<string, string>()
    const declaredConst = new Set<string>()
    const importedFiles = new Set<string>()
    const importToIdMap = new Map<string, string>()

    function resolveImport (raw: string): string | undefined {
      const files:any = {}
      let resolved = raw
      const file =
        files[resolved] ||
        files[(resolved = raw + '.ts')] ||
        files[(resolved = raw + '.js')]
      return file ? resolved : undefined
    }

    function defineImport (node: Node, source: string) {
      const filename = resolveImport(source.replace(/^\.\/+/, 'src/'))
      if (!filename) {
        throw new Error(`File "${source}" does not exist.`)
      }
      if (importedFiles.has(filename)) {
        return importToIdMap.get(filename)!
      }
      importedFiles.add(filename)
      const id = `__import_${importedFiles.size}__`
      importToIdMap.set(filename, id)
      s.appendLeft(
        node.start!,
        `const ${id} = ${'modulesKey'}[${JSON.stringify(filename)}]\n`,
      )
      return id
    }

    function defineExport (name: string, local = name) {
      s.append(`\n${'exportKey'}(${'moduleKey'}, "${name}", () => ${local})`)
    }

    // 0. instantiate module
    s.prepend(
      `const ${'moduleKey'} = ${'modulesKey'}[${JSON.stringify(
        filename,
      )}] = { [Symbol.toStringTag]: "Module" }\n\n`,
    )

    // 1. check all import statements and record id -> importName map
    for (const node of ast) {
      // import foo from 'foo' --> foo -> __import_foo__.default
      // import { baz } from 'foo' --> baz -> __import_foo__.baz
      // import * as ok from 'foo' --> ok -> __import_foo__
      if (node.type === 'ImportDeclaration') {
        const source = node.source.value
        if (source.startsWith('./')) {
          const importId = defineImport(node, node.source.value)
          for (const spec of node.specifiers) {
            if (spec.type === 'ImportSpecifier') {
              idToImportMap.set(
                spec.local.name,
                `${importId}.${(spec.imported as Identifier).name}`,
              )
            } else if (spec.type === 'ImportDefaultSpecifier') {
              idToImportMap.set(spec.local.name, `${importId}.default`)
            } else {
              // namespace specifier
              idToImportMap.set(spec.local.name, importId)
            }
          }
          s.remove(node.start!, node.end!)
        }
      }
    }

    // 2. check all export statements and define exports
    for (const node of ast) {
      // named exports
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          if (
            node.declaration.type === 'FunctionDeclaration' ||
            node.declaration.type === 'ClassDeclaration'
          ) {
            // export function foo() {}
            defineExport(node.declaration.id!.name)
          } else if (node.declaration.type === 'VariableDeclaration') {
            // export const foo = 1, bar = 2
            for (const decl of node.declaration.declarations) {
              for (const id of extractIdentifiers(decl.id)) {
                defineExport(id.name)
              }
            }
          }
          s.remove(node.start!, node.declaration.start!)
        } else if (node.source) {
          // export { foo, bar } from './foo'
          const importId = defineImport(node, node.source.value)
          for (const spec of node.specifiers) {
            defineExport(
              (spec.exported as Identifier).name,
              `${importId}.${(spec as ExportSpecifier).local.name}`,
            )
          }
          s.remove(node.start!, node.end!)
        } else {
          // export { foo, bar }
          for (const spec of node.specifiers) {
            const local = (spec as ExportSpecifier).local.name
            const binding = idToImportMap.get(local)
            defineExport((spec.exported as Identifier).name, binding || local)
          }
          s.remove(node.start!, node.end!)
        }
      }

      // default export
      if (node.type === 'ExportDefaultDeclaration') {
        if ('id' in node.declaration && node.declaration.id) {
          // named hoistable/class exports
          // export default function foo() {}
          // export default class A {}
          const { name } = node.declaration.id
          s.remove(node.start!, node.start! + 15)
          s.append(`\n${'exportKey'}(${'moduleKey'}, "default", () => ${name})`)
        } else {
          // anonymous default exports
          s.overwrite(node.start!, node.start! + 14, `${'moduleKey'}.default =`)
        }
      }

      // export * from './foo'
      if (node.type === 'ExportAllDeclaration') {
        const importId = defineImport(node, node.source.value)
        s.remove(node.start!, node.end!)
        s.append(`\nfor (const key in ${importId}) {
        if (key !== 'default') {
          ${'exportKey'}(${'moduleKey'}, key, () => ${importId}[key])
        }
      }`)
      }
    }

    // 3. convert references to import bindings
    for (const node of ast) {
      if (node.type === 'ImportDeclaration') continue
      walkIdentifiers(node, (id, parent, parentStack) => {
        const binding = idToImportMap.get(id.name)
        if (!binding) {
          return
        }
        if (parent && isStaticProperty(parent) && parent.shorthand) {
          // let binding used in a property shorthand
          // { foo } -> { foo: __import_x__.foo }
          // skip for destructure patterns
          if (
            !(parent as any).inPattern ||
            isInDestructureAssignment(parent, parentStack)
          ) {
            s.appendLeft(id.end!, `: ${binding}`)
          }
        } else if (
          parent &&
          parent.type === 'ClassDeclaration' &&
          id === parent.superClass
        ) {
          if (!declaredConst.has(id.name)) {
            declaredConst.add(id.name)
            // locate the top-most node containing the class declaration
            const topNode = parentStack[1]
            s.prependRight(topNode.start!, `const ${id.name} = ${binding};\n`)
          }
        } else {
          s.overwrite(id.start!, id.end!, binding)
        }
      })
    }

    // 4. convert dynamic imports
    let hasDynamicImport = false
    walk(ast, {
      enter (node: Node, parent: Node) {
        if (node.type === 'Import' && parent.type === 'CallExpression') {
          const arg = parent.arguments[0]
          if (arg.type === 'StringLiteral' && arg.value.startsWith('./')) {
            hasDynamicImport = true
            s.overwrite(node.start!, node.start! + 6, 'dynamicImportKey')
            s.overwrite(
              arg.start!,
              arg.end!,
              JSON.stringify(arg.value.replace(/^\.\/+/, 'src/')),
            )
          }
        }
      },
    })

    return {
      code: s.toString(),
    }
  }
  catch (error) {
    console.error(error)
  }

}
