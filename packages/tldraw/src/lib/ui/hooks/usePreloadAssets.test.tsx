import { act, cleanup, renderHook } from '@testing-library/react'
import { usePreloadAssets } from './usePreloadAssets'

describe('draw font preloading', () => {
	const originalFontFace = globalThis.FontFace
	const originalFonts = document.fonts
	let faces: MockFontFace[]
	let registered: Set<FontFace>

	class MockFontFace {
		family: string
		unicodeRange: string
		resolve!: (face: MockFontFace) => void
		reject!: (error: Error) => void
		private loaded: Promise<MockFontFace>

		constructor(family: string, _source: string, descriptors: FontFaceDescriptors) {
			this.family = family
			this.unicodeRange = descriptors.unicodeRange ?? 'U+0-10FFFF'
			this.loaded = new Promise((resolve, reject) => {
				this.resolve = resolve
				this.reject = reject
			})
			faces.push(this)
		}

		load() {
			return this.loaded
		}
	}

	const assets = {
		fonts: { draw: '/latin.woff2', serif: '/serif', sansSerif: '/sans', monospace: '/mono' },
	}

	beforeEach(() => {
		faces = []
		registered = new Set()
		globalThis.FontFace = MockFontFace as unknown as typeof FontFace
		Object.defineProperty(document, 'fonts', { configurable: true, value: registered })
	})

	afterEach(() => {
		cleanup()
		globalThis.FontFace = originalFontFace
		Object.defineProperty(document, 'fonts', { configurable: true, value: originalFonts })
	})

	it('waits for the Japanese face even when all other fonts have loaded', async () => {
		const customAssets = { fonts: { ...assets.fonts, drawJapanese: '/japanese.woff2' } }
		const { result, unmount } = renderHook(() => usePreloadAssets(customAssets))
		await act(async () => {
			for (const face of faces.filter((face) => !face.unicodeRange.includes('4E00'))) {
				face.resolve(face)
			}
		})
		expect(result.current).toEqual({ done: false, error: false })

		const japanese = faces.find((face) => face.unicodeRange.includes('4E00'))!
		await act(async () => japanese.resolve(japanese))
		expect(result.current).toEqual({ done: true, error: false })
		expect([...registered].filter((face) => face.family === 'tldraw_draw')).toHaveLength(2)
		unmount()
		expect(registered.size).toBe(0)
	})

	it('keeps the original unrestricted single-face behavior when no Japanese URL is set', async () => {
		const { result } = renderHook(() => usePreloadAssets(assets))
		await act(async () => {
			for (const face of faces) face.resolve(face)
		})
		expect(result.current).toEqual({ done: true, error: false })
		const draw = [...registered].filter((face) => face.family === 'tldraw_draw')
		expect(draw).toHaveLength(1)
		expect(draw[0].unicodeRange).toBe('U+0-10FFFF')
	})

	it('reports a Japanese font download failure instead of declaring the editor ready', async () => {
		const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
		try {
			const customAssets = { fonts: { ...assets.fonts, drawJapanese: '/missing.woff2' } }
			const { result } = renderHook(() => usePreloadAssets(customAssets))
			await act(async () => {
				for (const face of faces) {
					if (face.unicodeRange.includes('4E00')) face.reject(new Error('Not found'))
					else face.resolve(face)
				}
			})
			expect(result.current.error).toBe(true)
		} finally {
			consoleError.mockRestore()
		}
	})
})
