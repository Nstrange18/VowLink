import { describe, expect, test } from 'vitest'
import { getSpotifyEmbedUrl } from './spotify'
import { isDarkColor, getContrastRatio, getReadableTextColor, resolveWeddingColors } from './invitationColors'
import { getInvitationCardStyles } from './invitationCardStyles'
import { getUniqueWishes } from './invitationWishes'

describe('existing invitation helper behavior', () => {
  test('deduplicates wishes before sorting, retaining the first normalized match', () => {
    const first = { _id: 'first', guestName: ' Taylor ', message: 'Best  wishes', createdAt: '2030-01-01' }
    const laterDuplicate = { guestName: 'taylor', message: 'best wishes', createdAt: '2030-01-03' }
    const second = { _id: 'second', guestName: 'Morgan', message: 'Congratulations', createdAt: '2030-01-02' }
    const input = [first, laterDuplicate, second, { message: '  ' }]
    expect(getUniqueWishes(input)).toEqual([second, first])
    expect(input).toEqual([first, laterDuplicate, second, { message: '  ' }])
  })
  test.each([undefined, {}])('ignores non-array wish responses: %s', data => {
    expect(getUniqueWishes(data)).toEqual([])
  })
  test.each(['track', 'album', 'playlist'])('preserves Spotify %s embeds and autoplay parameters', type => {
    expect(getSpotifyEmbedUrl(`https://open.spotify.com/${type}/abc-123_?si=example`)).toBe(`https://open.spotify.com/embed/${type}/abc-123_?utm_source=generator&autoplay=1`)
  })
  test.each(['', undefined, 'https://example.test/song.mp3'])('does not turn non-Spotify audio into an embed: %s', value => {
    expect(getSpotifyEmbedUrl(value)).toBe('')
  })
  test('preserves default wedding colors and named/hex selection', () => {
    const defaults = [{ name: 'White', hex: '#FFFFFF' }, { name: 'Navy', hex: '#1A2E4A' }]
    expect(resolveWeddingColors([], defaults)).toEqual({ primary: '#1A2E4A', secondary: '#C9A84C', tertiary: '#C9A84C', selectedBgHex: null })
    expect(resolveWeddingColors(['unknown', '#abcdef', 'WHITE', 'Navy'], defaults)).toEqual({ primary: '#ABCDEF', secondary: '#FFFFFF', tertiary: '#1A2E4A', selectedBgHex: '#FFFFFF' })
    expect(resolveWeddingColors(['Navy'], defaults).secondary).toBe('#C9A84C')
    expect(resolveWeddingColors(['White'], defaults).secondary).toBe('#FFFFFF')
  })
  test('preserves contrast choices for light/dark and unknown backgrounds', () => {
    expect(isDarkColor('#000000')).toBe(true)
    expect(isDarkColor('#FFFFFF')).toBe(false)
    expect(isDarkColor('#999')).toBe(false)
    expect(getContrastRatio('#000000', '#FFFFFF')).toBe(21)
    expect(getReadableTextColor('#FFFFFF', '#000000')).toBe('#000000')
    expect(getReadableTextColor('#FFFFFF', '#FFFFFF')).toBe('#070A13')
    expect(getReadableTextColor('unknown', '#000000')).toBe('#F5EBD6')
  })
  const styles = overrides => getInvitationCardStyles({ activeFont: 'test-font', cardTheme: 'floral', selectedBgHex: null, customTextColor: '#1A2E4A', secHex: '#C9A84C', customCardBg: '', ...overrides })
  test('retains theme defaults and explicit text overrides', () => {
    expect(styles({ selectedBgHex: '#FFFFFF' })).toEqual({ background: '#FFFFFF', color: '#1A2E4A', fontFamily: 'test-font' })
    expect(styles({ cardTheme: 'minimalist' }).color).toBe('#2E3A59')
    expect(styles({ cardTheme: 'navy' }).color).toBe('#D8B76A')
    expect(styles({ cardTheme: 'stardust' }).color).toBe('#FFFFFF')
    expect(styles({ cardTheme: 'forest' }).color).toBe('#C9A84C')
    expect(styles({ cardTheme: 'navy', customTextColor: '#123456' }).color).toBe('#123456')
  })
  test.each([
    ['/templates/Blush Pink Watercolor.webp', '#3D2124'],
    ['/templates/template_pro_7.webp', '#D8B76A'],
    ['/Free Plan Vowlink/Example.webp', '#1A2E4A'],
    ['/Plus Plans Vowlink/Midnight.webp', '#F5EBD6'],
    ['/Plus Plans Vowlink/Example.webp', '#1A2E4A'],
    ['/Pro Plans Vowlink/Celestial.webp', '#F5EBD6'],
    ['/Pro Plans Vowlink/Example.webp', '#1A2E4A'],
    ['https://res.cloudinary.com/example/ai_backgrounds/test.webp', '#F5EBD6'],
    ['https://images.example.test/upload.webp', '#1A2E4A'],
  ])('keeps custom-background defaults for %s', (customCardBg, color) => {
    expect(styles({ cardTheme: 'custom', customCardBg })).toEqual({ background: `url('${customCardBg}') 0% 0% / 100% 100% no-repeat`, color, fontFamily: 'test-font' })
  })
})
