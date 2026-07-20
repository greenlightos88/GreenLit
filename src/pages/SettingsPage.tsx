import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { useShellState } from "@/app/shellState";

type SettingsTab = "profile" | "workspace" | "appearance" | "notifications" | "integrations" | "billing";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch${checked ? " on" : ""}`} onClick={() => onChange(!checked)}><span/></button>;
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);
  const compact = useShellState((state) => state.sidebarCompact);
  const setCompact = useShellState((state) => state.setSidebarCompact);
  const [motion, setMotion] = useState(true);
  const [notice, setNotice] = useState<string>();
  const [emailNotes, setEmailNotes] = useState(true);
  const [deliveryViews, setDeliveryViews] = useState(true);
  const [gateAlerts, setGateAlerts] = useState(false);
  const [connected, setConnected] = useState(["Convex"]);
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: "profile", label: "Profile" }, { id: "workspace", label: "Workspace" }, { id: "appearance", label: "Appearance" }, { id: "notifications", label: "Notifications" }, { id: "integrations", label: "Integrations" }, { id: "billing", label: "Billing & usage" },
  ];
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  const confirmAction = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(undefined), 2200); };
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", !motion);
    return () => document.documentElement.classList.remove("reduce-motion");
  }, [motion]);
  return (
    <main className="page-frame settings-page">
      <header className="page-heading"><div><p className="overline">Administration</p><h1>Settings</h1><p>Account, workspace, security, and product preferences.</p></div><button type="button" className="button button-primary" onClick={save}>{saved ? <><Icon name="check"/>Saved</> : "Save changes"}</button></header>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">{tabs.map((item) => <button type="button" className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)}>{item.label}<Icon name="arrow"/></button>)}</nav>
        <section className="settings-content">
          {tab === "profile" ? <><div className="settings-section-heading"><h2>Personal profile</h2><p>How you appear to collaborators and external recipients.</p></div><div className="profile-photo-row"><span>AO</span><div><strong>Profile image</strong><p>JPG or PNG, up to 5 MB.</p></div><button type="button" className="button button-secondary" onClick={() => confirmAction("Image picker is ready for a production upload adapter.")}>Change photo</button></div><div className="form-grid"><label>Full name<input defaultValue="Amara Okoye"/></label><label>Role<input defaultValue="Creator / Writer"/></label><label className="full">Email address<input type="email" defaultValue="amara@orupictures.test"/></label><label className="full">Short biography<textarea defaultValue="Writer and filmmaker developing culturally grounded speculative stories."/></label></div><div className="settings-danger"><div><strong>Account security</strong><p>Password, passkeys, and active sessions.</p></div><button type="button" className="button button-secondary" onClick={() => confirmAction("Security settings opened for this workspace.")}>Manage security</button></div></> : null}
          {tab === "workspace" ? <><div className="settings-section-heading"><h2>Workspace</h2><p>Identity, membership, and defaults for Independent slate.</p></div><div className="form-grid"><label className="full">Workspace name<input defaultValue="Independent slate"/></label><label>Default confidentiality<select defaultValue="trusted"><option value="internal">Internal</option><option value="trusted">Trusted</option><option value="external">External</option></select></label><label>Default screenplay mode<select defaultValue="preserve"><option value="preserve">Preserve</option><option value="editorial">Editorial</option><option value="development">Development</option></select></label></div><div className="settings-list"><div><span className="member-avatar">AO</span><p><strong>Amara Okoye</strong><small>amara@orupictures.test</small></p><span>Owner</span></div><div><span className="member-avatar">MC</span><p><strong>Maya Chen</strong><small>maya@northstar.test</small></p><span>Reviewer</span></div></div><button type="button" className="button button-secondary" onClick={() => confirmAction("A secure member invitation draft was created.")}><Icon name="users"/>Invite member</button></> : null}
          {tab === "appearance" ? <><div className="settings-section-heading"><h2>Appearance & accessibility</h2><p>Choose how much information appears at once.</p></div><div className="option-list"><div><div><strong>Compact application navigation</strong><p>Collapse labels and preserve more room for project work.</p></div><Toggle checked={compact} onChange={setCompact} label="Compact application navigation"/></div><div><div><strong>Interface motion</strong><p>Use spatial transitions and the interactive project orbit.</p></div><Toggle checked={motion} onChange={setMotion} label="Interface motion"/></div><label><span><strong>Reading density</strong><p>Controls compiled document preview spacing.</p></span><select defaultValue="comfortable"><option>Comfortable</option><option>Compact</option><option>Large text</option></select></label><label><span><strong>Interface contrast</strong><p>Neutral is designed for long editorial sessions.</p></span><select defaultValue="neutral"><option value="neutral">Neutral</option><option value="high">High contrast</option></select></label></div></> : null}
          {tab === "notifications" ? <><div className="settings-section-heading"><h2>Notifications</h2><p>Choose which changes require your attention.</p></div><div className="option-list"><div><div><strong>External review notes</strong><p>Email when a recipient leaves a new note.</p></div><Toggle checked={emailNotes} onChange={setEmailNotes} label="External review notes"/></div><div><div><strong>Delivery Room access</strong><p>Notify when a recipient first views a package.</p></div><Toggle checked={deliveryViews} onChange={setDeliveryViews} label="Delivery Room access"/></div><div><div><strong>Quality gate changes</strong><p>Notify when a collaborator resolves or overrides a gate.</p></div><Toggle checked={gateAlerts} onChange={setGateAlerts} label="Quality gate changes"/></div></div></> : null}
          {tab === "integrations" ? <><div className="settings-section-heading"><h2>Integrations</h2><p>Services used to store, export, and deliver project intelligence.</p></div><div className="integration-list">{[{ name: "Convex", copy: "Persistent project and realtime domain state" },{ name: "Final Draft", copy: "FDX interchange validation and import" },{ name: "Google Drive", copy: "Archive approved delivery exports" }].map((item) => { const isConnected = connected.includes(item.name); return <article key={item.name}><span>{item.name.slice(0, 2).toUpperCase()}</span><p><strong>{item.name}</strong><small>{item.copy}</small></p><button type="button" className={`button ${isConnected ? "button-quiet" : "button-secondary"}`} onClick={() => setConnected((items) => isConnected ? items.filter((name) => name !== item.name) : [...items, item.name])}>{isConnected ? "Disconnect" : "Connect"}</button></article>; })}</div></> : null}
          {tab === "billing" ? <><div className="settings-section-heading"><h2>Billing & usage</h2><p>Your current plan and workspace resource use.</p></div><div className="plan-card"><div><p className="overline">Current plan</p><h3>Studio</h3><p>For active development teams compiling professional packages.</p></div><strong>$49<small>/ month</small></strong></div><div className="usage-details"><div><span>Storage</span><strong>3.8 GB of 10 GB</strong><i><b style={{ width: "38%" }}/></i></div><div><span>Compiler runs</span><strong>47 of 200</strong><i><b style={{ width: "23.5%" }}/></i></div><div><span>Delivery recipients</span><strong>8 of 25</strong><i><b style={{ width: "32%" }}/></i></div></div><div className="billing-actions"><button type="button" className="button button-secondary" onClick={() => confirmAction("Payment method management is ready for the billing provider.")}>Manage payment method</button><button type="button" className="button button-quiet" onClick={() => confirmAction("Invoice history loaded for this workspace.")}>View invoices</button></div></> : null}
        </section>
      </div>
      {notice ? <div className="action-toast" role="status"><Icon name="check"/>{notice}</div> : null}
    </main>
  );
}
