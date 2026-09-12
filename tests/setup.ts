import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(window, 'matchMedia', { writable: true, value: (query: string) => ({ matches: query.includes('reduce'), media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }) })
class ResizeObserverMock { observe() {} disconnect() {} unobserve() {} }
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
vi.stubGlobal('cancelAnimationFrame', () => undefined)
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext

// localStorage em memória para os testes de tema
const memoryStorage = new Map<string, string>()
const storageMock = {
  getItem: (key: string) => (memoryStorage.has(key) ? memoryStorage.get(key)! : null),
  setItem: (key: string, value: string) => { memoryStorage.set(key, String(value)) },
  removeItem: (key: string) => { memoryStorage.delete(key) },
  clear: () => memoryStorage.clear(),
  key: (index: number) => Array.from(memoryStorage.keys())[index] ?? null,
  get length() { return memoryStorage.size },
}
Object.defineProperty(window, 'localStorage', { value: storageMock, configurable: true })
