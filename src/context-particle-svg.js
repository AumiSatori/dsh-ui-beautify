// Parse static local SVG into a clean image; never insert input XML into the page.
export function createParticleSVG(doc,win) {
  const document=doc,{DOMParser,XMLSerializer,CSSStyleSheet,CSSRule,Node}=win;
  const NS = 'http://www.w3.org/2000/svg'
  const nodes = new Set(['svg', 'g', 'defs', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'tspan', 'textPath', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'pattern', 'use', 'symbol', 'title', 'desc', 'style'])
  const attributes = new Set(('id class style viewBox preserveAspectRatio width height x y x1 y1 x2 y2 cx cy r rx ry d points transform fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color clip-path clip-rule mask maskUnits maskContentUnits gradientUnits gradientTransform spreadMethod offset stop-color stop-opacity fx fy fr patternUnits patternContentUnits patternTransform font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing dx dy rotate lengthAdjust textLength vector-effect paint-order visibility display href').split(' '))
  const properties = new Set(('fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray stroke-dashoffset opacity color clip-path clip-rule mask stop-color stop-opacity font-family font-size font-weight font-style text-anchor dominant-baseline alignment-baseline letter-spacing word-spacing vector-effect paint-order visibility display').split(' '))
  function safeValue(value) {
    // Internal paint/clip references are allowed; network/file/data resources and
    // escaped URLs are not. This applies to XML attributes and CSS declarations.
    const rest = value.replace(/url\(\s*(['"]?)#[\w.:-]+\1\s*\)/gi, '')
    return !/url\s*\(|(?:https?|file|data|blob|javascript)\s*:|\\|@|[<>]/i.test(rest)
  }
  function declarations(text) {
    const style = document.createElementNS(NS, 'g').style
    style.cssText = text
    const output = []
    for (const key of style) {
      const value = style.getPropertyValue(key)
      if (properties.has(key) && safeValue(value)) output.push(`${key}:${value}${style.getPropertyPriority(key) ? ' !important' : ''}`)
    }
    return output.join(';')
  }
  function stylesheet(text) {
    const sheet = new CSSStyleSheet()
    // @import is removed before parsing, including unsupported network rules.
    sheet.replaceSync(text.replace(/@import[^;{}]*(?:;|$)/gi, ''))
    const output = []
    for (const rule of sheet.cssRules) {
      if (rule.type !== CSSRule.STYLE_RULE || !/^[\w\s.#,>+~:-]+$/.test(rule.selectorText)) continue
      const content = declarations(rule.style.cssText)
      if (content) output.push(`${rule.selectorText}{${content}}`)
    }
    return output.join('\n')
  }
  function sanitize(text) {
    if (text.length > 2 * 1024 * 1024) throw new Error('SVG 不能超过 2 MB')
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('请导出不含 DOCTYPE / ENTITY 的普通 SVG')
    const input = new DOMParser().parseFromString(text, 'image/svg+xml')
    if (input.querySelector('parsererror') || input.documentElement.localName !== 'svg') throw new Error('SVG 格式不正确，请检查文件')
    if (input.querySelectorAll('*').length > 25000) throw new Error('SVG 节点过多，请先简化路径')
    const output = document.implementation.createDocument(NS, '')
    function copy(from, parent) {
      if (from.nodeType === Node.TEXT_NODE) { parent.appendChild(output.createTextNode(from.textContent)); return }
      if (from.nodeType !== Node.ELEMENT_NODE || (from.namespaceURI && from.namespaceURI !== NS) || !nodes.has(from.localName)) return
      const to = output.createElementNS(NS, from.localName)
      for (const attribute of from.attributes) {
        const key = attribute.localName, value = attribute.value
        if (!attributes.has(key)) continue
        if (key === 'href') {
          if (/^#[\w.:-]+$/.test(value)) to.setAttribute('href', value)
        } else if (key === 'style') {
          const clean = declarations(value)
          if (clean) to.setAttribute(key, clean)
        } else if (safeValue(value)) to.setAttribute(key, value)
      }
      parent.appendChild(to)
      if (from.localName === 'style') to.textContent = stylesheet(from.textContent)
      else for (const child of from.childNodes) copy(child, to)
      return to
    }
    const clean = copy(input.documentElement, output)
    const box = (clean.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
    let width, height
    if (box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) [width, height] = box.slice(2)
    else {
      width = parseFloat(clean.getAttribute('width'))
      height = parseFloat(clean.getAttribute('height'))
      if (!(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)) throw new Error('SVG 需要有效的 viewBox，或 width 与 height')
      clean.setAttribute('viewBox', `0 0 ${width} ${height}`)
    }
    const scale = Math.min(1, 4096 / Math.max(width, height))
    clean.setAttribute('width', String(Math.max(1, width * scale)))
    clean.setAttribute('height', String(Math.max(1, height * scale)))
    const xml = new XMLSerializer().serializeToString(clean)
    return { source: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`, xml }
  }
  return Object.freeze({sanitize})
}
