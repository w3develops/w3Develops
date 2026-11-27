'use client';

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { getApp } from 'firebase/app';
import type { User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './newsletter.css';

type Campaign = {id: string; subject: string; text: string; audiences: string[]; status: string; version: number};
type Overview = {campaigns: Campaign[]; audiences: string[]; sendingEnabled: boolean};
type Preview = {counts: {audience: string; count: number}[]; count: number; version: number};
type Results = {expanded: boolean; totals: {status: string; count: number}[]};
type Subscription = {subscribed: boolean; email: string; eligible: boolean};
type Props = {user: User; region: string};
const emptyDraft = {id: '', subject: '', text: '', audiences: [] as string[], status: 'draft', version: 0};
const labels: Record<string, string> = {
  subscribers: 'Subscribers', employees: 'Employees', admins: 'Admins', providers: 'Providers',
  customers: 'Customers', 'moving-agent-partners': 'Moving agent partners',
};
const resultLabels: Record<string, string> = {
  pending: 'Pending', retry: 'Waiting to retry', sending: 'Sending', accepted: 'Accepted by SES',
  delivered: 'Delivered', delayed: 'Delayed', bounced: 'Bounced', complained: 'Complaints',
  rejected: 'Rejected', needs_review: 'Needs review', skipped: 'Skipped',
};

async function call<T>(region: string, name: string, request: Record<string, unknown>) {
  const result = await httpsCallable<Record<string, unknown>, T>(getFunctions(getApp(), region), name)(request);
  return result.data;
}
function errorMessage(error: unknown) {
  const value = error as { code?: string; message?: string } | null;
  if (value?.code && value.message && /functions\/(permission-denied|failed-precondition|invalid-argument|unauthenticated)$/.test(value.code)) {
    return value.message;
  }
  return 'Could not connect to the newsletter. Please try again.';
}

export function NewsletterSubscription(props: Props) {
  return <SubscriptionPanel key={`${props.user.uid}:${props.user.email}:${props.user.emailVerified}`} {...props} />;
}

function SubscriptionPanel({user, region}: Props) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    if (!user.emailVerified) return;
    void call<Subscription>(region, 'newsletterSubscription', {action: 'status'}).then(
      data => { if (current) setSubscription(data); },
      reason => { if (current) setError(errorMessage(reason)); },
    );
    return () => { current = false; };
  }, [user.uid, user.emailVerified, region]);

  async function save() {
    if (!subscription || busy) return;
    const action = subscription.subscribed ? 'unsubscribe' : 'subscribe';
    setBusy(true);
    setError('');
    setStatus('');
    try {
      setSubscription(await call<Subscription>(region, 'newsletterSubscription', {action}));
      setStatus(action === 'subscribe' ? 'You’re subscribed.' : 'You’re unsubscribed.');
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }

  return <section className="newsletter-panel" aria-label="Newsletter subscription">
    <h2>Newsletter subscription</h2>
    {!user.emailVerified ? <p>Verify your account email to subscribe.</p> : subscription ? <>
      <p>{subscription.subscribed ? 'Subscribed' : 'Not subscribed'} · {subscription.email}</p>
      <button type="button" disabled={busy || (!subscription.subscribed && !subscription.eligible)} onClick={() => void save()}>
        {subscription.subscribed ? 'Unsubscribe' : 'Subscribe'}
      </button>
      {!subscription.eligible && !subscription.subscribed && <p>This account is not eligible for a newsletter audience yet.</p>}
    </> : !error && <p role="status">Loading your subscription…</p>}
    {status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}

export function NewsletterAdmin({user, region}: Props) {
  return <CampaignPanel key={user.uid} region={region} />;
}

function CampaignPanel({region}: Pick<Props, 'region'>) {
  const [data, setData] = useState<Overview | null>(null);
  const [draft, setDraft] = useState<Campaign>(emptyDraft);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const request = useCallback(<T,>(payload: Record<string, unknown>) =>
    call<T>(region, 'newsletterAdmin', payload), [region]);
  useEffect(() => {
    let current = true;
    void request<Overview>({action: 'list'}).then(
      overview => { if (current) setData(overview); },
      reason => { if (current) setError(errorMessage(reason)); },
    );
    return () => { current = false; };
  }, [request]);

  function edit(changes: Partial<Campaign>) {
    setDraft(current => ({...current, ...changes}));
    setDirty(true);
    setPreview(null);
  }

  function select(campaign: Campaign) {
    setDraft(campaign);
    setDirty(false);
    setPreview(null);
    setResults(null);
    setStatus('');
    setError('');
  }

  async function run(action: 'save' | 'preview' | 'queue' | 'results') {
    if (action === 'queue' && (!preview || !window.confirm(`Queue “${draft.subject}” for up to ${preview.count} opted-in addresses?`))) return;
    setBusy(true);
    setStatus('');
    setError('');
    try {
      switch (action) {
        case 'save': {
          const result = await request<{id: string; version: number}>({
            action, id: draft.id || undefined, subject: draft.subject, text: draft.text, audiences: draft.audiences, version: draft.version,
          });
          setDraft({...draft, ...result});
          setDirty(false);
          setPreview(null);
          setStatus('Draft saved.');
          setData(await request<Overview>({action: 'list'}));
          break;
        }
        case 'preview':
          setPreview(await request<Preview>({action, id: draft.id, version: draft.version}));
          break;
        case 'results':
          setResults(await request<Results>({action, id: draft.id}));
          break;
        case 'queue':
          await request({action, id: draft.id, version: draft.version, confirmed: true, expectedCount: preview?.count});
          setDraft({...draft, status: 'queued'});
          setPreview(null);
          setStatus('Newsletter queued for delivery.');
          setData(await request<Overview>({action: 'list'}));
          break;
      }
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setBusy(false); }
  }

  const locked = busy || draft.status !== 'draft';
  return <section className="newsletter-panel" aria-label="Manage newsletters">
    <h2>Newsletter</h2>
    {data && !data.sendingEnabled && <p>Drafts are available. Sending is off until the newsletter sender and mailing address are configured.</p>}
    {data && <>
      <div className="newsletter-actions">
        <button type="button" disabled={busy} onClick={() => select({...emptyDraft, audiences: data.audiences.length === 1 ? data.audiences : []})}>New draft</button>
        <label>Campaigns<select disabled={busy} value={draft.id} onChange={event => {
          const selected = data.campaigns.find(item => item.id === event.target.value);
          if (selected) select(selected);
        }}>
          <option value="">Choose a campaign</option>
          {data.campaigns.map(item => <option key={item.id} value={item.id}>{item.subject} ({item.status})</option>)}
        </select></label>
      </div>
      <form onSubmit={event => { event.preventDefault(); void run('save'); }}>
        <label>Subject<input required maxLength={150} disabled={locked} value={draft.subject} onChange={event => edit({subject: event.target.value})}/></label>
        <label>Message<textarea required maxLength={20000} rows={9} disabled={locked} value={draft.text} onChange={event => edit({text: event.target.value})}/></label>
        <fieldset disabled={locked}><legend>Audience</legend>
          {data.audiences.map(group => <label key={group} className="newsletter-option">
            <input type="checkbox" checked={draft.audiences.includes(group)} onChange={event =>
              edit({audiences: event.target.checked ? [...draft.audiences, group] : draft.audiences.filter(item => item !== group)})}/>
            {labels[group] ?? group}
          </label>)}
        </fieldset>
        <div className="newsletter-actions">
          <button type="submit" disabled={locked || !draft.audiences.length}>Save draft</button>
          <button type="button" disabled={locked || dirty || !draft.id} onClick={() => void run('preview')}>Preview recipients</button>
          {preview && <button type="button" disabled={locked || !data.sendingEnabled || preview.count === 0} onClick={() => void run('queue')}>Queue send</button>}
        </div>
        {preview && <div role="status">
          <p>{preview.count} subscribed {preview.count === 1 ? 'address' : 'addresses'}. Eligibility is checked again before delivery.</p>
          {preview.counts.length > 1 && <ul>{preview.counts.map(({audience, count}) =>
            <li key={audience}>{labels[audience] ?? audience} · {count}</li>)}</ul>}
        </div>}
      </form>
      {draft.status === 'queued' && <button type="button" disabled={busy} onClick={() => void run('results')}>Check delivery</button>}
      {results && <div role="status">
        {!results.expanded && <p>The recipient list is still being queued.</p>}
        {results.totals.length > 0 && <ul>{results.totals.map(({status, count}) =>
          <li key={status}>{resultLabels[status] ?? status} · {count}</li>)}</ul>}
        {results.expanded && results.totals.length === 0 && <p>No recipients were queued.</p>}
      </div>}
    </>}
    {status && <p role="status">{status}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}

export function NewsletterAdminTabs({user, region, children, mainLabel}: Props & {children: ReactNode; mainLabel: string}) {
  const [tab, setTab] = useState<'main' | 'newsletter'>('main');
  const tabId = useId();
  return <section className="newsletter-workspace">
    <div className="newsletter-actions" aria-label="Admin sections">
      <button type="button" aria-pressed={tab === 'main'} aria-controls={tabId} onClick={() => setTab('main')}>{mainLabel}</button>
      <button type="button" aria-pressed={tab === 'newsletter'} aria-controls={tabId} onClick={() => setTab('newsletter')}>Newsletter</button>
    </div>
    <div id={tabId}>{tab === 'newsletter' ? <NewsletterAdmin user={user} region={region}/> : children}</div>
  </section>;
}
