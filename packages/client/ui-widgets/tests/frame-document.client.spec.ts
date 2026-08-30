import { describe, expect, it } from 'vitest'
import { instrumentWidgetHtml } from '../src/client/frame-document.ts'

describe('fixed Widget canvas document', () => {
  it('denies scrolling and reports overflow to the parent bridge', () => {
    const document = instrumentWidgetHtml('<!doctype html><html><head><title>Widget</title></head><body></body></html>')
    expect(document).toContain('data-dsh-widget-canvas')
    expect(document).toContain('overflow:hidden')
    expect(document).toContain("kind:'layout'")
    expect(document).toContain('width>root.clientWidth+1||height>root.clientHeight+1')
  })

  it('injects the canvas rules into documents without a head', () => {
    const document = instrumentWidgetHtml('<main>Widget</main>')
    expect(document.indexOf('data-dsh-widget-canvas')).toBeLessThan(document.indexOf('<main>'))
  })

  it('exposes Host-owned state beside the permission-scoped fetch bridge', () => {
    const document = instrumentWidgetHtml('<main>Widget</main>')
    expect(document).toContain("displayMode:'compact'")
    expect(document).toContain("state:{get:()=>request('state.read'),set:state=>request('state.write',{state})}")
  })

  it('exposes expanded presentation and asks the Host to open on double-click', () => {
    const document = instrumentWidgetHtml('<main>Widget</main>', 'expanded')
    expect(document).toContain("displayMode:'expanded'")
    expect(document).toContain("kind:'open'")
    expect(document).toContain("addEventListener('dblclick'")
  })
})
