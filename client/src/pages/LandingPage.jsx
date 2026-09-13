import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import LandingFooter from '../components/landing/LandingFooter';
import { getStoredSession } from '../components/landing/getLandingSession';
import { PREMADE_TEMPLATES, getTemplateLayout } from '../utils/templateLayouts';
import { getPlanLabel } from '../utils/planLimits';
import './LandingPage.css';

const features = [
  ['lucide:mail', 'Create your invitation', 'A beautiful beginning. Choose a design and add the details that make your celebration yours.'],
  ['lucide:users-round', 'Build your guest list', 'Add guests individually, or bring your list together with a CSV import on Plus or Pro.'],
  ['ri:whatsapp-line', 'Send invites on WhatsApp', 'Share personal invitation links with messages prepared for each guest.'],
  ['lucide:check-check', 'Track every RSVP', 'See who is attending, who declined, and whose response you are still waiting for.'],
  ['lucide:armchair', 'Plan your seating', 'Create tables and assign attending guests to their seats with the Pro plan.'],
  ['lucide:palette', 'Make it yours', 'Personalize your invitation with wedding colors, photos, and the options included in your plan.'],
];
const journey = [
  { label: 'Invite', icon: 'ri:whatsapp-line', title: 'Personal invitations. Less back-and-forth.', text: 'Add names one at a time or import a CSV on Plus or Pro. Organize guests into groups, then share their personal links through WhatsApp.', detail: ['Your guest list', 'Personal guest links', 'WhatsApp sharing'] },
  { label: 'Track', icon: 'lucide:check-check', title: 'Know who’s coming, as replies arrive.', text: 'Guests open their invitation and RSVP from their phone. Review attending, declined, and pending responses in your wedding workspace.', detail: ['Guest opens invitation', 'Guest sends RSVP', 'You review responses'] },
  { label: 'Organize', icon: 'lucide:armchair', title: 'A place for everyone you love.', text: 'Keep guest categories and plus-ones organized. On Pro, create tables with capacities and assign attending guests as your seating plan takes shape.', detail: ['Attending guests', 'Tables & capacities', 'Seat assignments'] },
];
const showcase = ['Classic Floral', 'Classic Navy, Gold & Cream', 'Royal Emerald Gold Frame'].map((name) => PREMADE_TEMPLATES.find((template) => template.name === name)).filter(Boolean);

function SectionLink({ target, children, className = '', onNavigate }) {
  return <a href={`#${target}`} className={className} onClick={(event) => {
    const section = document.getElementById(target);
    if (!section) return;
    event.preventDefault();
    onNavigate?.();
    window.history.replaceState(window.history.state, '', `#${target}`);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }}>{children}</a>;
}

function StartLink({ session, children = 'Get Started', compact = false }) {
  return <Link className="vl-button" to={session ? session.dashboardPath : '/signup'}>{session ? (compact ? 'Dashboard' : session.dashboardLabel) : children}<Icon icon="lucide:arrow-up-right" aria-hidden="true" /></Link>;
}

function LandingNav({ session }) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  return <header className="vl-header" onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus(); }
  }} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <div className="vl-nav-shell">
      <Link to="/" className="vl-brand" aria-label="VowLink home"><img src="/vowlink-icon.svg" alt="" width="30" height="30" />VowLink</Link>
      <nav id="landing-navigation" className={`vl-nav-links ${open ? 'is-open' : ''}`} aria-label="Main navigation">
        <SectionLink target="features" onNavigate={() => setOpen(false)}>Features</SectionLink>
        <SectionLink target="how-it-works" onNavigate={() => setOpen(false)}>How it works</SectionLink>
        <SectionLink target="templates" onNavigate={() => setOpen(false)}>Templates</SectionLink>
        <Link to="/pricing">Pricing</Link>
        <Link className="vl-mobile-login" to={session ? session.dashboardPath : '/admin/login'}>{session ? 'Your workspace' : 'Log in'}</Link>
      </nav>
      <div className="vl-nav-actions">
        <Link className="vl-desktop-login" to={session ? session.dashboardPath : '/admin/login'}>{session ? 'Workspace' : 'Log in'}</Link>
        <StartLink session={session} compact />
        <button ref={menuButton} className="vl-menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="landing-navigation" onClick={() => setOpen(!open)}><Icon icon={open ? 'lucide:x' : 'lucide:menu'} aria-hidden="true" /></button>
      </div>
    </div>
  </header>;
}

// Presentation sample using actual catalog artwork and its existing text colors.
// No account context, real guest data, or invitation API calls are needed here.
function InvitationSample({ template, priority = false }) {
  const layout = getTemplateLayout('custom', template.url);
  return <div className="vl-invitation" style={{ '--sample-ink': layout.textColorConfig.title, '--sample-detail': layout.textColorConfig.details, '--sample-shadow': layout.textShadow }}>
    <img src={template.preview} alt={`${template.name} invitation artwork`} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} width="576" height="1024" />
    <div className="vl-invitation-copy">
      <span className="vl-invitation-small">Together with our families</span>
      <span className="vl-invitation-names">Amara<span>&</span>Chidi</span>
      <span className="vl-invitation-small">Invite you to celebrate<br />our wedding</span>
      <span className="vl-invitation-rule" />
      <span className="vl-invitation-date">19 · 12 · 2026</span>
      <span className="vl-invitation-small">Lagos, Nigeria</span>
    </div>
  </div>;
}

function LandingHero({ session }) {
  return <section className="vl-hero vl-container" aria-labelledby="hero-title">
    <div className="vl-hero-copy">
      <p className="vl-eyebrow">Wedding invitations & guest management</p>
      <h1 id="hero-title">Your wedding.<br />Your guests.<br /><em>One beautiful link.</em></h1>
      <p className="vl-hero-description">Create your invitation, manage your guest list, send invites on WhatsApp, track RSVPs and organize seating — all from one place.</p>
      <div className="vl-hero-actions"><StartLink session={session} /><SectionLink target="features" className="vl-text-link">Explore VowLink <Icon icon="lucide:arrow-down" aria-hidden="true" /></SectionLink></div>
      <ul className="vl-capabilities" aria-label="VowLink capabilities">{['Beautiful invitations', 'WhatsApp invites', 'RSVP tracking', 'Guests & seating'].map((label) => <li key={label}><Icon icon="lucide:check" aria-hidden="true" />{label}</li>)}</ul>
    </div>
    <figure className="vl-hero-visual">
      <div className="vl-hero-photo" />
      <div className="vl-hero-invitation"><InvitationSample template={showcase[1]} priority /></div>
      <figcaption><span>A little glimpse of your big day</span><span>Sample invitation · {getPlanLabel(showcase[1].tier)} template</span></figcaption>
    </figure>
  </section>;
}

function FeatureOverview() {
  return <section id="features" tabIndex={-1} className="vl-features vl-container" aria-labelledby="features-title">
    <div className="vl-section-heading"><div><p className="vl-eyebrow">From the first invite to the last seat</p><h2 id="features-title">Everything you need<br />for your wedding guests.</h2></div><p>Everything between “You’re invited”<br />and “See you there.”</p></div>
    <div className="vl-feature-grid">{features.map(([icon, title, text], index) => <article className="vl-feature" key={title}><div className="vl-feature-top"><Icon icon={icon} aria-hidden="true" /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
  </section>;
}

function ProductStory() {
  const [selected, setSelected] = useState(0);
  const step = journey[selected];
  return <section className="vl-story-band">
    <div className="vl-container vl-story">
      <div className="vl-story-intro"><p className="vl-eyebrow">Beautiful for them. Organized for you.</p><h2>The invitation is<br /><em>just the beginning.</em></h2><p>Behind every beautiful link is a simpler way to look after your guests.</p>
        <div className="vl-story-select" role="group" aria-label="Explore the guest journey">{journey.map((item, index) => <button key={item.label} type="button" aria-pressed={selected === index} aria-controls="guest-journey" onClick={() => setSelected(index)}><span>0{index + 1}</span>{item.label}<Icon icon="lucide:arrow-right" aria-hidden="true" /></button>)}</div>
      </div>
      <div id="guest-journey" className="vl-story-panel" aria-live="polite" aria-atomic="true">
        <Icon className="vl-story-icon" icon={step.icon} aria-hidden="true" /><p className="vl-eyebrow">{step.label} with VowLink</p><h3>{step.title}</h3><p>{step.text}</p>
        <ol className="vl-workflow" aria-label={`${step.label} workflow`}>{step.detail.map((detail, index) => <li key={detail}><span>{String(index + 1).padStart(2, '0')}</span>{detail}{index < 2 && <Icon icon="lucide:arrow-down" aria-hidden="true" />}</li>)}</ol>
        <Link to="/features" className="vl-text-link">Explore all features <Icon icon="lucide:arrow-up-right" aria-hidden="true" /></Link>
      </div>
    </div>
  </section>;
}

function ConversionCTA({ session, final = false }) {
  return <section className={`vl-conversion vl-container ${final ? 'vl-conversion-final' : ''}`} aria-labelledby={final ? 'final-title' : 'conversion-title'}>
    <p className="vl-eyebrow">{final ? 'Make room for the celebration' : 'Less planning admin. More wedding joy.'}</p>
    <h2 id={final ? 'final-title' : 'conversion-title'}>{final ? <>One link. Every guest.<br /><em>Everything organized.</em></> : <>Your guest list is complicated enough.<br /><em>Planning it shouldn’t be.</em></>}</h2>
    <p>{final ? 'Bring your invitation and your guest list together with VowLink.' : 'Create your wedding experience with VowLink.'}</p>
    <StartLink session={session}>{final ? 'Create Your Invitation' : 'Get Started'}</StartLink>
    {!session && <p className="vl-login-note">Already have an account? <Link to="/admin/login">Log in</Link></p>}
  </section>;
}

function TemplateShowcase({ session }) {
  const dialog = useRef(null);
  const trigger = useRef(null);
  const [preview, setPreview] = useState(showcase[0]);
  const openPreview = (template, event) => { setPreview(template); trigger.current = event.currentTarget; dialog.current.showModal(); };
  return <section id="templates" tabIndex={-1} className="vl-templates vl-container" aria-labelledby="templates-title">
    <div className="vl-section-heading"><div><p className="vl-eyebrow">Made to feel like you</p><h2 id="templates-title">A wedding this personal<br />deserves a beautiful invitation.</h2></div><p>Your colors. Your details. Your kind of celebration.<br />Explore a few designs from our template collection.</p></div>
    <div className="vl-template-grid">{showcase.map((template) => <article className="vl-template" key={template.name}>
      <button type="button" className="vl-template-preview" onClick={(event) => openPreview(template, event)} aria-label={`Preview ${template.name}`} aria-haspopup="dialog"><InvitationSample template={template} /><span className="vl-preview-label">Preview design <Icon icon="lucide:expand" aria-hidden="true" /></span></button>
      <div className="vl-template-caption"><h3>{template.name}</h3><span>{getPlanLabel(template.tier)}</span></div>
    </article>)}</div>
    <div className="vl-template-note"><p>Sample invitation text shown. Template availability varies by plan.</p><Link to="/templates" className="vl-text-link">More about templates <Icon icon="lucide:arrow-up-right" aria-hidden="true" /></Link></div>
    <dialog ref={dialog} className="vl-preview-dialog" aria-labelledby="preview-title" onClose={() => trigger.current?.focus()} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <div className="vl-dialog-content"><button type="button" className="vl-dialog-close" aria-label="Close template preview" onClick={() => dialog.current.close()} autoFocus><Icon icon="lucide:x" aria-hidden="true" /></button><p className="vl-eyebrow">{getPlanLabel(preview.tier)} template · Sample invitation</p><h2 id="preview-title">{preview.name}</h2><InvitationSample template={preview} /><StartLink session={session}>Create Your Invitation</StartLink></div>
    </dialog>
  </section>;
}

function HowItWorks() {
  const steps = [['Create your invitation', 'Choose your style and add your wedding details.'], ['Add your guests', 'Build your list individually or import on Plus or Pro.'], ['Send your links', 'Share personalized invitations through WhatsApp.'], ['Track & organize', 'Follow RSVPs and arrange seating on Pro.']];
  return <section id="how-it-works" tabIndex={-1} className="vl-how vl-container" aria-labelledby="how-title"><p className="vl-eyebrow">A few steps to “You’re invited”</p><h2 id="how-title">From your idea to their inbox.</h2><ol className="vl-steps">{steps.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>;
}

function LandingFAQ() {
  return <section className="vl-faq vl-container" aria-labelledby="faq-title"><div><p className="vl-eyebrow">A little reassurance</p><h2 id="faq-title">Less admin.<br />More celebration.</h2><p>Made for couples who want an invitation that feels personal and a guest list that feels manageable.</p></div><div className="vl-faq-list">
    {[
      ['Can guests RSVP on their phones?', 'Yes. Guests open their invitation link in a browser to see the wedding details and send their RSVP.'],
      ['How does WhatsApp sharing work?', 'VowLink prepares guest-specific links and messages for sharing through WhatsApp. Queue and sending options depend on your plan.'],
      ['Which plan includes guest import and seating?', 'Bulk guest import is available on Plus and Pro. Seating charts are available on Pro. Compare plans to choose what fits your celebration.'],
    ].map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}
    <Link to="/pricing" className="vl-text-link">Compare plans <Icon icon="lucide:arrow-up-right" aria-hidden="true" /></Link>
  </div></section>;
}

export default function LandingPage() {
  const session = useMemo(() => getStoredSession(), []);
  return <div className="vl-landing"><a className="vl-skip" href="#main-content">Skip to content</a><LandingNav session={session} />
    <main id="main-content" tabIndex={-1}><LandingHero session={session} /><FeatureOverview /><ProductStory /><ConversionCTA session={session} /><TemplateShowcase session={session} /><HowItWorks /><LandingFAQ /><ConversionCTA session={session} final /></main>
    <LandingFooter session={session} />
  </div>;
}
