import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants & Mock Data ────────────────────────────────────────────────────
const DEMO_USER = { email: "demo@signflow.io", password: "demo123", name: "Alex Carter", role: "Admin", org: "Acme Corp", avatar: "AC" };
const PLANS = { free: { actions: 2, label: "Free" }, pro: { actions: 999, label: "Pro" }, enterprise: { actions: 999, label: "Enterprise" } };

const MOCK_DOCUMENTS = [
  { id: 1, name: "NDA Agreement 2025.pdf", status: "pending", signers: ["john@acme.com", "sarah@partner.io"], created: "2025-06-01", due: "2025-06-10", size: "245 KB", pages: 4, tags: ["legal", "nda"] },
  { id: 2, name: "Service Contract Q3.pdf", status: "completed", signers: ["cfo@client.com"], created: "2025-05-28", due: "2025-06-05", size: "1.2 MB", pages: 12, tags: ["contract", "billing"] },
  { id: 3, name: "Employee Offer Letter.pdf", status: "draft", signers: ["newjoin@acme.com"], created: "2025-06-03", due: "2025-06-15", size: "180 KB", pages: 3, tags: ["hr"] },
  { id: 4, name: "Vendor Agreement - TechCo.pdf", status: "expired", signers: ["vendor@techco.com", "legal@acme.com"], created: "2025-05-10", due: "2025-05-25", size: "890 KB", pages: 8, tags: ["vendor"] },
  { id: 5, name: "Partnership MOU.pdf", status: "pending", signers: ["partner@startup.io"], created: "2025-06-04", due: "2025-06-20", size: "320 KB", pages: 6, tags: ["legal", "mou"] },
  { id: 6, name: "Annual Report Sign-off.pdf", status: "completed", signers: ["ceo@acme.com", "cfo@acme.com", "board@acme.com"], created: "2025-05-15", due: "2025-05-30", size: "4.1 MB", pages: 28, tags: ["finance"] },
];

const MOCK_TEMPLATES = [
  { id: 1, name: "Standard NDA", category: "Legal", uses: 45, fields: 8 },
  { id: 2, name: "Employment Contract", category: "HR", uses: 23, fields: 15 },
  { id: 3, name: "Service Agreement", category: "Contracts", uses: 67, fields: 12 },
  { id: 4, name: "Vendor Onboarding", category: "Procurement", uses: 18, fields: 20 },
  { id: 5, name: "IP Assignment", category: "Legal", uses: 12, fields: 6 },
  { id: 6, name: "Freelancer Agreement", category: "HR", uses: 34, fields: 10 },
];

const MOCK_AUDIT = [
  { id: 1, action: "Document signed", user: "john@acme.com", doc: "NDA Agreement 2025.pdf", time: "2025-06-04 14:32", ip: "192.168.1.10", browser: "Chrome 125" },
  { id: 2, action: "Document viewed", user: "sarah@partner.io", doc: "NDA Agreement 2025.pdf", time: "2025-06-04 14:10", ip: "10.0.0.5", browser: "Firefox 126" },
  { id: 3, action: "Document sent", user: "alex@acme.com", doc: "Service Contract Q3.pdf", time: "2025-06-04 11:00", ip: "192.168.1.1", browser: "Safari 17" },
  { id: 4, action: "Signature completed", user: "cfo@client.com", doc: "Service Contract Q3.pdf", time: "2025-06-03 16:45", ip: "172.16.0.2", browser: "Edge 125" },
  { id: 5, action: "Template created", user: "alex@acme.com", doc: "Standard NDA", time: "2025-06-02 09:15", ip: "192.168.1.1", browser: "Chrome 125" },
];

const MOCK_TEAM = [
  { id: 1, name: "Alex Carter", email: "alex@acme.com", role: "Admin", status: "active", docs: 24, joined: "2024-01-10" },
  { id: 2, name: "Sarah Lin", email: "sarah@acme.com", role: "Manager", status: "active", docs: 15, joined: "2024-03-22" },
  { id: 3, name: "Dev Patel", email: "dev@acme.com", role: "User", status: "active", docs: 8, joined: "2024-06-15" },
  { id: 4, name: "Maria Garcia", email: "maria@acme.com", role: "User", status: "inactive", docs: 3, joined: "2024-09-01" },
];

const STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  completed: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  draft: { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" },
  expired: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

// ─── Utility Components ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9CA3AF", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ msg, type, onClose }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, background: type === "error" ? "#FEE2E2" : type === "warn" ? "#FEF3C7" : "#D1FAE5", color: type === "error" ? "#991B1B" : type === "warn" ? "#92400E" : "#065F46", padding: "12px 20px", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 2000, fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 10, maxWidth: 360 }}>
    <span>{type === "error" ? "⚠️" : type === "warn" ? "🔔" : "✅"}</span>
    {msg}
    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8, opacity: 0.6, fontSize: 16 }}>×</button>
  </div>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = ({ onLogin, onGuest, guestActions, maxGuest }) => {
  const features = [
    { icon: "✍️", title: "eSignatures", desc: "Legally binding digital signatures with cryptographic verification" },
    { icon: "📄", title: "PDF Builder", desc: "Drag-and-drop field placement on any PDF document" },
    { icon: "🔄", title: "Workflows", desc: "Sequential & parallel multi-signer approval workflows" },
    { icon: "🔒", title: "Audit Trail", desc: "Complete tamper-proof audit logs with IP tracking" },
    { icon: "🏢", title: "Multi-Tenant", desc: "Isolated organization workspaces with RBAC" },
    { icon: "🤖", title: "AI-Powered", desc: "Auto-detect signature fields and smart templates" },
  ];
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)", fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 48px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>SignFlow</span>
          <span style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.05em" }}>ENTERPRISE</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onGuest} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            Try Free {guestActions > 0 ? `(${maxGuest - guestActions}/${maxGuest} used)` : ""}
          </button>
          <button onClick={onLogin} style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: "#fff", padding: "9px 24px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Sign In →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 60px" }}>
        <div style={{ display: "inline-block", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 99, padding: "6px 16px", fontSize: 12, color: "#A5B4FC", fontWeight: 600, marginBottom: 24, letterSpacing: "0.04em" }}>
          🚀 ENTERPRISE ESIGNATURE PLATFORM
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", margin: "0 0 20px", background: "linear-gradient(135deg, #fff 40%, #A5B4FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Sign Documents<br />at Enterprise Scale
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Legally binding eSignatures, AI-powered workflows, and complete audit trails — built for teams that demand security and compliance.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onGuest} style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: "#fff", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>
            Try 2 Actions Free →
          </button>
          <button onClick={onLogin} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
            Sign In to Full Access
          </button>
        </div>
        {guestActions > 0 && (
          <div style={{ marginTop: 16, background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 20px", display: "inline-block", color: "#FCD34D", fontSize: 13 }}>
            ⚡ You have used {guestActions} of {maxGuest} free actions
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 48, padding: "32px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        {[["500M+", "Documents Signed"], ["99.99%", "Uptime SLA"], ["150+", "Countries"], ["SOC2", "Compliant"]].map(([num, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #A5B4FC, #C4B5FD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: "60px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 800, marginBottom: 40, letterSpacing: "-0.5px" }}>Everything Your Enterprise Needs</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "24px", transition: "all 0.2s" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "40px 24px 80px" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No credit card required • 14-day free trial • Cancel anytime</p>
        <button onClick={onLogin} style={{ marginTop: 16, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: "#fff", padding: "16px 48px", borderRadius: 12, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>
          Get Started Free
        </button>
      </div>
    </div>
  );
};

// ─── Auth Page ────────────────────────────────────────────────────────────────
const AuthPage = ({ onAuth, onBack }) => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", org: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (mode === "login") {
      if (form.email === DEMO_USER.email && form.password === DEMO_USER.password) {
        onAuth({ ...DEMO_USER, plan: "pro" });
      } else {
        setError("Invalid credentials. Try demo@signflow.io / demo123");
      }
    } else {
      if (!form.name || !form.email || !form.password || !form.org) { setError("Please fill all fields"); setLoading(false); return; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
      onAuth({ name: form.name, email: form.email, org: form.org, role: "Admin", avatar: form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), plan: "free" });
    }
    setLoading(false);
  };

  const inp = { width: "100%", padding: "11px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#111827", background: "#FAFAFA" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', system-ui, sans-serif", background: "#F9FAFB" }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: "linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, color: "#fff" }}>
        <div style={{ maxWidth: 360 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 22 }}>SignFlow Enterprise</span>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 16 }}>Secure.<br />Compliant.<br />Enterprise-ready.</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, fontSize: 15 }}>Join thousands of enterprises using SignFlow for legally binding eSignatures and document workflows.</p>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 10 }}>
            {["🔒 SOC 2 Type II Certified", "🌍 GDPR & eIDAS Compliant", "⚡ 99.99% Uptime SLA", "🤖 AI-Powered Document Intelligence"].map(f => (
              <div key={f} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 13, marginBottom: 32, display: "flex", alignItems: "center", gap: 4 }}>← Back to home</button>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>
            {mode === "login" ? "Sign in to your workspace" : "Start your free trial today"}
          </p>

          {/* Demo hint */}
          {mode === "login" && (
            <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#4338CA" }}>
              💡 Demo: <strong>demo@signflow.io</strong> / <strong>demo123</strong>
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && <input style={inp} placeholder="Full name" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />}
            <input style={inp} placeholder="Email address" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
            <input style={inp} placeholder="Password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
            {mode === "signup" && <input style={inp} placeholder="Organization name" value={form.org} onChange={e => setForm(p => ({...p, org: e.target.value}))} />}

            {error && <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ background: loading ? "#A5B4FC" : "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: "#fff", padding: "13px", borderRadius: 8, cursor: loading ? "wait" : "pointer", fontSize: 15, fontWeight: 700, marginTop: 4 }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B7280" }}>
            {mode === "login" ? <>Don't have an account? <button onClick={() => setMode("signup")} style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 600 }}>Sign up free</button></> : <>Already have an account? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "#6366F1", cursor: "pointer", fontWeight: 600 }}>Sign in</button></>}
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
            {["Google", "Microsoft"].map(p => (
              <button key={p} style={{ flex: 1, padding: "10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span style={{ fontSize: 16 }}>{p === "Google" ? "G" : "M"}</span> {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PDF Builder Modal ────────────────────────────────────────────────────────
const PDFBuilderModal = ({ open, onClose }) => {
  const [fields, setFields] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const fieldTypes = [
    { type: "signature", label: "Signature", color: "#6366F1", icon: "✍️" },
    { type: "initials", label: "Initials", color: "#8B5CF6", icon: "Aa" },
    { type: "date", label: "Date", color: "#0EA5E9", icon: "📅" },
    { type: "text", label: "Text", color: "#10B981", icon: "T" },
    { type: "checkbox", label: "Checkbox", color: "#F59E0B", icon: "☑" },
  ];

  const addField = (type) => {
    const newField = { id: Date.now(), type, x: 80 + Math.random()*200, y: 100 + fields.length * 60, width: 160, height: 44, signer: 1 };
    setFields(p => [...p, newField]);
  };

  const startDrag = (e, id) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const field = fields.find(f => f.id === id);
    setDragging(id);
    setOffset({ x: e.clientX - rect.left - field.x, y: e.clientY - rect.top - field.y });
    setSelectedField(id);
  };

  const onMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(e.clientX - rect.left - offset.x, rect.width - 160));
    const ny = Math.max(0, Math.min(e.clientY - rect.top - offset.y, rect.height - 44));
    setFields(p => p.map(f => f.id === dragging ? { ...f, x: nx, y: ny } : f));
  };

  const ft = (type) => fieldTypes.find(f => f.type === type) || fieldTypes[0];

  return (
    <Modal open={open} onClose={onClose} title="📄 PDF Signature Builder" width={900}>
      <div style={{ display: "flex", gap: 16, height: 540 }}>
        {/* Left tools */}
        <div style={{ width: 160, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Field Types</div>
          {fieldTypes.map(f => (
            <button key={f.type} onClick={() => addField(f.type)} style={{ background: `${f.color}15`, border: `1px solid ${f.color}40`, color: f.color, padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
              <span style={{ fontSize: 16 }}>{f.icon}</span>{f.label}
            </button>
          ))}
          <hr style={{ border: "none", borderTop: "1px solid #F3F4F6", margin: "8px 0" }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Fields ({fields.length})</div>
          {fields.map(f => (
            <div key={f.id} onClick={() => setSelectedField(f.id)} style={{ background: selectedField === f.id ? `${ft(f.type).color}15` : "#F9FAFB", border: `1px solid ${selectedField === f.id ? ft(f.type).color : "#E5E7EB"}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: ft(f.type).color, fontWeight: 600 }}>{ft(f.type).label}</span>
              <button onClick={(e) => { e.stopPropagation(); setFields(p => p.filter(x => x.id !== f.id)); }} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>

        {/* PDF canvas */}
        <div ref={canvasRef} style={{ flex: 1, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, position: "relative", overflow: "hidden", cursor: dragging ? "grabbing" : "default", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)" }}
          onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}>
          {/* Page lines */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 27px, #F3F4F6 27px, #F3F4F6 28px)", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: 20, left: 0, right: 0, textAlign: "center", color: "#D1D5DB", fontSize: 12, fontWeight: 600, userSelect: "none" }}>Page 1 of 4 — NDA Agreement 2025.pdf</div>
          {/* Mock text lines */}
          {[80,100,120,140,200,220,240,300,320,340,360,400,420,440].map(y => (
            <div key={y} style={{ position: "absolute", left: 40, right: 40, top: y, height: 10, background: "#F3F4F6", borderRadius: 3 }} />
          ))}
          <div style={{ position: "absolute", left: 40, top: 60, color: "#1F2937", fontWeight: 700, fontSize: 14 }}>NON-DISCLOSURE AGREEMENT</div>

          {fields.map(f => (
            <div key={f.id} onMouseDown={(e) => startDrag(e, f.id)} style={{ position: "absolute", left: f.x, top: f.y, width: f.width, height: f.height, border: `2px dashed ${ft(f.type).color}`, background: `${ft(f.type).color}12`, borderRadius: 6, cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", boxShadow: selectedField === f.id ? `0 0 0 3px ${ft(f.type).color}40` : "none" }}>
              <span style={{ color: ft(f.type).color, fontSize: 12, fontWeight: 700 }}>{ft(f.type).icon} {ft(f.type).label}</span>
            </div>
          ))}
          {fields.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#D1D5DB", fontSize: 14, pointerEvents: "none" }}>
              ← Click field types to add them here
            </div>
          )}
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "9px 20px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button style={{ padding: "9px 24px", border: "none", borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          Save & Send for Signature ({fields.length} fields)
        </button>
      </div>
    </Modal>
  );
};

// ─── Signature Modal ──────────────────────────────────────────────────────────
const SignatureModal = ({ open, onClose, onSign }) => {
  const [tab, setTab] = useState("draw");
  const [typedSig, setTypedSig] = useState("");
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (open && tab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#1F2937"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
      setHasDrawn(false);
    }
  }, [open, tab]);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startDraw = (e) => { setIsDrawing(true); lastPos.current = getPos(e, canvasRef.current); };
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos; setHasDrawn(true);
  };
  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const FONTS = ["'Dancing Script', cursive", "'Pacifico', cursive", "'Satisfy', cursive"];
  const [fontIdx, setFontIdx] = useState(0);

  return (
    <Modal open={open} onClose={onClose} title="✍️ Create Your Signature">
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#F9FAFB", borderRadius: 8, padding: 4 }}>
        {[["draw", "Draw"], ["type", "Type"], ["upload", "Upload"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: tab === k ? 700 : 400, background: tab === k ? "#fff" : "transparent", color: tab === k ? "#6366F1" : "#6B7280", boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {l}
          </button>
        ))}
      </div>

      {tab === "draw" && (
        <div>
          <canvas ref={canvasRef} width={460} height={160} style={{ width: "100%", height: 160, border: "1px solid #E5E7EB", borderRadius: 8, cursor: "crosshair", background: "#FAFAFA" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={clearCanvas} style={{ flex: 1, padding: "8px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 }}>Clear</button>
          </div>
        </div>
      )}

      {tab === "type" && (
        <div>
          <input value={typedSig} onChange={e => setTypedSig(e.target.value)} placeholder="Type your full name..." style={{ width: "100%", padding: "12px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            {FONTS.map((font, i) => (
              <div key={i} onClick={() => setFontIdx(i)} style={{ flex: 1, padding: "14px 8px", border: `2px solid ${fontIdx === i ? "#6366F1" : "#E5E7EB"}`, borderRadius: 8, cursor: "pointer", textAlign: "center", fontFamily: font, fontSize: 22, color: "#1F2937", background: fontIdx === i ? "#EEF2FF" : "#FAFAFA" }}>
                {typedSig || "Your Name"}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "upload" && (
        <div style={{ border: "2px dashed #E5E7EB", borderRadius: 12, padding: "40px 24px", textAlign: "center", color: "#9CA3AF" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
          <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Upload Signature Image</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>PNG or JPEG, transparent background preferred</div>
          <button style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Choose File</button>
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>Cancel</button>
        <button onClick={() => { onSign(); onClose(); }} style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          Apply Signature ✓
        </button>
      </div>
    </Modal>
  );
};

// ─── Send Document Modal ──────────────────────────────────────────────────────
const SendDocModal = ({ open, onClose, onSend }) => {
  const [step, setStep] = useState(1);
  const [signers, setSigners] = useState([{ email: "", name: "", order: 1 }]);
  const [message, setMessage] = useState("Please review and sign the attached document at your earliest convenience.");
  const [expiry, setExpiry] = useState("7");
  const [workflowType, setWorkflowType] = useState("sequential");

  const addSigner = () => setSigners(p => [...p, { email: "", name: "", order: p.length + 1 }]);
  const inp = { width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, boxSizing: "border-box" };

  return (
    <Modal open={open} onClose={onClose} title="📨 Send Document for Signature" width={580}>
      {/* Steps */}
      <div style={{ display: "flex", marginBottom: 24, gap: 0 }}>
        {["Recipients", "Message", "Review"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: step > i + 1 ? "#10B981" : step === i + 1 ? "#6366F1" : "#E5E7EB", color: step >= i + 1 ? "#fff" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, color: step === i + 1 ? "#6366F1" : "#9CA3AF", fontWeight: step === i + 1 ? 700 : 400 }}>{s}</span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Signing Workflow</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["sequential", "Sequential ↓"], ["parallel", "Parallel →"]].map(([k, l]) => (
              <div key={k} onClick={() => setWorkflowType(k)} style={{ flex: 1, padding: "10px", border: `2px solid ${workflowType === k ? "#6366F1" : "#E5E7EB"}`, borderRadius: 8, cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600, color: workflowType === k ? "#6366F1" : "#374151", background: workflowType === k ? "#EEF2FF" : "#FAFAFA" }}>{l}</div>
            ))}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Signers</div>
          {signers.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <input style={{ ...inp, flex: 1 }} placeholder="Name" value={s.name} onChange={e => { const ns = [...signers]; ns[i].name = e.target.value; setSigners(ns); }} />
              <input style={{ ...inp, flex: 2 }} placeholder="Email address" value={s.email} onChange={e => { const ns = [...signers]; ns[i].email = e.target.value; setSigners(ns); }} />
              {signers.length > 1 && <button onClick={() => setSigners(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 18 }}>×</button>}
            </div>
          ))}
          <button onClick={addSigner} style={{ background: "none", border: "1px dashed #D1D5DB", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#6366F1", fontWeight: 600 }}>+ Add Signer</button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Message to Signers</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Expiry (days)</label>
            <select value={expiry} onChange={e => setExpiry(e.target.value)} style={{ ...inp }}>
              {["3", "7", "14", "30", "60"].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked /> <span>Send reminder emails automatically</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked /> <span>Require identity verification</span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10 }}>SUMMARY</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#374151" }}>
              <div><strong>Workflow:</strong> {workflowType === "sequential" ? "Sequential (in order)" : "Parallel (simultaneously)"}</div>
              <div><strong>Signers:</strong> {signers.filter(s => s.email).length} recipient(s)</div>
              <div><strong>Expiry:</strong> {expiry} days from today</div>
              <div><strong>Reminders:</strong> Enabled</div>
            </div>
          </div>
          {signers.filter(s => s.email).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#EEF2FF", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6366F1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
              <div><div style={{ fontWeight: 600 }}>{s.name || "Unnamed"}</div><div style={{ color: "#6B7280", fontSize: 12 }}>{s.email}</div></div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between" }}>
        <button onClick={() => step > 1 ? setStep(p => p - 1) : onClose()} style={{ padding: "10px 20px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>
          {step > 1 ? "← Back" : "Cancel"}
        </button>
        <button onClick={() => { if (step < 3) setStep(p => p + 1); else { onSend(); onClose(); } }} style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
          {step < 3 ? "Next →" : "🚀 Send Document"}
        </button>
      </div>
    </Modal>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [templates] = useState(MOCK_TEMPLATES);
  const [showPDFBuilder, setShowPDFBuilder] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showSendDoc, setShowSendDoc] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profileOpen, setProfileOpen] = useState(false);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === "pending").length,
    completed: documents.filter(d => d.status === "completed").length,
    drafts: documents.filter(d => d.status === "draft").length,
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.signers.some(s => s.includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const navItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "documents", icon: "📄", label: "Documents" },
    { id: "templates", icon: "🗂️", label: "Templates" },
    { id: "workflows", icon: "🔄", label: "Workflows" },
    { id: "audit", icon: "🔍", label: "Audit Trail" },
    { id: "team", icon: "👥", label: "Team" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  const btnPrimary = { background: "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 };
  const btnSecondary = { background: "#fff", border: "1px solid #E5E7EB", color: "#374151", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#F9FAFB" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <PDFBuilderModal open={showPDFBuilder} onClose={() => setShowPDFBuilder(false)} />
      <SignatureModal open={showSignature} onClose={() => setShowSignature(false)} onSign={() => showToast("Signature applied and document signed!")} />
      <SendDocModal open={showSendDoc} onClose={() => setShowSendDoc(false)} onSend={() => { showToast("Document sent to signers! 📬"); }} />
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="📤 Upload Document">
        <div style={{ border: "2px dashed #6366F1", borderRadius: 12, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 6 }}>Drop your PDF here</div>
          <div style={{ color: "#6B7280", fontSize: 13, marginBottom: 20 }}>or click to browse — PDF, DOC, DOCX up to 50MB</div>
          <button style={{ ...btnPrimary }}>Browse Files</button>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setShowUpload(false)} style={{ ...btnSecondary }}>Cancel</button>
          <button onClick={() => { setShowUpload(false); setDocuments(p => [{ id: Date.now(), name: "New Document.pdf", status: "draft", signers: [], created: new Date().toISOString().split("T")[0], due: "", size: "—", pages: 1, tags: [] }, ...p]); showToast("Document uploaded successfully!"); }} style={{ ...btnPrimary }}>Upload</button>
        </div>
      </Modal>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#0F172A", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>SignFlow</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 600 }}>ENTERPRISE</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", border: "none", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: activeTab === item.id ? "rgba(99,102,241,0.2)" : "transparent", color: activeTab === item.id ? "#A5B4FC" : "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: activeTab === item.id ? 700 : 400, textAlign: "left" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
              {item.id === "documents" && stats.pending > 0 && <span style={{ marginLeft: "auto", background: "#6366F1", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{stats.pending}</span>}
            </button>
          ))}
        </nav>
        {/* User */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{user.org}</div>
            </div>
            <button onClick={onLogout} title="Sign out" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16 }}>⏻</button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #F3F4F6", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>
              {navItems.find(n => n.id === activeTab)?.icon} {navItems.find(n => n.id === activeTab)?.label}
            </h1>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setShowUpload(true)} style={{ ...btnSecondary }}>📤 Upload</button>
            <button onClick={() => setShowSendDoc(true)} style={{ ...btnSecondary }}>📨 Send</button>
            <button onClick={() => setShowPDFBuilder(true)} style={{ ...btnPrimary }}>+ New Document</button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }} onClick={() => setProfileOpen(true)}>
              {user.avatar}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {/* ── Overview ── */}
          {activeTab === "overview" && (
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Documents", value: stats.total, color: "#6366F1", icon: "📄", change: "+12%" },
                  { label: "Pending Signatures", value: stats.pending, color: "#F59E0B", icon: "⏳", change: "-3%" },
                  { label: "Completed", value: stats.completed, color: "#10B981", icon: "✅", change: "+8%" },
                  { label: "Drafts", value: stats.drafts, color: "#8B5CF6", icon: "✏️", change: "+2%" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: "#111827" }}>{s.value}</div>
                      </div>
                      <div style={{ fontSize: 24 }}>{s.icon}</div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: s.change.startsWith("+") ? "#10B981" : "#EF4444", fontWeight: 600 }}>
                      {s.change} this month
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111827" }}>Quick Actions</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "New Document", icon: "📄", action: () => setShowPDFBuilder(true), primary: true },
                    { label: "Send for Signing", icon: "📨", action: () => setShowSendDoc(true) },
                    { label: "Create Signature", icon: "✍️", action: () => setShowSignature(true) },
                    { label: "Upload PDF", icon: "📤", action: () => setShowUpload(true) },
                    { label: "View Templates", icon: "🗂️", action: () => setActiveTab("templates") },
                    { label: "Audit Log", icon: "🔍", action: () => setActiveTab("audit") },
                  ].map(a => (
                    <button key={a.label} onClick={a.action} style={a.primary ? btnPrimary : btnSecondary}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent documents */}
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Recent Documents</h3>
                  <button onClick={() => setActiveTab("documents")} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 12 }}>View All →</button>
                </div>
                {documents.slice(0, 4).map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <div style={{ width: 36, height: 36, background: "#EEF2FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📄</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{doc.created} · {doc.signers.length} signer(s)</div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {activeTab === "documents" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents or signers..." style={{ flex: 1, minWidth: 200, padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none" }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "9px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "#fff" }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                  <option value="expired">Expired</option>
                </select>
                <button onClick={() => setShowPDFBuilder(true)} style={{ ...btnPrimary }}>+ New Document</button>
              </div>

              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Document", "Status", "Signers", "Created", "Due Date", "Size", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>📄</span>
                            <div>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{doc.name}</div>
                              <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                                {doc.tags.map(t => <span key={t} style={{ background: "#F3F4F6", color: "#6B7280", padding: "1px 6px", borderRadius: 4, fontSize: 10 }}>{t}</span>)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}><StatusBadge status={doc.status} /></td>
                        <td style={{ padding: "12px 16px", color: "#6B7280" }}>{doc.signers.length} signer(s)</td>
                        <td style={{ padding: "12px 16px", color: "#6B7280" }}>{doc.created}</td>
                        <td style={{ padding: "12px 16px", color: doc.status === "expired" ? "#EF4444" : "#6B7280" }}>{doc.due || "—"}</td>
                        <td style={{ padding: "12px 16px", color: "#6B7280" }}>{doc.size}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setShowSignature(true)} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 11 }}>Sign</button>
                            <button onClick={() => setShowSendDoc(true)} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 11 }}>Send</button>
                            <button onClick={() => { setDocuments(p => p.filter(d => d.id !== doc.id)); showToast("Document deleted", "warn"); }} style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#EF4444", padding: "5px 8px", fontSize: 11, borderRadius: 6, cursor: "pointer" }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#9CA3AF" }}>No documents found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Templates ── */}
          {activeTab === "templates" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>Reusable document templates for your team</p>
                <button style={{ ...btnPrimary }}>+ Create Template</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {templates.map(t => (
                  <div key={t.id} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ background: "#EEF2FF", color: "#6366F1", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{t.category}</span>
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{t.uses} uses</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 6 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>{t.fields} signature fields</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setShowSendDoc(true); }} style={{ ...btnPrimary, flex: 1, justifyContent: "center", fontSize: 12 }}>Use Template</button>
                      <button style={{ ...btnSecondary, padding: "7px 10px" }}>✏️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Workflows ── */}
          {activeTab === "workflows" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                {[
                  { title: "Sequential Signing", desc: "Signers receive the document in a defined order. Each person must sign before it moves to the next.", icon: "↓", color: "#6366F1", example: "Owner → Manager → Client", active: 3 },
                  { title: "Parallel Signing", desc: "All signers receive the document simultaneously. Completed when all have signed.", icon: "→", color: "#10B981", example: "CEO + CFO + Legal (all at once)", active: 2 },
                ].map(w => (
                  <div key={w.title} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${w.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: w.color, fontWeight: 700 }}>{w.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{w.title}</div>
                        <div style={{ fontSize: 12, color: "#9CA3AF" }}>{w.active} active workflows</div>
                      </div>
                    </div>
                    <p style={{ color: "#6B7280", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{w.desc}</p>
                    <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#6B7280", fontFamily: "monospace", marginBottom: 14 }}>{w.example}</div>
                    <button onClick={() => setShowSendDoc(true)} style={{ ...btnPrimary, fontSize: 12 }}>Create Workflow</button>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111827" }}>Active Workflows</h3>
                {documents.filter(d => d.status === "pending").map(doc => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <div style={{ width: 36, height: 36, background: "#FEF3C7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⏳</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>Waiting for: {doc.signers.join(", ")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {doc.signers.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? "#F59E0B" : "#E5E7EB" }} />)}
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Audit Trail ── */}
          {activeTab === "audit" && (
            <div>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, overflow: "hidden", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>🔒 Tamper-Proof Audit Log</span>
                  <button style={{ ...btnSecondary, fontSize: 12 }}>⬇ Export CSV</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Timestamp", "Action", "User", "Document", "IP Address", "Browser"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_AUDIT.map(a => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "10px 16px", color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>{a.time}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ background: a.action.includes("signed") || a.action.includes("completed") ? "#D1FAE5" : a.action.includes("sent") ? "#DBEAFE" : "#F3F4F6", color: a.action.includes("signed") || a.action.includes("completed") ? "#065F46" : a.action.includes("sent") ? "#1E40AF" : "#374151", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {a.action}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", color: "#374151" }}>{a.user}</td>
                        <td style={{ padding: "10px 16px", color: "#6B7280", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.doc}</td>
                        <td style={{ padding: "10px 16px", color: "#9CA3AF", fontFamily: "monospace", fontSize: 12 }}>{a.ip}</td>
                        <td style={{ padding: "10px 16px", color: "#9CA3AF", fontSize: 12 }}>{a.browser}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Team ── */}
          {activeTab === "team" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <p style={{ margin: 0, color: "#6B7280", fontSize: 14 }}>Manage your organization's members and permissions</p>
                <button style={{ ...btnPrimary }}>+ Invite Member</button>
              </div>
              <div style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Member", "Role", "Documents", "Status", "Joined", "Actions"].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TEAM.map(m => (
                      <tr key={m.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>{m.name.split(" ").map(n=>n[0]).join("")}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#111827" }}>{m.name}</div>
                              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: m.role === "Admin" ? "#EEF2FF" : m.role === "Manager" ? "#FEF3C7" : "#F9FAFB", color: m.role === "Admin" ? "#4338CA" : m.role === "Manager" ? "#92400E" : "#374151", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{m.role}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#374151" }}>{m.docs}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: m.status === "active" ? "#D1FAE5" : "#FEE2E2", color: m.status === "active" ? "#065F46" : "#991B1B", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{m.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#9CA3AF" }}>{m.joined}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button style={{ ...btnSecondary, padding: "5px 10px", fontSize: 11 }}>Edit</button>
                            {m.role !== "Admin" && <button style={{ background: "#FEE2E2", border: "1px solid #FECACA", color: "#EF4444", padding: "5px 8px", fontSize: 11, borderRadius: 6, cursor: "pointer" }}>Remove</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {activeTab === "settings" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {[
                { title: "🏢 Organization", fields: [{ label: "Organization Name", value: user.org }, { label: "Domain", value: "acme.com" }, { label: "Industry", value: "Technology" }] },
                { title: "👤 Profile", fields: [{ label: "Full Name", value: user.name }, { label: "Email", value: user.email }, { label: "Role", value: user.role }] },
                { title: "🔐 Security", fields: [{ label: "Two-Factor Auth", value: "Enabled" }, { label: "SSO Provider", value: "Okta" }, { label: "Session Timeout", value: "8 hours" }] },
                { title: "📧 Notifications", fields: [{ label: "Email Alerts", value: "Enabled" }, { label: "SMS Reminders", value: "Disabled" }, { label: "Webhook URL", value: "https://api.acme.com/hooks" }] },
                { title: "💳 Plan & Billing", fields: [{ label: "Current Plan", value: user.plan === "pro" ? "Pro Plan" : "Free Plan" }, { label: "Documents/Month", value: user.plan === "pro" ? "Unlimited" : "5" }, { label: "Next Billing", value: "Jul 1, 2025" }] },
                { title: "⚖️ Compliance", fields: [{ label: "eIDAS Level", value: "Advanced" }, { label: "GDPR Status", value: "Compliant" }, { label: "SOC2 Type II", value: "Certified" }] },
              ].map(section => (
                <div key={section.title} style={{ background: "#fff", border: "1px solid #F3F4F6", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{section.title}</h3>
                  {section.fields.map(f => (
                    <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F9FAFB", fontSize: 13 }}>
                      <span style={{ color: "#6B7280" }}>{f.label}</span>
                      <span style={{ fontWeight: 600, color: "#111827" }}>{f.value}</span>
                    </div>
                  ))}
                  <button style={{ ...btnSecondary, marginTop: 14, fontSize: 12 }}>Edit Settings</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile modal */}
      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="👤 Profile">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20 }}>{user.avatar}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#111827" }}>{user.name}</div>
              <div style={{ color: "#6B7280", fontSize: 13 }}>{user.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span style={{ background: "#EEF2FF", color: "#6366F1", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{user.role}</span>
                <span style={{ background: "#D1FAE5", color: "#065F46", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{PLANS[user.plan]?.label} Plan</span>
              </div>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #F3F4F6" }} />
          <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
            {[["Organization", user.org], ["Member Since", "Jan 2024"], ["Documents Created", "24"], ["Last Login", "Today, 9:45 AM"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#6B7280" }}>{k}</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setProfileOpen(false); onLogout(); }} style={{ ...btnSecondary, justifyContent: "center", color: "#EF4444", borderColor: "#FECACA" }}>Sign Out</button>
        </div>
      </Modal>
    </div>
  );
};

// ─── Guest Mode Gate ──────────────────────────────────────────────────────────
const GuestDashboard = ({ guestActions, maxGuest, onLoginRequired, onLogout }) => {
  const [showSignature, setShowSignature] = useState(false);
  const [showSendDoc, setShowSendDoc] = useState(false);
  const [usedActions, setUsedActions] = useState(guestActions);
  const [toast, setToast] = useState(null);

  const tryAction = (cb) => {
    if (usedActions >= maxGuest) { onLoginRequired(); return; }
    setUsedActions(p => p + 1);
    cb();
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  return (
    <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <SignatureModal open={showSignature} onClose={() => setShowSignature(false)} onSign={() => showToast("Demo signature applied!")} />
      <SendDocModal open={showSendDoc} onClose={() => setShowSendDoc(false)} onSend={() => showToast("Demo send flow completed!")} />

      {/* Guest banner */}
      <div style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", color: "#fff", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
        <span>👋 You're in <strong>Guest Mode</strong> — {maxGuest - usedActions} free action(s) remaining</span>
        <button onClick={onLoginRequired} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          Sign In for Full Access →
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 6 }}>Try SignFlow Enterprise</h2>
        <p style={{ color: "#6B7280", marginBottom: 32 }}>Explore core features. {maxGuest - usedActions} free action(s) left before sign-in is required.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[
            { icon: "✍️", title: "Create Your Signature", desc: "Draw, type, or upload your personal signature", action: () => tryAction(() => setShowSignature(true)), locked: usedActions >= 1 },
            { icon: "📨", title: "Send for Signing", desc: "Set up a multi-signer document workflow", action: () => tryAction(() => setShowSendDoc(true)), locked: usedActions >= 2 },
            { icon: "📄", title: "PDF Builder", desc: "Drag & drop signature fields onto any PDF", action: onLoginRequired, locked: true, loginRequired: true },
            { icon: "🔄", title: "Approval Workflows", desc: "Sequential & parallel signing flows", action: onLoginRequired, locked: true, loginRequired: true },
            { icon: "🔍", title: "Audit Trail", desc: "Tamper-proof logs with IP & timestamps", action: onLoginRequired, locked: true, loginRequired: true },
            { icon: "👥", title: "Team Management", desc: "RBAC, SSO, and multi-tenant workspaces", action: onLoginRequired, locked: true, loginRequired: true },
          ].map((f, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${f.locked ? "#F3F4F6" : "#C7D2FE"}`, borderRadius: 12, padding: 20, opacity: f.loginRequired ? 0.7 : 1, position: "relative", overflow: "hidden" }}>
              {f.loginRequired && <div style={{ position: "absolute", top: 0, right: 0, background: "#6366F1", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: "0 12px 0 8px" }}>PRO</div>}
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 14 }}>{f.desc}</div>
              <button onClick={f.action} style={{ background: f.locked ? "#F3F4F6" : "linear-gradient(135deg, #6366F1, #8B5CF6)", border: "none", color: f.locked ? "#9CA3AF" : "#fff", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {f.loginRequired ? "🔒 Sign in to unlock" : usedActions >= (i + 1) ? "🔒 Sign in to continue" : "Try it free →"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Root App ────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | auth | guest | dashboard
  const [user, setUser] = useState(null);
  const [guestActions, setGuestActions] = useState(0);
  const MAX_GUEST = 2;

  const handleGuest = () => {
    if (guestActions >= MAX_GUEST) { setScreen("auth"); return; }
    setScreen("guest");
  };

  const handleAuth = (userData) => { setUser(userData); setScreen("dashboard"); };
  const handleLogout = () => { setUser(null); setScreen("landing"); };
  const handleLoginRequired = () => setScreen("auth");

  const handleGuestAction = () => {
    const next = guestActions + 1;
    setGuestActions(next);
    if (next >= MAX_GUEST) return;
  };

  return (
    <>
      {screen === "landing" && <LandingPage onLogin={() => setScreen("auth")} onGuest={handleGuest} guestActions={guestActions} maxGuest={MAX_GUEST} />}
      {screen === "auth" && <AuthPage onAuth={handleAuth} onBack={() => setScreen("landing")} />}
      {screen === "guest" && <GuestDashboard guestActions={guestActions} maxGuest={MAX_GUEST} onLoginRequired={handleLoginRequired} onLogout={handleLogout} />}
      {screen === "dashboard" && user && <Dashboard user={user} onLogout={handleLogout} />}
    </>
  );
}
