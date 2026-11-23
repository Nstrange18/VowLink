import { beforeAll, beforeEach, afterAll, expect, test, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '../../utils/api'
import { toast } from 'react-toastify'
import { CURRENCIES, formatNgnPrice } from '../../utils/pricingCurrencies'

vi.mock('../../utils/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('@iconify/react', () => ({ Icon: () => null }))
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }))
let AdminBillingPage
beforeAll(async () => {
  vi.stubEnv('VITE_PAYSTACK_PUBLIC_KEY', 'pk_test_synthetic_only')
  AdminBillingPage = (await import('./AdminBillingPage')).default
})
afterAll(() => vi.unstubAllEnvs())
beforeEach(() => {
  window.history.replaceState(null, '', '/')
  localStorage.setItem('user', JSON.stringify({ id: 'synthetic-owner', email: 'owner@example.test', tier: 'unpaid' }))
  localStorage.setItem('vowlink-billing-currency', 'NGN')
  api.get.mockReset().mockResolvedValue({ data: {} }); api.post.mockReset().mockImplementation(async (_url, { tier }) => ({ data: { accessCode: `server-${tier}`, authorizationUrl: 'https://checkout.paystack.com/synthetic', reference: 'synthetic', currency: 'NGN', amount: { free: 150000, plus: 200000, pro: 500000 }[tier] } }))
})
const card = name => screen.getByRole('heading', { name }).parentElement.parentElement
test('renders all three approved package prices', () => {
  render(<AdminBillingPage />)
  expect(within(card('Pro Plan')).getByText('NGN 5,000')).not.toBeNull()
  expect(within(card('Classic Plan')).getByText('NGN 1,500')).not.toBeNull()
  expect(within(card('Plus Plan')).getByText('NGN 2,000')).not.toBeNull()
  expect(screen.getByText(/NGN 5,000\. Staff mode/)).not.toBeNull()
  expect(screen.queryByText(/120,000/)).toBeNull()
})
test.each([['Pro Plan', 500000, 'pro'], ['Plus Plan', 200000, 'plus'], ['Classic Plan', 150000, 'free']])('initializes %s with the correct raw kobo amount and no hosted plan', async (name, amount, tier) => {
  const resumeTransaction = vi.fn()
  vi.stubGlobal('PaystackPop', class { resumeTransaction = resumeTransaction })
  render(<AdminBillingPage />)
  await userEvent.setup().click(within(card(name)).getByRole('button', { name: `Upgrade to ${name}` }))
  await waitFor(() => expect(resumeTransaction).toHaveBeenCalledTimes(1))
  expect(api.post).toHaveBeenCalledWith('/auth/upgrade/initialize', { tier })
  expect(resumeTransaction).toHaveBeenCalledWith(`server-${tier}`, expect.objectContaining({ onSuccess: expect.any(Function), onCancel: expect.any(Function) }))
  expect({ free: 150000, plus: 200000, pro: 500000 }[tier]).toBe(amount)
})
test('legacy SDK fallback opens the same server-initialized checkout', async () => {
  const openIframe = vi.fn(); const setup = vi.fn(() => ({ openIframe }))
  vi.stubGlobal('PaystackPop', { setup })
  const open = vi.spyOn(window, 'open').mockImplementation(() => null)
  render(<AdminBillingPage />)
  await userEvent.setup().click(within(card('Pro Plan')).getByRole('button', { name: 'Upgrade to Pro Plan' }))
  await waitFor(() => expect(open).toHaveBeenCalledWith('https://checkout.paystack.com/synthetic', '_self'))
  expect(setup).not.toHaveBeenCalled()
  open.mockRestore()
})
test('existing Pro remains current and cannot accidentally be purchased again', () => {
  localStorage.setItem('user', JSON.stringify({ id: 'synthetic-owner', tier: 'pro' }))
  render(<AdminBillingPage />)
  expect(within(card('Pro Plan')).getByRole('button', { name: 'Current Plan' }).disabled).toBe(true)
  expect(within(card('Classic Plan')).getByRole('button', { name: 'Included in your plan' }).disabled).toBe(true)
  expect(within(card('Plus Plan')).getByRole('button', { name: 'Included in your plan' }).disabled).toBe(true)
})

test('pending initialization prevents duplicate requests and cancellation unlocks checkout', async () => {
  let resolve
  api.post.mockImplementationOnce(() => new Promise(done => { resolve = done }))
  const resumeTransaction = vi.fn()
  vi.stubGlobal('PaystackPop', class { resumeTransaction = resumeTransaction })
  render(<AdminBillingPage />)
  const user = userEvent.setup()
  const button = within(card('Pro Plan')).getByRole('button', { name: 'Upgrade to Pro Plan' })
  await user.click(button); await user.click(button)
  expect(api.post).toHaveBeenCalledTimes(1)
  resolve({ data: { currency: 'NGN', amount: 500000, accessCode: 'server-pro' } })
  await waitFor(() => expect(resumeTransaction).toHaveBeenCalledTimes(1))
  resumeTransaction.mock.calls[0][1].onCancel()
  await waitFor(() => expect(button.disabled).toBe(false))
})

test('failed hosted verification retains its reference for a safe refresh retry', async () => {
  window.history.replaceState(null, '', '/admin/billing?paymentTier=pro&reference=synthetic-return')
  api.post.mockRejectedValueOnce(new Error('Provider unavailable'))
  render(<AdminBillingPage />)
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/upgrade/verify', { tier: 'pro', reference: 'synthetic-return' }))
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('synthetic-return')))
  expect(window.location.search).toContain('reference=synthetic-return')
  expect(JSON.parse(localStorage.getItem('user')).tier).toBe('unpaid')
})
test.each(Object.keys(CURRENCIES))('shows %s estimates while initializing NGN checkout on the server', async currency => {
  const resumeTransaction = vi.fn()
  vi.stubGlobal('PaystackPop', class { resumeTransaction = resumeTransaction })
  render(<AdminBillingPage />)
  const user = userEvent.setup()
  await user.selectOptions(screen.getByRole('combobox'), currency)
  for (const [name, price] of [['Classic Plan', 1500], ['Plus Plan', 2000], ['Pro Plan', 5000]]) expect(within(card(name)).getByText(formatNgnPrice(price, currency))).not.toBeNull()
  await user.click(within(card('Pro Plan')).getByRole('button', { name: 'Upgrade to Pro Plan' }))
  await waitFor(() => expect(resumeTransaction).toHaveBeenCalledWith('server-pro', expect.any(Object)))
  expect(api.post).toHaveBeenCalledWith('/auth/upgrade/initialize', { tier: 'pro' })
})

test.each(['network', 'stale price'])('prevents checkout and permits retry after %s failure', async failure => {
  const resumeTransaction = vi.fn()
  vi.stubGlobal('PaystackPop', class { resumeTransaction = resumeTransaction })
  if (failure === 'network') api.post.mockRejectedValueOnce(new Error('Unavailable'))
  else api.post.mockResolvedValueOnce({ data: { currency: 'NGN', amount: 1 } })
  render(<AdminBillingPage />)
  const button = within(card('Pro Plan')).getByRole('button', { name: 'Upgrade to Pro Plan' })
  await userEvent.setup().click(button)
  await waitFor(() => expect(button.disabled).toBe(false))
  expect(resumeTransaction).not.toHaveBeenCalled()
})
