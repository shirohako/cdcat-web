import { describe, expect, it } from 'vitest'
import { autoCropTolerance, isSquare, outputSize, squareCrop } from '../../app/utils/imageCrop'

describe('image crop', () => {
  it('accepts images within two percent of square', () => {
    expect(isSquare(1000, 1000)).toBe(true)
    expect(isSquare(1500, 1523)).toBe(true)
    expect(isSquare(1500, 1540)).toBe(false)
    expect(isSquare(1500, 1540, autoCropTolerance)).toBe(true)
    expect(isSquare(0, 0)).toBe(false)
  })

  it('takes the centred square, moved by the offset', () => {
    expect(squareCrop(1600, 1000)).toEqual({ x: 300, y: 0, size: 1000 })
    expect(squareCrop(1600, 1000, -1)).toEqual({ x: 0, y: 0, size: 1000 })
    expect(squareCrop(1600, 1000, 1)).toEqual({ x: 600, y: 0, size: 1000 })
    expect(squareCrop(800, 1200)).toEqual({ x: 0, y: 200, size: 800 })
  })

  it('never upscales', () => {
    expect(outputSize(800)).toBe(800)
    expect(outputSize(5000)).toBe(3000)
  })
})
