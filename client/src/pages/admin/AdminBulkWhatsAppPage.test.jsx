import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import api from '../../utils/api'
import AdminBulkWhatsAppPage from './AdminBulkWhatsAppPage'

vi.mock('../../utils/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }))
vi.mock('@iconify/react', () => ({ Icon: () => null }))
vi.mock('../../components/PageMiniTour', () => ({ default: () => null }))
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() } }))

let invitation
beforeEach(() => {
  localStorage.setItem('user', JSON.stringify({ tier: 'pro', partner1Name: 'Alex', partner2Name: 'Morgan' }))
  invitation = { _id: 'synthetic-invite', guestName: 'Synthetic Guest', phoneNumber: '2348000000001', slug: 'synthetic-slug', senderGroup: 'general' }
  api.post.mockReset()
  api.patch.mockReset()
  api.get.mockReset().mockImplementation((url) => {
    if (url === '/invitations') return Promise.resolve({ data: [invitation] })
    if (url === '/whatsapp/config-status') return Promise.resolve({ data: { configured: true, usage: { remaining: 10, limit: 10, used: 0 } } })
    if (url === '/whatsapp/send-packs') return Promise.resolve({ data: { packs: [] } })
    if (url === '/whatsapp/send-history?limit=12') return Promise.resolve({ data: { history: [] } })
    throw new Error(`Unexpected API GET: ${url}`)
  })
})

async function openSender(status, reason = '') {
  invitation.whatsappStatus = status
  invitation.whatsappFailureReason = reason
  render(<MemoryRouter><AdminBulkWhatsAppPage /></MemoryRouter>)
  return within((await screen.findByText('Synthetic Guest')).closest('tr'))
}

test.each([
  ['marketing_limited', '', 'Marketing limited'],
  ['failed', 'This message was not delivered to maintain healthy ecosystem engagement.', 'Marketing limited'],
])('shows %s without an immediate resubmit and keeps manual sharing available', async (status, reason, label) => {
  const row = await openSender(status, reason)
  expect(row.getByText(label)).not.toBeNull()
  expect(row.getByText('WhatsApp temporarily limited marketing delivery to this recipient. Try again later or use manual WhatsApp sharing.')).not.toBeNull()
  expect(row.queryByTitle('Submit approved WhatsApp invite')).toBeNull()
  const open = vi.spyOn(window, 'open').mockImplementation(() => null)
  await userEvent.setup().click(row.getByTitle('Open manual WhatsApp chat'))
  expect(open).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/'), '_blank')
  await userEvent.setup().click(screen.getByRole('button', { name: 'Open next manual chat' }))
  expect(open).toHaveBeenCalledTimes(2)
  expect(api.post).not.toHaveBeenCalled()
  expect(api.patch).not.toHaveBeenCalled()
})

test.each([
  ['payment_issue', '', 'Payment issue', 'WhatsApp could not complete delivery because of a business billing or eligibility issue.'],
  ['failed', 'Business eligibility payment issue', 'Payment issue', 'WhatsApp could not complete delivery because of a business billing or eligibility issue.'],
  ['technical_failure', '', 'Could not send', 'We could not send this invite. Please try again.'],
])('shows a clear %s failure with manual sharing', async (status, reason, label, message) => {
  const row = await openSender(status, reason)
  expect(row.getByText(label)).not.toBeNull()
  expect(row.getByText(message)).not.toBeNull()
  expect(row.getByTitle('Submit approved WhatsApp invite')).not.toBeNull()
  expect(row.getByTitle('Open manual WhatsApp chat')).not.toBeNull()
})

test.each([
  ['queued', 'Submitted'], ['sent', 'Sent to WhatsApp'], ['delivered', 'Delivered'], ['read', 'Read'],
])('shows %s without a duplicate send action', async (status, label) => {
  const row = await openSender(status)
  expect(row.getByText(label)).not.toBeNull()
  expect(row.queryByTitle('Submit approved WhatsApp invite')).toBeNull()
})
