# Pricing release — 23 November 2026

This release contains only package pricing, conversion displays, checkout safety,
and regression tests. Event-workspace development is excluded. Packages remain
one-time purchases, with unchanged features, limits, credits, and balances.
Classic retains the internal `free` identifier.

| Currency | Classic | Plus | Pro |
| --- | ---: | ---: | ---: |
| NGN (actual charge) | 1,500 | 2,000 | 3,000 |
| USD estimate | 1.10 | 1.46 | 2.19 |
| EUR estimate | 1.00 | 1.33 | 2.00 |
| GBP estimate | 0.84 | 1.12 | 1.67 |
| GHS estimate | 12.94 | 17.26 | 25.89 |
| KES estimate | 142.49 | 189.98 | 284.98 |
| ZAR estimate | 19.21 | 25.61 | 38.42 |
| CAD estimate | 1.57 | 2.10 | 3.14 |
| AUD estimate | 1.65 | 2.20 | 3.31 |

## Conversion and supported charges

The existing NGN → USD → display-currency approach is preserved, using the
[ExchangeRate-API USD snapshot](https://open.er-api.com/v6/latest/USD) verified
23 November 2026 (provider update 00:02:32 UTC). USD-base rates: NGN 1367.642612,
EUR 0.911134, GBP 0.763577, GHS 11.802194, KES 129.915267, ZAR 17.513472,
CAD 1.433241, AUD 1.507013. Round display estimates to two decimals; do not
round a displayed foreign estimate back into a checkout amount. Attribution
appears beside the currency controls. There is no new runtime FX dependency.

All checkout routes charge **NGN only**, as before, at exactly 150000 / 200000 /
300000 kobo. The bank determines actual card FX. Paystack's
[currency/minimum documentation](https://paystack.com/docs/v2/api/supported-currencies)
lists NGN minimum 5000 kobo. All three prices exceed it. USD has a $2 minimum
and requires account activation; GHS, KES, and ZAR depend on merchant country.
EUR, GBP, CAD, and AUD are not supported direct Paystack charge currencies.
No new foreign-currency charge capability is enabled, including USD prices
below its minimum. WhatsApp pack NGN prices and credits are unchanged; their
foreign estimates use the same verified snapshot.

## Charge authority and compatibility

Authenticated initialization accepts only a plan identifier and optional NGN
currency. The backend chooses the actual account, amount, reference, and
versioned HMAC quote, then initializes Paystack. The browser resumes that
transaction or opens its hosted checkout URL. It never supplies an authoritative
amount. Callback and webhook require successful status, matching owner/email,
NGN currency, exact integer amount, reference, and signed quote. Underpayments,
unknown currencies, and altered quotes cannot grant plans.

To preserve transactions already initialized by the previous frontend, unsigned
legacy checkouts are accepted only at their exact original NGN price and with
Paystack creation time before **23 November 2026, 20:00 UTC (21:00 Lagos)**.
This bounded overlap permits independent frontend/backend rollout. New UI
checkouts always use the approved new prices. Legacy pages must be refreshed
after the overlap; support should investigate payments created afterward
rather than weakening amount verification. Existing transaction records,
references, and purchased balances are never rewritten. Replayed lower-plan
payments cannot downgrade a higher purchased plan.

## Verification and rollout

Local automated tests deny external backend network calls and use synthetic
users/provider responses. Coverage includes all three prices, all nine display
currencies, initialization failures, client tampering, under/overpayments,
callback/webhook agreement, legacy cutoff, and preserved higher entitlements.
Run full backend/frontend suites, lint, and frontend production build before
promotion. Real Paystack test-mode initialization and payment verification are
explicitly deferred by the owner; no live charge is part of QA.

Merge the pricing-only PR into production `master` after required checks.
Verify both Vercel projects and Render's live deploy against the merged SHA.
Read `/api/auth/pricing` to check exact amounts, release SHA, and presence of
checkout configuration without contacting Paystack or changing any account.
Verify deployed frontend billing assets contain the new catalog and conversion
snapshot. A successful push alone is not deployment verification.

Rollback uses a reviewed revert of this hotfix on production master, preserving
the separate event-workspace branch. Before reverting payment validation,
account for already initialized signed new-price transactions; reverting to
old validation alone would reject those transactions. Do not delete or rewrite
payment records or balances as part of rollback.
