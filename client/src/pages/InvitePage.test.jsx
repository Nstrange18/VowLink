import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../utils/api'
import InvitePage from './InvitePage'
import RsvpResponsePage from './RsvpResponsePage'

vi.mock('../utils/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
// Iconify fetches decorative icon data; it is not part of invitation behavior.
vi.mock('@iconify/react', () => ({ Icon: () => null }))
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }))

const slug = 'synthetic-invitation'
const invitationPath = `/invitations/slug/${slug}`
const makeInvitation = () => ({
  _id: 'synthetic-invitation-id',
  slug,
  guestName: 'Taylor Guest',
  greeting: 'Dear Taylor Guest,',
  customMessage: 'Please join us for our special day.',
  allowedGuests: 1,
  hasRSVPed: false,
  userId: {
    partner1Name: 'Alex',
    partner2Name: 'Morgan',
    tier: 'plus',
    defaultGuestTheme: 'light',
    venue: 'The Test Garden',
    weddingColors: [],
    galleryPhotos: [],
    musicUrl: '',
    registryEnabled: false,
  },
})

function renderInvitation() {
  const setThemePreference = vi.fn()
  render(
    <MemoryRouter initialEntries={[`/invite/${slug}`]}>
      <Routes>
        <Route path="/invite/:slug" element={<InvitePage setThemePreference={setThemePreference} />} />
        <Route path="/rsvp-response" element={<RsvpResponsePage />} />
      </Routes>
    </MemoryRouter>,
  )
  return { user: userEvent.setup(), setThemePreference }
}

async function openRsvp(user) {
  await user.click(await screen.findByRole('button', { name: /^open$/i }))
  // Follow the real envelope transition without hard-coded sleeps.
  await waitForElementToBeRemoved(() => screen.queryByRole('button', { name: /^open$/i }), { timeout: 2500 })
  await user.click(screen.getByRole('button', { name: /rsvp now/i }))
  expect(screen.getByRole('heading', { name: 'Your RSVP' })).not.toBeNull()
}

describe('public invitation experience', () => {
  beforeEach(() => {
    api.get.mockReset().mockImplementation((url) => {
      if (url === invitationPath) return Promise.resolve({ data: makeInvitation() })
      if (url === `${invitationPath}/wishes`) return Promise.resolve({ data: [] })
      throw new Error(`Unexpected API GET: ${url}`)
    })
    api.post.mockReset().mockImplementation((url) => {
      throw new Error(`Unexpected API POST: ${url}`)
    })
    vi.mocked(toast.error).mockClear()
  })

  test('shows the loading state while the invitation request is pending', () => {
    api.get.mockImplementation((url) => {
      if (url === invitationPath) return new Promise(() => {})
      if (url === `${invitationPath}/wishes`) return Promise.resolve({ data: [] })
      throw new Error(`Unexpected API GET: ${url}`)
    })
    renderInvitation()

    expect(screen.getByText('Loading your invitation...')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /rsvp now/i })).toBeNull()
    expect(api.get).toHaveBeenCalledWith(invitationPath)
  })

  test('loads the named invitation and applies its guest theme', async () => {
    const { setThemePreference } = renderInvitation()

    expect(await screen.findByRole('heading', { name: 'Alex & Morgan' })).not.toBeNull()
    expect(screen.getByText('Dear Taylor Guest,')).not.toBeNull()
    expect(screen.getByText('Please join us for our special day.')).not.toBeNull()
    expect(screen.queryByText('Loading your invitation...')).toBeNull()
    expect(setThemePreference).toHaveBeenCalledWith('light', { savePreference: false })
  })

  test('shows invitation-not-found after a 404 response', async () => {
    api.get.mockImplementation((url) => {
      if (url === invitationPath) return Promise.reject({ response: { status: 404 } })
      if (url === `${invitationPath}/wishes`) return Promise.resolve({ data: [] })
      throw new Error(`Unexpected API GET: ${url}`)
    })
    renderInvitation()

    expect(await screen.findByRole('heading', { name: 'Invitation Not Found' })).not.toBeNull()
    expect(screen.getByText('Please check the link you received.')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /rsvp now/i })).toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('validates required name and phone without submitting', async () => {
    const { user } = renderInvitation()
    await openRsvp(user)
    // Existing labels are not associated with inputs; use the prefilled value
    // and placeholder rather than DOM structure or changing production markup.
    await user.clear(screen.getByDisplayValue('Taylor Guest'))
    await user.type(screen.getByPlaceholderText('+234 800 000 0000'), '123')
    await user.click(screen.getByRole('button', { name: 'Submit RSVP' }))

    expect(await screen.findByText('Name is required')).not.toBeNull()
    expect(await screen.findByText('Enter a valid phone number')).not.toBeNull()
    expect(api.post).not.toHaveBeenCalled()
  })

  test.each([
    ['Yes', 'Thank You!'],
    ['No', "We'll Miss You"],
  ])('submits a %s response and navigates to its confirmation', async (attending, heading) => {
    api.post.mockResolvedValue({ data: {} })
    const { user } = renderInvitation()
    await openRsvp(user)
    await user.type(screen.getByPlaceholderText('+234 800 000 0000'), '+2348000000000')
    await user.type(screen.getByPlaceholderText('your@email.com'), 'taylor@example.test')
    await user.type(screen.getByPlaceholderText('A note for the couple...'), 'Congratulations!')
    await user.click(screen.getByRole('button', { name: attending, exact: true }))
    await user.click(screen.getByRole('button', { name: 'Submit RSVP' }))

    expect(await screen.findByRole('heading', { name: heading })).not.toBeNull()
    expect(screen.getByText('Alex & Morgan')).not.toBeNull()
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/rsvps', {
      invitationId: 'synthetic-invitation-id',
      guestName: 'Taylor Guest',
      guestEmail: 'taylor@example.test',
      phone: '+2348000000000',
      attending,
      mealPreference: 'No Preference',
      message: 'Congratulations!',
    })
  })

  test('keeps the RSVP form available after a failed submission and allows retry', async () => {
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Please try again shortly.' } } })
      .mockResolvedValueOnce({ data: {} })
    const { user } = renderInvitation()
    await openRsvp(user)
    await user.type(screen.getByPlaceholderText('+234 800 000 0000'), '+2348000000000')
    await user.click(screen.getByRole('button', { name: 'Submit RSVP' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please try again shortly.'))
    expect(screen.getByRole('heading', { name: 'Your RSVP' })).not.toBeNull()
    const retry = screen.getByRole('button', { name: 'Submit RSVP' })
    expect(retry.disabled).toBe(false)
    await user.click(retry)
    expect(await screen.findByRole('heading', { name: 'Thank You!' })).not.toBeNull()
    expect(api.post).toHaveBeenCalledTimes(2)
  })
})
