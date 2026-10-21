import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'react-toastify'
import { PREMADE_TEMPLATES } from '../utils/templateLayouts'
import api from '../utils/api'
import InvitePage from './InvitePage'

vi.mock('../utils/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@iconify/react', () => ({ Icon: () => null }))
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

const invitation = (settings = {}) => ({
  _id: 'section-test-invitation', slug: 'section-test', guestName: 'Synthetic Guest',
  greeting: 'Dear Synthetic Guest,', customMessage: 'A personal invitation message.',
  category: 'Family', allowedGuests: 2, hasRSVPed: false,
  userId: {
    partner1Name: 'Alex', partner2Name: 'Morgan', tier: 'pro', cardTheme: 'floral',
    weddingDate: '2030-06-15T12:00:00.000Z', weddingTime: '14:30',
    venue: '1 Garden Road', venueName: 'Garden Hall', receptionLocation: '2 Lake Road',
    receptionName: 'Lake Hall', dressCode: 'Formal', weddingColors: ['Navy Blue', '#FFFFFF'],
    plusOnePolicy: 'plus_one_allowed', kidsAllowed: false,
    galleryPhotos: ['https://images.example.test/one.jpg', 'https://images.example.test/two.jpg'],
    timeline: [{ time: '14:30', title: 'Ceremony', description: 'Join us in the garden.', icon: 'ring' }],
    registryEnabled: true, registryNotes: 'Your presence is our greatest gift.',
    registryBankName: 'Synthetic Bank', registryAccountName: 'Alex and Morgan',
    registryAccountNumber: '0000000000', musicUrl: '', ...settings,
  },
})

let currentInvitation
let currentWishes
beforeEach(() => {
  currentInvitation = invitation()
  currentWishes = []
  api.get.mockReset().mockImplementation(url => {
    if (url === '/invitations/slug/section-test') return Promise.resolve({ data: currentInvitation })
    if (url === '/invitations/slug/section-test/wishes') return Promise.resolve({ data: currentWishes })
    throw new Error(`Unexpected GET: ${url}`)
  })
  api.post.mockReset().mockImplementation(() => { throw new Error('Unexpected POST') })
})

async function mountInvitation() {
  const user = userEvent.setup()
  let view
  await act(async () => {
    view = render(<MemoryRouter initialEntries={['/invite/section-test']}>
      <Routes><Route path="/invite/:slug" element={<InvitePage setThemePreference={vi.fn()} />} /></Routes>
    </MemoryRouter>)
  })
  expect(screen.getByText('Dear Synthetic Guest,')).not.toBeNull()
  return { ...view, user }
}

describe('invitation template and section contracts', () => {
  const templates = [
    ...['floral', 'minimalist', 'navy', 'stardust', 'forest'].map(cardTheme => ({ name: cardTheme, cardTheme })),
    ...PREMADE_TEMPLATES.map(t => ({ name: t.name, cardTheme: 'custom', customCardBg: t.url })),
    { name: 'uploaded background', cardTheme: 'custom', customCardBg: 'https://res.cloudinary.com/example/image/upload/ai_backgrounds/test.webp' },
  ]
  test.each(templates)('preserves the guest card and sections for $name', async ({ cardTheme, customCardBg }) => {
    currentInvitation = invitation({ cardTheme, customCardBg })
    const { container } = await mountInvitation()
    const card = container.querySelector('.download-card-section')
    expect(within(card).getByText('A personal invitation message.')).not.toBeNull()
    expect(within(card).getByText('Location: Garden Hall')).not.toBeNull()
    expect(within(card).getByText('Reception at: Lake Hall')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Our Gallery' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Wedding Schedule' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Gift Registry' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'RSVP Now' })).not.toBeNull()
    expect(screen.getByText('Counting Down')).not.toBeNull()
  })

  test('preserves customization, directions and paid/free location behavior', async () => {
    currentInvitation = invitation({ userHasCustomAlignment: true, customTextAlign: 'right', customTextColors: { message: '#123456' }, customHorizontalOffset: 12 })
    const { container, user } = await mountInvitation()
    expect(container.querySelector('.invite-card-content').className).toContain('text-right')
    expect(container.querySelector('.invite-card-content').style.transform).toBe('translateX(12px)')
    expect(container.querySelector('.invite-card-message').style.color).toBe('rgb(18, 52, 86)')
    await user.click(screen.getByRole('button', { name: 'Garden Hall', exact: true }))
    expect(screen.getByRole('link', { name: 'Google Maps' }).getAttribute('href')).toBe('https://www.google.com/maps/search/?api=1&query=1%20Garden%20Road')
    expect(screen.getByRole('link', { name: 'Apple Maps' }).getAttribute('href')).toBe('https://maps.apple.com/?q=1%20Garden%20Road')
    expect(screen.getByRole('link', { name: 'Waze' }).getAttribute('href')).toBe('https://waze.com/ul?q=1%20Garden%20Road')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Open in Maps')).toBeNull()
  })

  test('keeps free invitations non-clickable and omits unconfigured optional sections', async () => {
    currentInvitation = invitation({ tier: 'free', galleryPhotos: [], timeline: [], registryEnabled: false })
    await mountInvitation()
    expect(screen.queryByRole('button', { name: 'Garden Hall' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Our Gallery' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Wedding Schedule' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Gift Registry' })).toBeNull()
    expect(screen.getByText('Powered by VowLink')).not.toBeNull()
  })

  test('retains direct-audio preload, gesture playback, toggle and cleanup', async () => {
    const audio = { load: vi.fn(), play: vi.fn().mockResolvedValue(), pause: vi.fn(), addEventListener: vi.fn() }
    vi.stubGlobal('Audio', vi.fn(function () { return audio }))
    currentInvitation = invitation({ musicUrl: 'https://audio.example.test/wedding.mp3' })
    const { user, unmount } = await mountInvitation()
    expect(audio.src).toBe(currentInvitation.userId.musicUrl)
    expect(audio.loop).toBe(true)
    expect(audio.load).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /^open$/i }))
    expect(audio.play).toHaveBeenCalledTimes(1)
    await user.click(screen.getByTitle('Pause music'))
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(screen.getByTitle('Play music')).not.toBeNull()
    unmount()
    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.src).toBe('')
  })

  test('keeps Spotify embeds separate from direct audio', async () => {
    const audio = vi.fn()
    vi.stubGlobal('Audio', audio)
    currentInvitation = invitation({ musicUrl: 'https://open.spotify.com/playlist/synthetic123' })
    const { container, user } = await mountInvitation()
    expect(container.querySelector('iframe')).toBeNull()
    await user.click(screen.getByTitle('Play background soundtrack'))
    expect(container.querySelector('iframe').getAttribute('src')).toBe('https://open.spotify.com/embed/playlist/synthetic123?utm_source=generator&autoplay=1')
    expect(container.querySelector('iframe').getAttribute('loading')).toBe('lazy')
    expect(audio).not.toHaveBeenCalled()
  })

  test('retains gallery navigation and automatic slide advancement', async () => {
    vi.useFakeTimers()
    const { container } = await mountInvitation()
    const activePhoto = () => container.querySelector('img[alt="Couple photo 1"]').className.includes('opacity-100')
    expect(activePhoto()).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
    expect(activePhoto()).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }))
    expect(activePhoto()).toBe(true)
    // Keep React's state updates inside act while advancing the existing interval.
    act(() => vi.advanceTimersByTime(4000))
    expect(activePhoto()).toBe(false)
  })

  test('keeps registry copying and guestbook pagination/deduplication', async () => {
    currentWishes = Array.from({ length: 12 }, (_, i) => ({ _id: `wish-${i}`, guestName: `Guest ${i}`, message: `Congratulations ${i}`, createdAt: `2030-01-${String(i + 1).padStart(2, '0')}T12:00:00Z` }))
    currentWishes.push({ ...currentWishes[0], _id: 'duplicate' })
    const { user } = await mountInvitation()
    await user.click(screen.getByRole('button', { name: 'Copy Number' }))
    expect(await navigator.clipboard.readText()).toBe('0000000000')
    expect(toast.success).toHaveBeenCalledWith('Account number copied!')
    expect(screen.getAllByText(/^"Congratulations/)).toHaveLength(10)
    await user.click(screen.getByRole('button', { name: 'Show more wishes' }))
    expect(screen.getAllByText(/^"Congratulations/)).toHaveLength(12)
    await user.click(screen.getByRole('button', { name: 'Show less' }))
    expect(screen.getAllByText(/^"Congratulations/)).toHaveLength(10)
  })

  test.each([false, true])('preserves closed-deadline actions for hasRSVPed=%s', async (hasRSVPed) => {
    currentInvitation = { ...invitation({ rsvpDeadline: '2029-12-31T23:59:59.000Z' }), hasRSVPed }
    await mountInvitation()
    expect(screen.getByText('RSVP is now closed')).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'RSVP Now' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Update RSVP' })).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })
})
