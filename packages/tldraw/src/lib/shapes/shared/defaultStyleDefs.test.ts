import { getFontDefForExport } from './defaultStyleDefs'

jest.mock('@bigbluebutton/editor', () => ({
	DefaultFontStyle: { id: 'tldraw:font' },
	DefaultFontFamilies: { draw: "'tldraw_draw', sans-serif" },
}))

describe('draw font SVG export', () => {
	it('embeds both faces and preserves their separate Unicode ranges', async () => {
		jest.useRealTimers()
		const originalFonts = document.fonts
		const originalFetch = globalThis.fetch
		Object.defineProperty(document, 'fonts', {
			configurable: true,
			value: new Set([
				{
					family: 'tldraw_draw',
					$$_url: '/latin.woff2',
					$$_fontface:
						'@font-face { font-family: tldraw_draw; unicode-range: U+0000-00FF; src: url("/latin.woff2") }',
				},
				{
					family: 'tldraw_draw',
					$$_url: '/japanese.woff2',
					$$_fontface:
						'@font-face { font-family: tldraw_draw; unicode-range: U+4E00-9FFF; src: url("/japanese.woff2") }',
				},
			]),
		})
		globalThis.fetch = jest.fn(async () => ({ blob: async () => new Blob(['font']) })) as any
		try {
			const element = (await getFontDefForExport('draw').getElement()) as SVGStyleElement
			expect(globalThis.fetch).toHaveBeenCalledTimes(2)
			expect(element.textContent).toContain('unicode-range: U+0000-00FF')
			expect(element.textContent).toContain('unicode-range: U+4E00-9FFF')
			expect(element.textContent?.match(/data:.*?;base64,/g)).toHaveLength(2)
			expect(element.textContent).not.toContain('/latin.woff2')
			expect(element.textContent).not.toContain('/japanese.woff2')
		} finally {
			globalThis.fetch = originalFetch
			Object.defineProperty(document, 'fonts', { configurable: true, value: originalFonts })
		}
	})
})
