import { describe, expect, it } from 'vitest'
import { autoCropTolerance, clampCrop, coverRatio, coverShape, isSquare, outputSize, resizeCrop, squareCrop } from '../../app/utils/imageCrop'

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

  it('keeps a moved crop inside the image', () => {
    expect(clampCrop(1600, 1000, { x: -50, y: 20, size: 1000 })).toEqual({ x: 0, y: 0, size: 1000 })
    expect(clampCrop(1600, 1000, { x: 1500, y: 900, size: 400 })).toEqual({ x: 1200, y: 600, size: 400 })
    expect(clampCrop(1600, 1000, { x: 10.5, y: 3.25, size: 500 })).toEqual({ x: 10.5, y: 3.25, size: 500 })
  })

  it('keeps the side between the minimum and the short side', () => {
    expect(clampCrop(1600, 1000, { x: 0, y: 0, size: 2000 }).size).toBe(1000)
    expect(clampCrop(1600, 1000, { x: 0, y: 0, size: 100 }, 300).size).toBe(300)
    expect(clampCrop(200, 400, { x: 0, y: 0, size: 100 }, 300).size).toBe(200)
  })

  it('resizes around the centre', () => {
    expect(resizeCrop(1600, 1000, { x: 300, y: 0, size: 1000 }, 500)).toEqual({ x: 550, y: 250, size: 500 })
    // Grown back at the edge, it is pushed inside again.
    expect(resizeCrop(1600, 1000, { x: 1100, y: 500, size: 500 }, 1000)).toEqual({ x: 600, y: 0, size: 1000 })
  })

  it('never upscales', () => {
    expect(outputSize(800)).toBe(800)
    expect(outputSize(5000)).toBe(3000)
  })

  it('sorts would-be covers by what the editor does with them', () => {
    expect(coverShape(1500, 1523)).toBe('square')
    // Nearly square: cropped to the centre without asking.
    expect(coverShape(1500, 1540)).toBe('near')
    expect(coverShape(1000, 1052)).toBe('near')
    // Any other shape asks: crop it or keep it, up to 2:1 plus the two percent.
    expect(coverShape(1000, 1060)).toBe('off')
    expect(coverShape(1500, 2100)).toBe('off')
    expect(coverShape(2040, 1000)).toBe('off')
    expect(coverShape(2050, 1000)).toBe('too_wide')
    expect(coverShape(3000, 1000)).toBe('too_wide')
    // Too small whatever its shape, as cropping can't mend it.
    expect(coverShape(450, 450)).toBe('too_small')
    expect(coverShape(2000, 499)).toBe('too_small')
    expect(coverShape(0, 0)).toBe('too_small')
    expect(coverShape(3000, 1000, { maxRatio: 3 })).toBe('off')
    expect(coverShape(300, 300, { minSize: 200 })).toBe('square')
  })

  it('gives the album page a cover\'s own shape only when it is not square', () => {
    expect(coverRatio(1500, 1523)).toBe(1)
    expect(coverRatio(null, null)).toBe(1)
    expect(coverRatio(1000, 1400)).toBeCloseTo(0.714, 3)
    expect(coverRatio(1600, 900)).toBeCloseTo(1.778, 3)
    // Kept within 1:2 … 2:1.
    expect(coverRatio(1000, 2040)).toBe(0.5)
    expect(coverRatio(3000, 1000)).toBe(2)
  })
})
