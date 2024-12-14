import * as Vue from 'vue'

import { type Component } from 'vue'

import {
  parse as sfc__parse,
  compileScript as sfc__compileScript,
  compileTemplate as sfc__compileTemplate,
  compileStyle as sfc__compileStyle,
  type SFCTemplateCompileOptions,
  type SFCStyleCompileOptions
} from '@vue/compiler-sfc'

import { transform as babel__transform } from '@babel/standalone'

import { compileString as sass__compileString } from 'sass'

type PreprocessLang = SFCStyleCompileOptions['preprocessLang']

const scssAdditional = `
@use "sass:math";
`

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
      throw new Error(`unsupported plugin：${path}`)
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
        el.content = sass__compileString(scssAdditional + el.content).css
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