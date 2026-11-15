import { useState } from "react";
import { Link } from "react-router-dom";

export default function AccountEntry() {
  const [town, setTown] = useState(false);
  const [message, setMessage] = useState(false);
  return <section className="page account-entry">
    <div className="eyebrow">YOUR PLACE IN THE PUBLIC RECORD</div>
    <h1>{town ? "Town or agency access." : "Welcome to Common."}</h1>
    {town ? <>
      <p>A dedicated workspace for authorized public teams to acknowledge reports, share cleanup plans, and keep people updated.</p>
      <div className="notice">Town and agency accounts are not connected yet. This screen shows the planned access flow.</div>
      <form className="account-town-form" onSubmit={event => { event.preventDefault(); setMessage(true); }}>
        <label>Town or agency name<input autoComplete="organization" required /></label>
        <label>Work email<input type="email" autoComplete="email" required /></label>
        <button className="button" type="submit">Continue with town or agency</button>
      </form>
      {message && <p role="status" className="notice">Town access is coming soon. No account was created and your details have not been sent or saved.</p>}
      <button className="back" onClick={() => { setTown(false); setMessage(false); }}>← Choose a different account</button>
    </> : <>
      <p>Choose how you use Common. You can report a public issue anywhere—you do not need to live in that town.</p>
      <div className="account-options">
        <article><span className="eyebrow">FOR EVERYONE</span><h2>Community member</h2><p>Keep your reports together, return to their status, and follow what happens next.</p><Link className="button" to="/auth/member">Continue as a community member →</Link></article>
        <article><span className="eyebrow">FOR PUBLIC TEAMS</span><h2>Town or agency</h2><p>Acknowledge community reports, coordinate a response, and share progress toward a resolution.</p><button className="secondary" onClick={() => setTown(true)}>Continue as a town or agency →</button><small>Town access coming soon</small></article>
      </div>
      <p className="muted">No account needed to report a problem. <Link to="/report">Continue to Quick Report →</Link></p>
    </>}
  </section>;
}
