import { beforeAll, beforeEach, afterAll, expect, test, vi } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import api from '../../utils/api'

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
  localStorage.setItem('user', JSON.stringify({ id: 'synthetic-owner', email: 'owner@example.test', tier: 'unpaid' }))
  localStorage.setItem('vowlink-billing-currency', 'NGN')
  api.get.mockReset().mockResolvedValue({ data: {} }); api.post.mockReset()
})
const card = name => screen.getByRole('heading', { name }).parentElement.parentElement
test('renders Pro at NGN 80,000 (₦80,000), keeping Free/Classic and Plus unchanged', () => {
  render(<AdminBillingPage />)
  expect(within(card('Pro Plan')).getByText('NGN 80,000')).not.toBeNull()
  expect(within(card('Classic Plan')).getByText('NGN 30,000')).not.toBeNull()
  expect(within(card('Plus Plan')).getByText('NGN 68,000')).not.toBeNull()
  expect(screen.getByText(/NGN 80,000\. Staff mode/)).not.toBeNull()
  expect(screen.queryByText(/120,000/)).toBeNull()
})
test.each([['Pro Plan', 8000000, 'pro'], ['Plus Plan', 6800000, 'plus'], ['Classic Plan', 3000000, 'free']])('initializes %s with the correct raw kobo amount and no hosted plan', async (name, amount, tier) => {
  const newTransaction = vi.fn()
  vi.stubGlobal('PaystackPop', class { newTransaction = newTransaction })
  render(<AdminBillingPage />)
  await userEvent.setup().click(within(card(name)).getByRole('button', { name: `Upgrade to ${name}` }))
  await waitFor(() => expect(newTransaction).toHaveBeenCalledTimes(1))
  const options = newTransaction.mock.calls[0][0]
  expect(options).toMatchObject({ amount, currency: 'NGN', metadata: { tier, paymentType: 'couple_upgrade', userId: 'synthetic-owner' } })
  expect(options).not.toHaveProperty('planCode'); expect(options).not.toHaveProperty('plan')
  expect(api.post).not.toHaveBeenCalled()
})
test('V1 checkout fallback uses the same Pro amount', async () => {
  const openIframe = vi.fn(); const setup = vi.fn(() => ({ openIframe }))
  vi.stubGlobal('PaystackPop', { setup })
  render(<AdminBillingPage />)
  await userEvent.setup().click(within(card('Pro Plan')).getByRole('button', { name: 'Upgrade to Pro Plan' }))
  await waitFor(() => expect(openIframe).toHaveBeenCalledTimes(1))
  expect(setup.mock.calls[0][0]).toMatchObject({ amount: 8000000, currency: 'NGN' })
})
test('existing Pro remains current and cannot accidentally be purchased again', () => {
  localStorage.setItem('user', JSON.stringify({ id: 'synthetic-owner', tier: 'pro' }))
  render(<AdminBillingPage />)
  expect(within(card('Pro Plan')).getByRole('button', { name: 'Current Plan' }).disabled).toBe(true)
})
test('currency conversion derives from the new naira price', async () => {
  render(<AdminBillingPage />)
  await userEvent.setup().selectOptions(screen.getByRole('combobox'), 'USD')
  expect(within(card('Pro Plan')).getByText('$53.33')).not.toBeNull()
})
