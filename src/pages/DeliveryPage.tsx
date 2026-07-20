import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/Icon";

interface Room {
  name: string;
  recipient: string;
  version: string;
  access: string;
  lastViewed: string;
  status: "Active" | "Expired";
}

const initialRooms: Room[] = [
  { name: "Producer review", recipient: "Maya Chen · North Star Pictures", version: "Studio package v3", access: "Comment enabled", lastViewed: "2 hours ago", status: "Active" },
  { name: "Director conversation", recipient: "Jon Bell", version: "Director packet v1", access: "Read only", lastViewed: "Yesterday", status: "Active" },
  { name: "Festival submission 2025", recipient: "Selection committee", version: "Submission v2", access: "Download enabled", lastViewed: "May 28", status: "Expired" },
];

export function DeliveryPage() {
  const [rooms, setRooms] = useState(initialRooms);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [recipient, setRecipient] = useState("");
  const [copied, setCopied] = useState<string>();
  const [showHistory, setShowHistory] = useState(false);
  const createRoom = () => {
    if (!name.trim() || !recipient.trim()) return;
    setRooms((items) => [{ name, recipient, version: "Studio package v4", access: "Read only", lastViewed: "Not viewed", status: "Active" }, ...items]);
    setName(""); setRecipient(""); setDialogOpen(false);
  };
  const copyLink = async (room: Room) => {
    await navigator.clipboard?.writeText(`https://review.greenlightos.test/${room.name.toLowerCase().replaceAll(" ", "-")}`);
    setCopied(room.name);
    window.setTimeout(() => setCopied(undefined), 1600);
  };
  return (
    <main className="page-frame delivery-page">
      <header className="page-heading"><div><p className="overline">External review</p><h1>Delivery Rooms</h1><p>Controlled access to frozen, recipient-safe project versions.</p></div><button type="button" className="button button-primary" onClick={() => setDialogOpen(true)}><Icon name="plus"/>Create room</button></header>
      <section className="delivery-callout"><Icon name="lock"/><div><strong>Historical delivery is protected</strong><p>Changes to current canon never alter material already sent. Create a new version to share updates.</p></div><button type="button" aria-pressed={showHistory} onClick={() => setShowHistory((current) => !current)}>{showHistory ? "Hide history" : "View version history"}</button></section>
      <section className="delivery-table surface-panel">
        <div className="delivery-table-head"><span>Room</span><span>Package</span><span>Access</span><span>Activity</span><span>Status</span><span/></div>
        {rooms.filter((room) => showHistory || room.status === "Active").map((room) => (
          <article key={`${room.name}-${room.version}`}>
            <div><span className="room-icon"><Icon name="delivery"/></span><p><strong>{room.name}</strong><small>{room.recipient}</small></p></div>
            <p><strong>{room.version}</strong><small>Frozen artifact</small></p>
            <p><strong>{room.access}</strong><small>Recipient policy</small></p>
            <p><strong>{room.lastViewed}</strong><small>Last viewed</small></p>
            <span className={`status-badge ${room.status === "Active" ? "status-ready" : ""}`}>{room.status}</span>
            <div className="row-actions"><button type="button" onClick={() => void copyLink(room)}>{copied === room.name ? <Icon name="check"/> : <Icon name="delivery"/>}<span>{copied === room.name ? "Copied" : "Copy link"}</span></button><button type="button" onClick={() => setRooms((items) => items.map((item) => item.name === room.name ? { ...item, status: item.status === "Active" ? "Expired" : "Active" } : item))}><Icon name={room.status === "Active" ? "lock" : "check"}/><span>{room.status === "Active" ? "Expire" : "Restore"}</span></button></div>
          </article>
        ))}
      </section>
      <AnimatePresence>{dialogOpen ? <motion.div className="modal-scrim" onMouseDown={() => setDialogOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="saas-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><div className="modal-heading"><div><p className="overline">Secure sharing</p><h2>Create Delivery Room</h2></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Close"><Icon name="close"/></button></div><label>Room name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Producer review" autoFocus/></label><label>Recipient name or email<input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="name@studio.com"/></label><label>Visible package<select><option>Studio Review Package v4</option><option>Submission screenplay v2</option><option>Director packet v1</option></select></label><div className="modal-actions"><button type="button" className="button button-quiet" onClick={() => setDialogOpen(false)}>Cancel</button><button type="button" className="button button-primary" disabled={!name.trim() || !recipient.trim()} onClick={createRoom}>Create room</button></div></motion.div></motion.div> : null}</AnimatePresence>
    </main>
  );
}
