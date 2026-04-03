import { useState, useEffect, useMemo, useRef } from "react";
import { ref, onValue, push, set, update, remove } from "firebase/database";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { rtdb, auth } from "../config/firebase";
import {
  Search, Plus, Home, BarChart3, Map, Heart, Bell, Settings, ChevronLeft,
  Filter, X, Edit, Trash2, Eye, MapPin, Phone, User, DollarSign, TrendingUp,
  Building2, Landmark, TreePine, FileText, Tag, ArrowUpRight, CheckCircle,
  Clock, AlertCircle, Layers, Menu, Shield, Activity, Upload, Grid, List,
  SlidersHorizontal, Compass, Maximize2, LayoutDashboard, FolderOpen, Users,
  ScrollText, Loader2, Save, Image as ImageIcon
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Upload via Next.js API route — Cloudinary api_secret stays server-side only.
const uploadToCloudinary = async (file, propertyId = "general") => {
  const type = file.type.startsWith("video/") ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("propertyId", propertyId);
  formData.append("type", type);

  const res = await fetch("/api/upload", { method: "POST", body: formData });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  // Returns { url, thumbnailUrl, resourceType, publicId, name }
  return data;
};

// ═══════════════════════════════════════════════════════════
// FIREBASE REALTIME DATABASE — CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════
const fbSub = (path, cb) => {
  const r = ref(rtdb, path);
  return onValue(r, (snap) => {
    const d = snap.val();
    if (d) {
      const arr = Object.entries(d).map(([id, v]) => ({ ...v, id }));
      cb(arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
    } else {
      cb([]);
    }
  });
};

const fbPush = async (path, data) => {
  const r = ref(rtdb, path);
  const n = push(r);
  await set(n, { ...data, id: n.key });
  return n.key;
};

const fbUpdate = async (path, data) => {
  const r = ref(rtdb, path);
  await update(r, data);
};

const fbRemove = async (path) => {
  const r = ref(rtdb, path);
  await remove(r);
};

const addAudit = async (action, details, userName = "System") => {
  try {
    await fbPush("auditLogs", {
      action, details, userName,
      timestamp: new Date().toISOString(),
    });
  } catch (e) { console.error("Audit error:", e); }
};

const addNotif = async (type, message, pid) => {
  try {
    await fbPush("notifications", {
      type, message, propertyId: pid || "",
      read: false, createdAt: new Date().toISOString(),
    });
  } catch (e) { console.error("Notif error:", e); }
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
const gid = () => "p_" + Math.random().toString(36).substr(2, 9);

const fmt = (n) => {
  if (!n && n !== 0) return "₹0";
  n = Number(n);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const ago = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const TAGS = [
  "investment", "prime-location", "near-highway", "corner-site", "approved",
  "luxury", "urgent-sale", "gated-community", "near-it-park", "high-roi",
  "industrial", "commercial",
];

// SALES is now computed dynamically from real props in the Dashboard component

// ═══════════════════════════════════════════════════════════
// GLASS UI COMPONENTS
// ═══════════════════════════════════════════════════════════
const GC = ({ children, className = "", onClick, hover = true }) => (
  <div
    onClick={onClick}
    className={`relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl
      ${hover ? "transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]" : ""}
      ${onClick ? "cursor-pointer" : ""} ${className}`}
  >
    {children}
  </div>
);

const GI = ({ className = "", ...p }) => (
  <input
    {...p}
    className={`w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5
      text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none
      focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 transition-all ${className}`}
  />
);

const GS = ({ className = "", children, ...p }) => (
  <select
    {...p}
    className={`w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5
      text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all
      appearance-none ${className}`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
    }}
  >
    {children}
  </select>
);

const GT = ({ className = "", ...p }) => (
  <textarea
    {...p}
    className={`w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-3
      text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none
      focus:border-cyan-400/50 transition-all resize-none ${className}`}
  />
);

const SB = ({ status }) => {
  const colors = {
    available: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
    sold: "bg-rose-400/15 text-rose-400 border-rose-400/30",
    "on-hold": "bg-amber-400/15 text-amber-400 border-amber-400/30",
    draft: "bg-slate-400/15 text-slate-400 border-slate-400/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px]
      font-semibold uppercase tracking-wider border ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

const TI = ({ type, size = 16 }) => {
  const m = { land: TreePine, plot: Layers, house: Home, commercial: Building2 };
  const Icon = m[type] || Landmark;
  return <Icon size={size} />;
};

const Spin = ({ size = 20 }) => <Loader2 size={size} className="animate-spin text-cyan-400" />;

// ═══════════════════════════════════════════════════════════
// ROLE CONFIG — add emails that should have full admin access.
// All other authenticated users are read-only "viewers".
// ═══════════════════════════════════════════════════════════
const ADMIN_EMAILS = [
  "admin@propertynexus.com",
  // add more admin emails here, e.g. "owner@yourdomain.com"
];

const getUserRole = (email) =>
  email && ADMIN_EMAILS.includes(email.toLowerCase()) ? "admin" : "viewer";
// ═══════════════════════════════════════════════════════════
// ADD / EDIT MODAL  — top-level component so React never
// unmounts it mid-upload when parent state changes
// ═══════════════════════════════════════════════════════════
const PropModal = ({ editProp: ep, saving, showT, saveProp, onClose, currentUser }) => {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [f, sF] = useState({
    title: ep?.title || "", type: ep?.type || "plot", category: ep?.category || "residential",
    description: ep?.description || "", price: ep?.price || "", previousPrice: ep?.previousPrice || "",
    pricePerUnit: ep?.pricePerUnit || "", priceUnit: ep?.priceUnit || "sqft",
    size: ep?.size || "", sizeUnit: ep?.sizeUnit || "sqft", status: ep?.status || "draft",
    owner: ep?.owner || "", ownerContact: ep?.ownerContact || "",
    country: ep?.country || "India", state: ep?.state || "Karnataka",
    city: ep?.city || "Bangalore", area: ep?.area || "", pincode: ep?.pincode || "",
    lat: ep?.lat || "", lng: ep?.lng || "", tags: ep?.tags || [],
    facing: ep?.facing || "", nearHighway: ep?.nearHighway || false,
    cornerSite: ep?.cornerSite || false, approved: ep?.approved || false,
    negotiationNotes: ep?.negotiationNotes || "", images: ep?.images || [],
    videoUrl: ep?.videoUrl || "", videoThumb: ep?.videoThumb || "",
  });
  const [sTags, sSTags] = useState(ep?.tags || []);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [imgUrl, sImgUrl] = useState("");

  const TAGS = [
    "investment", "prime-location", "near-highway", "corner-site", "approved",
    "luxury", "urgent-sale", "gated-community", "near-it-park", "high-roi",
    "industrial", "commercial",
  ];

  const togT = (t) => sSTags((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]);
  const addImg = () => {
    if (imgUrl.trim()) {
      sF((prev) => ({ ...prev, images: [...(prev.images || []), imgUrl.trim()] }));
      sImgUrl("");
    }
  };
  const rmImg = (i) => sF((prev) => ({ ...prev, images: prev.images.filter((_, x) => x !== i) }));

  const handleImageFiles = async (fileList) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    if (!files.length) return;
    setUploading(true);
    const propId = ep?.id || "new";
    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Uploading image ${i + 1} of ${files.length}…`);
      try {
        const result = await uploadToCloudinary(files[i], propId);
        uploaded.push(result.url);
      } catch (err) {
        showT(`Image ${i + 1} failed: ${err.message}`, "error");
      }
    }
    if (uploaded.length) {
      sF((prev) => ({ ...prev, images: [...(prev.images || []), ...uploaded] }));
      showT(`${uploaded.length} image(s) uploaded`);
    }
    setUploadProgress("");
    setUploading(false);
  };

  const handleVideoFile = async (file) => {
    if (!file || !file.type.startsWith("video/")) { showT("Please select a video file", "error"); return; }
    setUploading(true);
    setUploadProgress("Uploading video… this may take a moment");
    const propId = ep?.id || "new";
    try {
      const result = await uploadToCloudinary(file, propId);
      sF((prev) => ({ ...prev, videoUrl: result.url, videoThumb: result.thumbnailUrl || "" }));
      showT("Video uploaded");
    } catch (err) {
      showT("Video upload failed: " + err.message, "error");
    }
    setUploadProgress("");
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files.length) return;
    if (files[0].type.startsWith("video/")) handleVideoFile(files[0]);
    else handleImageFiles(files);
  };

  const sub = () => {
    if (!f.title || !f.price) { showT("Title & Price required", "error"); return; }
    saveProp({
      ...f, price: +f.price, previousPrice: f.previousPrice ? +f.previousPrice : null,
      pricePerUnit: +f.pricePerUnit || 0, size: +f.size || 0,
      lat: +f.lat || 0, lng: +f.lng || 0, tags: sTags,
    });
  };

  const fmt = (n) => {
    if (!n && n !== 0) return "₹0";
    n = Number(n);
    if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-[#111827]/95 backdrop-blur-2xl
        border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="font-bold text-base text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {ep ? "Edit Property" : "Add Property"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Title *</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                placeholder="e.g. 2 Acre Farm Land" value={f.title} onChange={(e) => sF({ ...f, title: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Type</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.type} onChange={(e) => sF({ ...f, type: e.target.value })}>
                <option value="land">Land</option><option value="plot">Plot</option>
                <option value="house">House</option><option value="commercial">Commercial</option>
              </select></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Category</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.category} onChange={(e) => sF({ ...f, category: e.target.value })}>
                <option value="residential">Residential</option><option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
              </select></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Status</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.status} onChange={(e) => sF({ ...f, status: e.target.value })}>
                <option value="draft">Draft</option><option value="available">Available</option>
                <option value="on-hold">On Hold</option><option value="sold">Sold</option>
              </select></div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Price ₹ *</label>
              <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                placeholder="4500000" value={f.price} onChange={(e) => sF({ ...f, price: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Prev Price</label>
              <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.previousPrice} onChange={(e) => sF({ ...f, previousPrice: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Price/Unit</label>
              <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.pricePerUnit} onChange={(e) => sF({ ...f, pricePerUnit: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Unit</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.priceUnit} onChange={(e) => sF({ ...f, priceUnit: e.target.value })}>
                <option value="sqft">sqft</option><option value="acre">acre</option><option value="gunta">gunta</option>
              </select></div>
          </div>

          {/* Size + Facing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Size</label>
              <input type="number" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.size} onChange={(e) => sF({ ...f, size: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Size Unit</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.sizeUnit} onChange={(e) => sF({ ...f, sizeUnit: e.target.value })}>
                <option value="sqft">sqft</option><option value="acres">acres</option><option value="guntas">guntas</option>
              </select></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Facing</label>
              <select className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 transition-all appearance-none"
                style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center"}}
                value={f.facing} onChange={(e) => sF({ ...f, facing: e.target.value })}>
                <option value="">-</option><option value="east">East</option><option value="west">West</option>
                <option value="north">North</option><option value="south">South</option>
              </select></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Pincode</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.pincode} onChange={(e) => sF({ ...f, pincode: e.target.value })} /></div>
          </div>

          {/* Description */}
          <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Description</label>
            <textarea rows={2} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all resize-none"
              placeholder="Describe the property..." value={f.description} onChange={(e) => sF({ ...f, description: e.target.value })} /></div>

          {/* Location */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Area</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                placeholder="Devanahalli" value={f.area} onChange={(e) => sF({ ...f, area: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">City</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.city} onChange={(e) => sF({ ...f, city: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">State</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.state} onChange={(e) => sF({ ...f, state: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Owner</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.owner} onChange={(e) => sF({ ...f, owner: e.target.value })} /></div>
          </div>

          {/* Lat/Lng / Contact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Latitude</label>
              <input type="number" step="any" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.lat} onChange={(e) => sF({ ...f, lat: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Longitude</label>
              <input type="number" step="any" className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.lng} onChange={(e) => sF({ ...f, lng: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Contact</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.ownerContact} onChange={(e) => sF({ ...f, ownerContact: e.target.value })} /></div>
            <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Country</label>
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                value={f.country} onChange={(e) => sF({ ...f, country: e.target.value })} /></div>
          </div>

          {/* Images */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Images</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-cyan-400/30 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); if (!uploading) fileInputRef.current?.click(); }}
            >
              {uploading && uploadProgress.includes("image") ? (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Loader2 size={14} className="animate-spin" /><span className="text-xs">{uploadProgress}</span>
                </div>
              ) : (
                <>
                  <Upload size={18} className="mx-auto text-slate-500 mb-1" />
                  <p className="text-xs text-slate-400">Click or drag & drop images</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">JPG, PNG, WEBP · multiple supported</p>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)} />
            </div>
            <div className="flex gap-2 mt-2">
              <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all"
                placeholder="Or paste image URL…" value={imgUrl} onChange={(e) => sImgUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addImg()} />
              <button onClick={addImg} className="px-3 py-2 bg-white/[0.08] border border-white/[0.1] rounded-xl text-xs text-slate-300 flex-shrink-0">
                <ImageIcon size={14} />
              </button>
            </div>
            {/* FIX 2: Show uploaded images as <img> tags not background-image so they actually render */}
            {f.images?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {f.images.map((img, i) => (
                  <div key={i} className="relative group w-16 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                    <button onClick={() => rmImg(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Video</label>
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-3 flex items-center gap-3 hover:border-purple-400/30 transition-colors cursor-pointer"
              onClick={(e) => { e.stopPropagation(); if (!uploading) videoInputRef.current?.click(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f0 = e.dataTransfer.files[0]; if (f0?.type.startsWith("video/")) handleVideoFile(f0); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {uploading && uploadProgress.includes("video") ? (
                <div className="flex items-center gap-2 text-purple-400 w-full justify-center">
                  <Loader2 size={14} className="animate-spin" /><span className="text-xs">{uploadProgress}</span>
                </div>
              ) : f.videoUrl ? (
                <div className="flex items-center gap-2 w-full">
                  {f.videoThumb
                    ? <img src={f.videoThumb} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" onError={(e) => { e.target.style.display='none'; }} />
                    : <div className="w-12 h-8 rounded bg-purple-400/10 flex items-center justify-center flex-shrink-0"><Upload size={12} className="text-purple-400" /></div>
                  }
                  <p className="text-[10px] text-emerald-400 truncate flex-1">✓ Video ready</p>
                  <button onClick={(e) => { e.stopPropagation(); sF((prev) => ({ ...prev, videoUrl: "", videoThumb: "" })); }}
                    className="text-slate-500 hover:text-rose-400"><X size={13} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full justify-center">
                  <Upload size={14} className="text-slate-500" />
                  <span className="text-xs text-slate-400">Upload video (MP4, MOV) or drag & drop</span>
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => handleVideoFile(e.target.files?.[0])} />
            </div>
            <input className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all mt-2"
              placeholder="Or paste YouTube / video URL"
              value={f.videoUrl && !f.videoUrl.includes("cloudinary") ? f.videoUrl : ""}
              onChange={(e) => sF((prev) => ({ ...prev, videoUrl: e.target.value, videoThumb: "" }))} />
          </div>

          {/* Toggles */}
          <div className="flex gap-4 flex-wrap">
            {[{ k: "nearHighway", l: "Near Highway" }, { k: "cornerSite", l: "Corner Site" }, { k: "approved", l: "Approved" }].map((c) => (
              <label key={c.k} className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input type="checkbox" checked={f[c.k]} onChange={(e) => sF({ ...f, [c.k]: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-400" />{c.l}
              </label>
            ))}
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => (
                <button key={t} onClick={() => togT(t)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border
                    ${sTags.includes(t) ? "bg-cyan-400/15 text-cyan-400 border-cyan-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Negotiation Notes */}
          <div><label className="text-[10px] text-slate-500 uppercase block mb-1">Negotiation Notes</label>
            <textarea rows={2} className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 sm:px-4 py-3 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all resize-none"
              placeholder="Private notes..." value={f.negotiationNotes} onChange={(e) => sF({ ...f, negotiationNotes: e.target.value })} /></div>
        </div>

        <div className="p-4 border-t border-white/[0.06] flex justify-end gap-2">
          <button onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs text-slate-400 bg-white/[0.04] border border-white/[0.08]">Cancel</button>
          <button onClick={sub} disabled={saving}
            className="px-5 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-xs font-bold
              disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin text-slate-900" /> : <Save size={14} />}
            {ep ? "Save Changes" : "Add Property"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DOCUMENT TAB — upload docs to Cloudinary, store refs in RTDB
// ═══════════════════════════════════════════════════════════
const DocTab = ({ property: p, showT }) => {
  const docInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleDocFiles = async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    setUploading(true);
    const existing = p.documents || [];
    const newDocs = [...existing];
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await uploadToCloudinary(files[i], p.id);
        newDocs.push({
          id: "d_" + Math.random().toString(36).substr(2, 9),
          name: files[i].name,
          type: files[i].type,
          url: result.url,
          publicId: result.publicId,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        showT("Doc upload failed: " + err.message, "error");
      }
    }
    await fbUpdate(`properties/${p.id}`, { documents: newDocs });
    showT("Document(s) uploaded");
    setUploading(false);
  };

  const docs = p.documents || [];

  return (
    <GC className="p-4 space-y-3" hover={false}>
      <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Documents</h3>
      <div
        className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-cyan-400/30 transition-colors cursor-pointer"
        onClick={() => !uploading && docInputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDocFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs">Uploading…</span>
          </div>
        ) : (
          <>
            <Upload size={22} className="mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-400">Click or drag & drop documents</p>
            <p className="text-[10px] text-slate-600 mt-1">PDF, DOCX, images — title deeds, sale agreements, tax docs</p>
          </>
        )}
        <input ref={docInputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => handleDocFiles(e.target.files)} />
      </div>
      {docs.length === 0 && !uploading && <p className="text-xs text-slate-600 text-center py-2">No documents yet</p>}
      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
              <FileText size={14} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{doc.name}</p>
              <p className="text-[10px] text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
            </div>
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/[0.06] text-slate-400 hover:text-white transition-all">
              <Eye size={13} />
            </a>
          </div>
        ))}
      </div>
    </GC>
  );
};

// ═══════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════
const AuthScreen = ({ mode, setMode, form, setForm, onSubmit, error, busy }) => (
  <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
    <div className="fixed inset-0 pointer-events-none" style={{
      background: "radial-gradient(ellipse at 30% 40%, rgba(0,240,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, rgba(168,85,247,0.05) 0%, transparent 55%)"
    }} />
    <div className="w-full max-w-sm relative">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center mx-auto mb-3">
          <Landmark size={26} className="text-slate-900" />
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>PropertyNexus</h1>
        <p className="text-slate-500 text-sm mt-1">{mode === "login" ? "Sign in to your account" : "Create your account"}</p>
      </div>
      <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1.5">Full Name</label>
            <input type="text" placeholder="Rajesh Kumar" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all" />
          </div>
        )}
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1.5">Email</label>
          <input type="email" placeholder="you@example.com" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase block mb-1.5">Password</label>
          <input type="password" placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition-all" />
        </div>
        {mode === "signup" && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-cyan-500/[0.07] border border-cyan-400/20 rounded-xl">
            <Shield size={13} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              New accounts are <span className="text-slate-300 font-medium">viewer</span> by default — read-only access.
              Admin access is granted by the property manager.
            </p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-500/10 border border-rose-400/20 rounded-xl">
            <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
        <button onClick={onSubmit} disabled={busy}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold hover:shadow-[0_8px_30px_-8px_rgba(0,240,255,0.5)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />}
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>
        <p className="text-center text-xs text-slate-500">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setForm({ name: "", email: "", password: "" }); }}
            className="text-cyan-400 hover:text-cyan-300 font-medium">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  </div>
);

export default function PropertyNexus() {
  // ─── Auth state ───
  const [currentUser, setCurrentUser] = useState(null);  // Firebase Auth user object
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // Derived role — admin emails defined in ADMIN_EMAILS above; everyone else is viewer
  const userRole = getUserRole(currentUser?.email);
  const isAdmin = userRole === "admin";

  // ─── App state ───
  const [props, setProps] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fbOk, setFbOk] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [selProp, setSelProp] = useState(null);
  const [sidebar, setSidebar] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editProp, setEditProp] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [mobSearch, setMobSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [flt, setFlt] = useState({
    type: "", category: "", status: "", minPrice: "", maxPrice: "",
    area: "", nearHighway: "", cornerSite: "", facing: "", favOnly: false,
  });

  const showT = (m, t = "success") => {
    setToast({ m, t });
    setTimeout(() => setToast(null), 3000);
  };

  const unread = notifs.filter((n) => !n.read).length;

  // ─── Auth handlers ───
  const handleAuth = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        if (authForm.name.trim()) {
          await updateProfile(cred.user, { displayName: authForm.name.trim() });
        }
        // Write user record immediately on signup so Users page shows them right away
        const role = getUserRole(authForm.email);
        await fbUpdate(`users/${cred.user.uid}`, {
          uid: cred.user.uid,
          displayName: authForm.name.trim() || "",
          email: authForm.email,
          role,
          lastSeen: new Date().toISOString(),
        });
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      setAuthError(msgs[err.code] || err.message);
    }
    setAuthBusy(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProps([]); setNotifs([]); setAudits([]);
    setPage("dashboard"); setSelProp(null);
  };

  // ─── Listen for auth state, then subscribe to RTDB ───
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      // Upsert user record into RTDB so the Users page shows real signed-in users
      if (user) {
        fbUpdate(`users/${user.uid}`, {
          uid: user.uid,
          displayName: user.displayName || "",
          email: user.email || "",
          role: getUserRole(user.email),
          lastSeen: new Date().toISOString(),
        }).catch(() => {});
      }
    });
    return () => unsubAuth();
  }, []);

  // ─── Firebase realtime subscriptions (only when logged in) ───
  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    let unsub1, unsub2, unsub3;
    try {
      unsub1 = fbSub("properties", (data) => {
        setProps(data);
        setLoading(false);
        setFbOk(true);
      });
      unsub2 = fbSub("notifications", setNotifs);
      unsub3 = fbSub("auditLogs", setAudits);
    } catch (e) {
      console.error("Firebase subscription error:", e);
      setLoading(false);
    }
    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
    };
  }, [currentUser]);

  // ─── Filtered properties ───
  const filtered = useMemo(() => {
    return props.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !(p.title || "").toLowerCase().includes(q) &&
          !(p.area || "").toLowerCase().includes(q) &&
          !(p.id || "").toLowerCase().includes(q) &&
          !(p.city || "").toLowerCase().includes(q)
        ) return false;
      }
      if (flt.type && p.type !== flt.type) return false;
      if (flt.category && p.category !== flt.category) return false;
      if (flt.status && p.status !== flt.status) return false;
      if (flt.minPrice && p.price < +flt.minPrice) return false;
      if (flt.maxPrice && p.price > +flt.maxPrice) return false;
      if (flt.area && !(p.area || "").toLowerCase().includes(flt.area.toLowerCase())) return false;
      if (flt.nearHighway === "true" && !p.nearHighway) return false;
      if (flt.cornerSite === "true" && !p.cornerSite) return false;
      if (flt.facing && p.facing !== flt.facing) return false;
      if (flt.favOnly && !p.isFavorite) return false;
      return true;
    });
  }, [props, search, flt]);

  // ─── Stats ───
  const st = useMemo(() => {
    const t = props.length;
    const a = props.filter((p) => p.status === "available").length;
    const s = props.filter((p) => p.status === "sold").length;
    const h = props.filter((p) => p.status === "on-hold").length;
    const tv = props.filter((p) => p.status !== "sold").reduce((x, p) => x + (+p.price || 0), 0);
    const sv = props.filter((p) => p.status === "sold").reduce((x, p) => x + (+(p.finalSellingPrice || p.price) || 0), 0);
    const mv = [...props].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    return { t, a, s, h, tv, sv, mv };
  }, [props]);

  // ─── CRUD handlers ───
  const togFav = async (id) => {
    if (!isAdmin) { showT("Viewers cannot modify properties", "error"); return; }
    const p = props.find((x) => x.id === id);
    if (p) await fbUpdate(`properties/${id}`, { isFavorite: !p.isFavorite });
  };

  const delProp = async (id) => {
    if (!isAdmin) { showT("Only admins can delete properties", "error"); return; }
    const p = props.find((x) => x.id === id);
    if (!confirm(`Delete "${p?.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await fbRemove(`properties/${id}`);
      await addAudit("Deleted", `"${p?.title}"`, currentUser?.displayName || currentUser?.email || "User");
      await addNotif("status_change", `"${p?.title}" deleted`, id);
      if (selProp?.id === id) setSelProp(null);
      showT("Deleted successfully");
    } catch (e) {
      showT("Delete failed", "error");
    }
    setSaving(false);
  };

  const updStatus = async (id, s) => {
    if (!isAdmin) { showT("Only admins can change status", "error"); return; }
    const p = props.find((x) => x.id === id);
    setSaving(true);
    try {
      await fbUpdate(`properties/${id}`, { status: s, updatedAt: new Date().toISOString() });
      await addNotif("status_change", `"${p?.title}" → ${s}`, id);
      showT(`Status → ${s}`);
    } catch (e) {
      showT("Update failed", "error");
    }
    setSaving(false);
  };

  const saveProp = async (data) => {
    if (!isAdmin) { showT("Only admins can save properties", "error"); return; }
    setSaving(true);
    try {
      if (editProp) {
        await fbUpdate(`properties/${editProp.id}`, { ...data, updatedAt: new Date().toISOString() });
        await addAudit("Updated", `"${data.title}"`, currentUser?.displayName || currentUser?.email || "User");
        if (data.price && editProp.price && +data.price !== +editProp.price) {
          await addNotif("price_change", `Price: ${fmt(editProp.price)} → ${fmt(data.price)}`, editProp.id);
        }
        showT("Property updated");
      } else {
        const nd = {
          ...data, images: data.images || [], coverImage: 0, notes: [], buyers: [],
          views: 0, isFavorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          createdBy: currentUser?.uid || "unknown",
        };
        await fbPush("properties", nd);
        await addAudit("Created", `"${data.title}"`, currentUser?.displayName || currentUser?.email || "User");
        await addNotif("new_property", `New: "${data.title}"`, null);
        showT("Property added");
      }
      setShowAdd(false);
      setEditProp(null);
    } catch (e) {
      showT(e.message, "error");
    }
    setSaving(false);
  };

  const resetFlt = () => setFlt({
    type: "", category: "", status: "", minPrice: "", maxPrice: "",
    area: "", nearHighway: "", cornerSite: "", facing: "", favOnly: false,
  });

  // ─── NAV items ───
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, l: "Dashboard" },
    { id: "properties", icon: Building2, l: "Properties" },
    { id: "favorites", icon: Heart, l: "Favorites" },
    { id: "deals", icon: DollarSign, l: "Deals" },
    { id: "map", icon: Map, l: "Map View" },
    { id: "documents", icon: FolderOpen, l: "Documents" },
    { id: "analytics", icon: BarChart3, l: "Analytics" },
    { id: "users", icon: Users, l: "Users" },
    { id: "audit", icon: ScrollText, l: "Audit Logs" },
    { id: "settings", icon: Settings, l: "Settings" },
  ];

  // ═══════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════
  const SidebarComp = () => (
    <>
      {sidebar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebar(false)} />
      )}
      <div className={`fixed left-0 top-0 h-screen z-50 w-[260px] bg-[#0c1121]/95 backdrop-blur-2xl
        border-r border-white/[0.06] flex flex-col transition-transform duration-300
        ${sidebar ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>

        <div className="p-4 flex items-center justify-between border-b border-white/[0.06] h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Landmark size={18} className="text-slate-900" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: "'Outfit', sans-serif" }}>PropertyNexus</span>
          </div>
          <button onClick={() => setSidebar(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setPage(item.id); setSelProp(null); setSidebar(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${page === item.id
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                }`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="font-medium">{item.l}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.06]">
          <div className={`flex items-center gap-2 px-3 py-2 text-xs ${fbOk ? "text-emerald-400" : "text-rose-400"}`}>
            <div className={`w-2 h-2 rounded-full ${fbOk ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            {fbOk ? "Firebase Connected" : "Disconnected"}
          </div>
        </div>
      </div>
    </>
  );

  // ═══════════════════════════════════════════════════════════
  // TOPBAR
  // ═══════════════════════════════════════════════════════════
  const TopBar = () => (
    <div className="h-14 sm:h-16 bg-[#0c1121]/60 backdrop-blur-2xl border-b border-white/[0.06]
      flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button onClick={() => setSidebar(true)} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]">
          <Menu size={20} />
        </button>
        {/* Desktop search */}
        <div className="relative hidden sm:block max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <GI placeholder="Search properties, areas, IDs..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="pl-10 !py-2" />
        </div>
        {/* Mobile search toggle */}
        <button onClick={() => setMobSearch(!mobSearch)} className="sm:hidden p-2 rounded-xl text-slate-400">
          <Search size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {isAdmin && (
        <button
          onClick={() => { setShowAdd(true); setEditProp(null); }}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500
            rounded-xl text-slate-900 text-xs sm:text-sm font-bold
            hover:shadow-[0_8px_30px_-8px_rgba(0,240,255,0.4)] transition-all"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Property</span>
        </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]
              text-slate-400 hover:text-white transition-all"
          >
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 rounded-full
                text-[9px] font-bold text-white flex items-center justify-center">{unread}</span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 sm:top-12 w-72 sm:w-80 bg-[#111827]/95
              backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Notifications</h3>
                <button
                  onClick={async () => {
                    const unreadNotifs = notifs.filter((n) => !n.read);
                    if (!unreadNotifs.length) return;
                    // Multi-path atomic update — all reads in one RTDB call
                    const updates = {};
                    unreadNotifs.forEach((n) => { updates[`notifications/${n.id}/read`] = true; });
                    try {
                      const rootRef = ref(rtdb, "/");
                      await update(rootRef, updates);
                    } catch (_) {
                      for (const n of unreadNotifs) {
                        await fbUpdate(`notifications/${n.id}`, { read: true });
                      }
                    }
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300"
                >Mark all read</button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifs.length === 0 && <p className="text-xs text-slate-600 text-center py-6">No notifications</p>}
                {notifs.slice(0, 10).map((n) => (
                  <div key={n.id}
                    onClick={() => fbUpdate(`notifications/${n.id}`, { read: true })}
                    className={`px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer
                      ${!n.read ? "bg-cyan-400/[0.03]" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />}
                      <div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{ago(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-purple-500 to-rose-500
              flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 cursor-pointer">
            {(currentUser?.displayName?.[0] || currentUser?.email?.[0] || "U").toUpperCase()}
          </button>
          {showUserMenu && (
            <>
              {/* Click-outside overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              {/* Dropdown */}
              <div className="absolute right-0 top-11 w-52 bg-[#111827]/98 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-50 p-1">
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <p className="text-xs font-medium text-white truncate">{currentUser?.displayName || "User"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{currentUser?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase
                    ${isAdmin ? "bg-cyan-400/15 text-cyan-400" : "bg-slate-400/15 text-slate-400"}`}>
                    {userRole}
                  </span>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); handleSignOut(); }}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-400/10 rounded-lg mt-1 flex items-center gap-2">
                  <X size={13} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Mobile Search ───
  const MobSrch = () =>
    mobSearch ? (
      <div className="sm:hidden px-3 py-2 bg-[#0c1121]/60 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <GI placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 !py-2" autoFocus />
          {search && (
            <button onClick={() => { setSearch(""); setMobSearch(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={14} /></button>
          )}
        </div>
      </div>
    ) : null;

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const Dashboard = () => {
    // Compute sales trend from real data — last 6 months
    const salesTrend = useMemo(() => {
      const now = new Date();
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const month = d.toLocaleString("default", { month: "short" });
        const yr = d.getFullYear();
        const mo = d.getMonth();
        const sold = props.filter((p) => {
          if (!p.soldDate && p.status !== "sold") return false;
          const sd = new Date(p.soldDate || p.updatedAt || "");
          return sd.getFullYear() === yr && sd.getMonth() === mo;
        });
        const added = props.filter((p) => {
          const cd = new Date(p.createdAt || "");
          return cd.getFullYear() === yr && cd.getMonth() === mo;
        });
        const value = sold.reduce((s, p) => s + (+(p.finalSellingPrice || p.price) || 0), 0) / 1e5; // in Lakhs
        return { month, sales: sold.length, added: added.length, value: Math.round(value * 10) / 10 };
      });
    }, [props]);

    return (
    <div className="space-y-4 sm:space-y-6 animate-[fadeIn_0.3s]">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Dashboard</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Property portfolio overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { l: "Total", v: st.t, icon: Building2, c: "cyan", sub: `${st.a} available` },
          { l: "Available", v: st.a, icon: CheckCircle, c: "emerald", sub: fmt(st.tv) },
          { l: "Sold", v: st.s, icon: TrendingUp, c: "rose", sub: fmt(st.sv) },
          { l: "On Hold", v: st.h, icon: Clock, c: "amber", sub: `${props.filter((p) => p.status === "draft").length} drafts` },
        ].map((s, i) => (
          <GC key={i} className="p-3 sm:p-5" hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider">{s.l}</p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.v}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{s.sub}</p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${s.c === "cyan" ? "bg-cyan-400/10 text-cyan-400" : s.c === "emerald" ? "bg-emerald-400/10 text-emerald-400"
                : s.c === "rose" ? "bg-rose-400/10 text-rose-400" : "bg-amber-400/10 text-amber-400"}`}>
                <s.icon size={18} />
              </div>
            </div>
          </GC>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <GC className="p-4 sm:p-5 lg:col-span-2" hover={false}>
          <h3 className="font-semibold text-sm text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Sales Trend <span className="text-[10px] font-normal text-slate-500 ml-2">last 6 months · ₹L sold</span></h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="cv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} width={30} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11, color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={2} fill="url(#cv)" />
            </AreaChart>
          </ResponsiveContainer>
        </GC>

        <GC className="p-4 sm:p-5" hover={false}>
          <h3 className="font-semibold text-sm text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>By Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={(() => {
                  const counts = [
                    { name: "Land", value: props.filter((p) => p.type === "land").length },
                    { name: "Plot", value: props.filter((p) => p.type === "plot").length },
                    { name: "House", value: props.filter((p) => p.type === "house").length },
                    { name: "Comm", value: props.filter((p) => p.type === "commercial").length },
                  ];
                  // Only show slices with actual data; fallback to placeholder if all zero
                  const total = counts.reduce((s, c) => s + c.value, 0);
                  return total > 0 ? counts.filter((c) => c.value > 0) : [{ name: "No data", value: 1 }];
                })()}
                cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value"
              >
                {["#00f0ff", "#a855f7", "#34d399", "#fbbf24", "#64748b"].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11, color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1 justify-center">
            {[{ l: "Land", c: "#00f0ff" }, { l: "Plot", c: "#a855f7" }, { l: "House", c: "#34d399" }, { l: "Comm", c: "#fbbf24" }].map((i) => (
              <div key={i.l} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <div className="w-2 h-2 rounded-full" style={{ background: i.c }} />{i.l}
              </div>
            ))}
          </div>
        </GC>
      </div>

      {/* Most Viewed + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <GC className="p-4 sm:p-5" hover={false}>
          <h3 className="font-semibold text-sm text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Most Viewed</h3>
          <div className="space-y-2">
            {st.mv.length === 0 && <p className="text-xs text-slate-600 text-center py-4">No properties yet</p>}
            {st.mv.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl hover:bg-white/[0.04] cursor-pointer"
                onClick={() => { setSelProp(p); setPage("properties"); }}>
                <span className="text-[10px] font-mono text-slate-600 w-4">#{i + 1}</span>
                {p.images?.[0]
                  ? <div className="w-9 h-9 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
                  : <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Building2 size={14} className="text-slate-600" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-200 font-medium truncate">{p.title}</p>
                  <p className="text-[10px] text-slate-500">{p.area} · {fmt(p.price)}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500"><Eye size={11} />{p.views || 0}</div>
              </div>
            ))}
          </div>
        </GC>

        <GC className="p-4 sm:p-5" hover={false}>
          <h3 className="font-semibold text-sm text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Recent Activity</h3>
          <div className="space-y-2">
            {notifs.length === 0 && <p className="text-xs text-slate-600 text-center py-4">No activity yet</p>}
            {notifs.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start gap-2 p-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                  ${n.type === "price_change" ? "bg-amber-400/10 text-amber-400"
                  : n.type === "status_change" ? "bg-emerald-400/10 text-emerald-400"
                  : "bg-cyan-400/10 text-cyan-400"}`}>
                  {n.type === "price_change" ? <TrendingUp size={13} /> : n.type === "status_change" ? <CheckCircle size={13} /> : <Plus size={13} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-300 leading-relaxed truncate">{n.message}</p>
                  <p className="text-[10px] text-slate-600">{ago(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </GC>
      </div>
    </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // PROPERTY CARD
  // ═══════════════════════════════════════════════════════════
  const PCard = ({ property: p }) => (
    <GC className="overflow-hidden group" onClick={() => setSelProp(p)}>
      <div className="relative h-36 sm:h-44 bg-cover bg-center bg-slate-800"
        style={p.images?.[p.coverImage || 0] ? { backgroundImage: `url(${p.images[p.coverImage || 0]})` } : {}}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent" />
        {!p.images?.[0] && <div className="absolute inset-0 flex items-center justify-center"><Building2 size={32} className="text-slate-700" /></div>}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5">
          <SB status={p.status} />
          {p.cornerSite && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-purple-400/20 text-purple-300 border border-purple-400/30">CORNER</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); togFav(p.id); }}
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-lg backdrop-blur-sm
            flex items-center justify-center transition-all
            ${p.isFavorite ? "bg-rose-500/30 text-rose-400" : "bg-black/30 text-white/60 hover:text-white"}`}>
          <Heart size={13} fill={p.isFavorite ? "currentColor" : "none"} />
        </button>
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-10">
          <p className="font-bold text-white text-sm sm:text-base leading-tight drop-shadow-lg line-clamp-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}>{p.title}</p>
          <div className="flex items-center gap-1 mt-0.5 text-slate-300 text-[11px]"><MapPin size={10} />{p.area}, {p.city}</div>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base sm:text-lg font-bold text-cyan-400" style={{ fontFamily: "'Outfit', sans-serif" }}>{fmt(p.price)}</p>
            {p.previousPrice && <p className="text-[10px] text-slate-500 line-through">{fmt(p.previousPrice)}</p>}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-[11px] text-slate-400">
            <TI type={p.type} size={11} />
            <span className="capitalize hidden sm:inline">{p.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 mt-2 text-[10px] sm:text-xs text-slate-500">
          <span>{p.size} {p.sizeUnit}</span>
          <span>₹{p.pricePerUnit}/{p.priceUnit}</span>
          {p.facing && <span className="hidden sm:flex items-center gap-1"><Compass size={10} />{p.facing}</span>}
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {(p.tags || []).slice(0, 2).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-white/[0.06] text-slate-400 border border-white/[0.06]">{t}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 text-[10px] text-slate-500"><Eye size={10} />{p.views || 0}</div>
          {isAdmin && (
          <div className="flex gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); setEditProp(p); setShowAdd(true); }}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all"><Edit size={12} /></button>
            <button onClick={(e) => { e.stopPropagation(); delProp(p.id); }}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"><Trash2 size={12} /></button>
          </div>
          )}
        </div>
      </div>
    </GC>
  );

  // ═══════════════════════════════════════════════════════════
  // PROPERTY DETAIL
  // ═══════════════════════════════════════════════════════════
  const PDetail = ({ property: p }) => {
    const [tab, setTab] = useState("overview");
    const [aImg, setAImg] = useState(0);
    const [nNote, setNNote] = useState("");
    const [nBuyer, setNBuyer] = useState({ name: "", contact: "", notes: "" });
    const [sv, setSv] = useState(false);
    const lp = props.find((x) => x.id === p.id) || p;

    const addNote = async () => {
      if (!nNote.trim()) return;
      setSv(true);
      try {
        await fbUpdate(`properties/${p.id}`, {
          notes: [...(lp.notes || []), { id: gid(), text: nNote, createdAt: new Date().toISOString(), author: "Admin" }],
        });
        setNNote("");
        showT("Note added");
      } catch (e) { showT("Error", "error"); }
      setSv(false);
    };

    const addBuy = async () => {
      if (!nBuyer.name.trim()) return;
      setSv(true);
      try {
        await fbUpdate(`properties/${p.id}`, {
          buyers: [...(lp.buyers || []), { id: gid(), ...nBuyer, addedAt: new Date().toISOString() }],
        });
        setNBuyer({ name: "", contact: "", notes: "" });
        showT("Buyer added");
      } catch (e) { showT("Error", "error"); }
      setSv(false);
    };

    return (
      <div className="space-y-3 sm:space-y-4 animate-[fadeIn_0.3s]">
        <button onClick={() => setSelProp(null)} className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-white">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Hero Image */}
        <GC className="overflow-hidden" hover={false}>
          <div className="relative h-48 sm:h-64 md:h-80 bg-cover bg-center bg-slate-800"
            style={lp.images?.[aImg] ? { backgroundImage: `url(${lp.images[aImg]})` } : {}}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 to-transparent" />
            {!lp.images?.[0] && <div className="absolute inset-0 flex items-center justify-center"><Building2 size={48} className="text-slate-700" /></div>}
            <div className="absolute top-3 left-3"><SB status={lp.status} /></div>
            <button onClick={() => togFav(p.id)}
              className={`absolute top-3 right-3 w-9 h-9 rounded-xl backdrop-blur-sm flex items-center justify-center
                ${lp.isFavorite ? "bg-rose-500/30 text-rose-400" : "bg-black/40 text-white/70"}`}>
              <Heart size={16} fill={lp.isFavorite ? "currentColor" : "none"} />
            </button>
            <div className="absolute bottom-3 left-3 right-3">
              <h1 className="text-lg sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{lp.title}</h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-300 text-xs"><MapPin size={13} />{lp.area}, {lp.city}, {lp.state}</div>
            </div>
          </div>
          {lp.images?.length > 1 && (
            <div className="flex gap-1.5 p-2 overflow-x-auto">
              {lp.images.map((img, i) => (
                <button key={i} onClick={() => setAImg(i)}
                  className={`w-12 h-9 sm:w-16 sm:h-12 rounded-lg bg-cover bg-center border-2 flex-shrink-0
                    ${i === aImg ? "border-cyan-400" : "border-transparent opacity-60 hover:opacity-100"}`}
                  style={{ backgroundImage: `url(${img})` }} />
              ))}
            </div>
          )}
        </GC>

        {/* Quick Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { l: "Price", v: fmt(lp.price), icon: DollarSign, c: "text-cyan-400" },
            { l: "Size", v: `${lp.size} ${lp.sizeUnit}`, icon: Maximize2, c: "text-purple-400" },
            { l: "Type", v: lp.type, icon: Building2, c: "text-emerald-400" },
            { l: "ID", v: (lp.id || "").substring(0, 12), icon: Tag, c: "text-amber-400" },
          ].map((x, i) => (
            <GC key={i} className="p-2.5 flex items-center gap-2" hover={false}>
              <div className={`w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 ${x.c}`}><x.icon size={14} /></div>
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 uppercase">{x.l}</p>
                <p className={`text-xs font-semibold capitalize truncate ${x.c}`}>{x.v}</p>
              </div>
            </GC>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-x-auto">
          {["overview", "notes", "buyers", "documents"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-medium capitalize px-2
                ${tab === t ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-slate-500 hover:text-slate-300"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <GC className="p-4 space-y-3" hover={false}>
              <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Description</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{lp.description || "No description"}</p>
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Details</h4>
                {[
                  { l: "Price/unit", v: `₹${lp.pricePerUnit}/${lp.priceUnit}` },
                  { l: "Category", v: lp.category }, { l: "Facing", v: lp.facing || "N/A" },
                  { l: "Highway", v: lp.nearHighway ? "Yes" : "No" },
                  { l: "Corner", v: lp.cornerSite ? "Yes" : "No" },
                  { l: "Approved", v: lp.approved ? "Yes" : "No" },
                ].map((d) => (
                  <div key={d.l} className="flex justify-between text-xs">
                    <span className="text-slate-500">{d.l}</span>
                    <span className="text-slate-200 font-medium capitalize">{d.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {(lp.tags || []).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">{t}</span>
                ))}
              </div>
            </GC>

            <div className="space-y-3">
              <GC className="p-4" hover={false}>
                <h3 className="font-semibold text-white text-sm mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Owner</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2"><User size={13} className="text-slate-500" /><span className="text-xs text-slate-300">{lp.owner || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Phone size={13} className="text-slate-500" /><span className="text-xs text-slate-300">{lp.ownerContact || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={13} className="text-slate-500" /><span className="text-xs text-slate-300">{lp.pincode || "N/A"}</span></div>
                </div>
              </GC>

              <GC className="p-4" hover={false}>
                <h3 className="font-semibold text-white text-sm mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Change Status</h3>
                {isAdmin ? (
                <div className="flex gap-1.5 flex-wrap">
                  {["available", "on-hold", "sold", "draft"].map((s) => (
                    <button key={s} onClick={() => updStatus(p.id, s)} disabled={saving}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize border
                        ${lp.status === s ? "bg-cyan-400/15 text-cyan-400 border-cyan-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06] hover:bg-white/[0.08]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                ) : (
                  <p className="text-xs text-slate-600">Admin access required to change status</p>
                )}
              </GC>

              {lp.negotiationNotes && (
                <GC className="p-4" hover={false}>
                  <h3 className="font-semibold text-white text-sm mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Negotiation</h3>
                  <p className="text-xs text-slate-400">{lp.negotiationNotes}</p>
                </GC>
              )}
            </div>
          </div>
        )}

        {/* Tab: Notes */}
        {tab === "notes" && (
          <GC className="p-4 space-y-3" hover={false}>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Internal Notes</h3>
            {isAdmin && (
            <div className="flex gap-2">
              <GI placeholder="Add a note..." value={nNote} onChange={(e) => setNNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} />
              <button onClick={addNote} disabled={sv}
                className="px-3 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-xs font-bold flex-shrink-0 disabled:opacity-50">
                {sv ? <Spin size={14} /> : "Add"}
              </button>
            </div>
            )}
            <div className="space-y-2">
              {(lp.notes || []).length === 0 && <p className="text-xs text-slate-600 py-4 text-center">No notes yet</p>}
              {(lp.notes || []).map((n) => (
                <div key={n.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-xs text-slate-300">{n.text}</p>
                  <div className="flex gap-2 mt-1.5 text-[10px] text-slate-600">
                    <span>{n.author}</span><span>·</span><span>{ago(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </GC>
        )}

        {/* Tab: Buyers */}
        {tab === "buyers" && (
          <GC className="p-4 space-y-3" hover={false}>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Interested Buyers</h3>
            {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <GI placeholder="Name" value={nBuyer.name} onChange={(e) => setNBuyer({ ...nBuyer, name: e.target.value })} />
              <GI placeholder="Contact" value={nBuyer.contact} onChange={(e) => setNBuyer({ ...nBuyer, contact: e.target.value })} />
              <div className="flex gap-2">
                <GI placeholder="Notes" value={nBuyer.notes} onChange={(e) => setNBuyer({ ...nBuyer, notes: e.target.value })} />
                <button onClick={addBuy} disabled={sv}
                  className="px-3 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-xs font-bold flex-shrink-0 disabled:opacity-50">
                  {sv ? <Spin size={14} /> : "Add"}
                </button>
              </div>
            </div>
            )}
            <div className="space-y-2">
              {(lp.buyers || []).length === 0 && <p className="text-xs text-slate-600 py-4 text-center">No buyers yet</p>}
              {(lp.buyers || []).map((b) => (
                <div key={b.id} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center text-purple-400 flex-shrink-0"><User size={14} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200">{b.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{b.contact} · {b.notes}</p>
                  </div>
                  <p className="text-[10px] text-slate-600 flex-shrink-0">{ago(b.addedAt)}</p>
                </div>
              ))}
            </div>
          </GC>
        )}

        {/* Tab: Documents */}
        {tab === "documents" && (
          <DocTab property={lp} showT={showT} />
        )}
      </div>
    );
  };


  // PropModal rendered as top-level component (see above main fn) to prevent remount on parent re-render

    // ═══════════════════════════════════════════════════════════
  // FILTER PANEL
  // ═══════════════════════════════════════════════════════════
  const FilterPanel = () => (
    <GC className="p-3 space-y-2" hover={false}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-xs text-white flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <SlidersHorizontal size={14} /> Filters
        </h3>
        <button onClick={resetFlt} className="text-[10px] text-cyan-400">Reset</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
        <GS value={flt.type} onChange={(e) => setFlt({ ...flt, type: e.target.value })}>
          <option value="">All Types</option><option value="land">Land</option>
          <option value="plot">Plot</option><option value="house">House</option><option value="commercial">Commercial</option>
        </GS>
        <GS value={flt.category} onChange={(e) => setFlt({ ...flt, category: e.target.value })}>
          <option value="">All Categories</option><option value="residential">Residential</option>
          <option value="commercial">Commercial</option><option value="agricultural">Agricultural</option>
        </GS>
        <GS value={flt.status} onChange={(e) => setFlt({ ...flt, status: e.target.value })}>
          <option value="">All Status</option><option value="available">Available</option>
          <option value="on-hold">On Hold</option><option value="sold">Sold</option><option value="draft">Draft</option>
        </GS>
        <GI placeholder="Min ₹" type="number" value={flt.minPrice} onChange={(e) => setFlt({ ...flt, minPrice: e.target.value })} />
        <GI placeholder="Max ₹" type="number" value={flt.maxPrice} onChange={(e) => setFlt({ ...flt, maxPrice: e.target.value })} />
        <GI placeholder="Area" value={flt.area} onChange={(e) => setFlt({ ...flt, area: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <GS className="!w-auto !text-xs" value={flt.facing} onChange={(e) => setFlt({ ...flt, facing: e.target.value })}>
          <option value="">Facing</option><option value="east">East</option>
          <option value="west">West</option><option value="north">North</option><option value="south">South</option>
        </GS>
        <GS className="!w-auto !text-xs" value={flt.nearHighway} onChange={(e) => setFlt({ ...flt, nearHighway: e.target.value })}>
          <option value="">Highway</option><option value="true">Near Highway</option>
        </GS>
        <button onClick={() => setFlt({ ...flt, favOnly: !flt.favOnly })}
          className={`px-2.5 py-2 rounded-xl text-[10px] font-medium border
            ${flt.favOnly ? "bg-rose-400/15 text-rose-400 border-rose-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06]"}`}>
          <Heart size={11} className="inline mr-1" fill={flt.favOnly ? "currentColor" : "none"} />Favs
        </button>
      </div>
    </GC>
  );

  // ═══════════════════════════════════════════════════════════
  // PROPERTIES PAGE
  // ═══════════════════════════════════════════════════════════
  const PropsPage = () => (
    <div className="space-y-3 animate-[fadeIn_0.3s]">
      {selProp ? <PDetail property={selProp} /> : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Properties</h1>
              <p className="text-slate-500 text-xs mt-0.5">{filtered.length} of {props.length}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowFilter(!showFilter)}
                className={`p-2 rounded-xl border ${showFilter ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08]"}`}>
                <Filter size={15} /></button>
              <button onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl border hidden sm:block ${viewMode === "grid" ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08]"}`}>
                <Grid size={15} /></button>
              <button onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl border hidden sm:block ${viewMode === "list" ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08]"}`}>
                <List size={15} /></button>
            </div>
          </div>

          {showFilter && <FilterPanel />}

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((p) => <PCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <GC key={p.id} className="p-3 flex items-center gap-3 group" onClick={() => setSelProp(p)}>
                  {p.images?.[0]
                    ? <div className="w-14 h-11 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
                    : <div className="w-14 h-11 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Building2 size={14} className="text-slate-600" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white truncate" style={{ fontFamily: "'Outfit', sans-serif" }}>{p.title}</p>
                      <SB status={p.status} />
                    </div>
                    <div className="flex gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span><MapPin size={9} className="inline" /> {p.area}</span>
                      <span>{p.size} {p.sizeUnit}</span>
                    </div>
                  </div>
                  <p className="font-bold text-cyan-400 text-xs flex-shrink-0">{fmt(p.price)}</p>
                  {isAdmin && (
                  <div className="hidden sm:flex gap-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); togFav(p.id); }}
                      className={`p-1.5 rounded-lg ${p.isFavorite ? "text-rose-400" : "text-slate-500"}`}>
                      <Heart size={13} fill={p.isFavorite ? "currentColor" : "none"} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditProp(p); setShowAdd(true); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white"><Edit size={13} /></button>
                    <button onClick={(e) => { e.stopPropagation(); delProp(p.id); }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                  </div>
                  )}
                </GC>
              ))}
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 size={36} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">{props.length === 0 ? "No properties yet. Add your first one!" : "No properties match your filters"}</p>
              {props.length === 0
                ? <button onClick={() => setShowAdd(true)} className="mt-3 px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold">Add First Property</button>
                : <button onClick={resetFlt} className="text-cyan-400 text-sm mt-2 hover:underline">Reset filters</button>
              }
            </div>
          )}
        </>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // OTHER PAGES
  // ═══════════════════════════════════════════════════════════
  const FavsPage = () => {
    const fv = props.filter((p) => p.isFavorite);
    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        {selProp ? <PDetail property={selProp} /> : (
          <>
            <div><h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Favorites</h1>
              <p className="text-slate-500 text-xs mt-1">{fv.length} shortlisted</p></div>
            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3 gap-3">
              {fv.map((p) => <PCard key={p.id} property={p} />)}
            </div>
            {fv.length === 0 && <div className="text-center py-16"><Heart size={36} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500 text-sm">No favorites yet</p></div>}
          </>
        )}
      </div>
    );
  };

  const DealsPage = () => {
    const deals = props.filter((p) => (p.buyers || []).length > 0 || p.status === "sold" || p.status === "on-hold");
    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Deal Tracker</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {["on-hold", "available", "sold"].map((status) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2"><SB status={status} /><span className="text-[10px] text-slate-500">({deals.filter((d) => d.status === status).length})</span></div>
              <div className="space-y-2">
                {deals.filter((d) => d.status === status).map((d) => (
                  <GC key={d.id} className="p-3" onClick={() => { setSelProp(d); setPage("properties"); }}>
                    <p className="font-semibold text-xs text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>{d.title}</p>
                    <p className="text-cyan-400 font-semibold text-xs mt-1">{fmt(d.price)}</p>
                    {(d.buyers || []).length > 0 && <div className="mt-1">{d.buyers.map((b) => (
                      <div key={b.id} className="text-[10px] text-slate-500"><User size={9} className="inline mr-1" />{b.name}</div>
                    ))}</div>}
                  </GC>
                ))}
                {deals.filter((d) => d.status === status).length === 0 && <p className="text-xs text-slate-600 text-center py-4">No deals</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MapPage = () => {
    const [selMapProp, setSelMapProp] = useState(null);
    const mappable = props.filter((p) => p.lat && p.lng);

    // Build an OpenStreetMap URL centred on the average of all properties
    const centerLat = mappable.length
      ? (mappable.reduce((s, p) => s + +p.lat, 0) / mappable.length).toFixed(4)
      : "12.9716";
    const centerLng = mappable.length
      ? (mappable.reduce((s, p) => s + +p.lng, 0) / mappable.length).toFixed(4)
      : "77.5946";

    // Build marker string for OSM iframe — one marker per property with colour
    const statusColor = { available: "green", sold: "red", "on-hold": "orange", draft: "grey" };

    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Map View</h1>
            <p className="text-slate-500 text-xs mt-0.5">{mappable.length} properties plotted</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
          {/* Leaflet map with one marker per property */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/[0.08] relative">
            {mappable.length === 0 ? (
              <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white/[0.02]">
                <div className="text-center">
                  <MapPin size={32} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm">No properties with coordinates yet</p>
                  <p className="text-slate-600 text-xs mt-1">Add lat/lng when creating a property</p>
                </div>
              </div>
            ) : (
              <iframe
                title="Property Map"
                className="w-full h-full"
                style={{ minHeight: "400px", border: "none" }}
                srcDoc={`<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;background:#0a0e1a;}
.leaflet-popup-content-wrapper{background:#111827;color:#e2e8f0;border:1px solid rgba(255,255,255,0.1);border-radius:12px;}
.leaflet-popup-tip{background:#111827;}
.leaflet-popup-content{font-family:'DM Sans',sans-serif;font-size:12px;}
.leaflet-popup-content b{color:#00f0ff;}
.leaflet-tile-pane{filter:hue-rotate(180deg) invert(90%) brightness(0.78) contrast(1.12);}
</style>
</head><body><div id="map"></div>
<script>
var map = L.map('map',{zoomControl:true}).setView([${centerLat},${centerLng}],11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OSM'}).addTo(map);
var colors={available:'#34d399','on-hold':'#fbbf24',sold:'#fb7185',draft:'#94a3b8'};
${mappable.map((p) => {
  const color = { available: "#34d399", "on-hold": "#fbbf24", sold: "#fb7185", draft: "#94a3b8" }[p.status] || "#94a3b8";
  const title = (p.title || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
  const area  = (p.area  || "").replace(/'/g, "\\'");
  const price = p.price >= 1e7 ? `₹${(p.price/1e7).toFixed(2)} Cr` : p.price >= 1e5 ? `₹${(p.price/1e5).toFixed(2)} L` : `₹${p.price}`;
  return `L.circleMarker([${+p.lat},${+p.lng}],{radius:9,fillColor:'${color}',color:'${color}',weight:2,opacity:1,fillOpacity:0.85}).addTo(map).bindPopup('<b>${title}</b><br/>${area}<br/>${price}<br/><span style="text-transform:capitalize;color:${color}">${p.status}</span>');`;
}).join("\n")}
<\/script></body></html>`}
              />
            )}
          </div>

          {/* Sidebar: list of all mappable properties */}
          <div className="space-y-2 overflow-y-auto pr-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">All Properties</p>
            {mappable.length === 0 && (
              <GC className="p-4 text-center" hover={false}>
                <MapPin size={24} className="mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Add lat/lng to properties to plot them</p>
              </GC>
            )}
            {mappable.map((p) => (
              <GC key={p.id} className={`p-3 cursor-pointer ${selMapProp?.id === p.id ? "border-cyan-400/30" : ""}`}
                onClick={() => setSelMapProp(selMapProp?.id === p.id ? null : p)}>
                <div className="flex items-start gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0
                    ${p.status === "available" ? "bg-emerald-400" : p.status === "sold" ? "bg-rose-400" : p.status === "on-hold" ? "bg-amber-400" : "bg-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-500">{p.area} · {fmt(p.price)}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">{p.lat}, {p.lng}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelProp(p); setPage("properties"); }}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-cyan-400 flex-shrink-0">
                    <Eye size={12} />
                  </button>
                </div>
                {selMapProp?.id === p.id && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] text-slate-400 space-y-0.5">
                    <p>Size: {p.size} {p.sizeUnit}</p>
                    <p>Owner: {p.owner || "N/A"}</p>
                    <p>Status: <span className="capitalize">{p.status}</span></p>
                  </div>
                )}
              </GC>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const DocsPage = () => {
    const allDocs = props.flatMap((p) =>
      (p.documents || []).map((d) => ({ ...d, propertyTitle: p.title, propertyId: p.id }))
    ).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

    const extIcon = (name = "") => {
      const ext = (name.split(".").pop() || "").toLowerCase();
      if (["jpg","jpeg","png","webp","gif"].includes(ext)) return "🖼️";
      if (ext === "pdf") return "📄";
      if (["doc","docx"].includes(ext)) return "📝";
      return "📎";
    };

    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Documents</h1>
          <p className="text-slate-500 text-xs mt-0.5">{allDocs.length} files across {props.filter(p => (p.documents||[]).length > 0).length} properties</p>
        </div>
        {allDocs.length === 0 ? (
          <GC className="p-10 text-center" hover={false}>
            <FolderOpen size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No documents yet</p>
            <p className="text-slate-600 text-xs mt-1">Open a property → Documents tab to upload files</p>
          </GC>
        ) : (
          <div className="space-y-2">
            {allDocs.map((doc) => (
              <GC key={doc.id} className="p-3 flex items-center gap-3" hover={false}>
                <div className="w-9 h-9 rounded-xl bg-cyan-400/10 flex items-center justify-center flex-shrink-0 text-lg">
                  {extIcon(doc.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {doc.propertyTitle} · {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => { setSelProp(props.find(p => p.id === doc.propertyId)); setPage("properties"); }}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-cyan-400 transition-all">
                    <Building2 size={12} />
                  </button>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-white transition-all">
                    <Eye size={12} />
                  </a>
                </div>
              </GC>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AnalPage = () => {
    const pba = useMemo(() => {
      const areas = {};
      props.forEach((p) => {
        if (p.area) {
          if (!areas[p.area]) areas[p.area] = { area: p.area, total: 0, count: 0 };
          areas[p.area].total += +p.price || 0;
          areas[p.area].count++;
        }
      });
      return Object.values(areas).map((a) => ({ ...a, avg: a.total / a.count })).sort((a, b) => b.avg - a.avg);
    }, [props]);

    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <GC className="p-4" hover={false}>
            <h3 className="font-semibold text-xs text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Avg Price by Area</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pba.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
                <YAxis dataKey="area" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 11, color: "#e2e8f0" }} formatter={(v) => fmt(v)} />
                <Bar dataKey="avg" fill="#00f0ff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GC>
          <GC className="p-4" hover={false}>
            <h3 className="font-semibold text-xs text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Portfolio Stats</h3>
            <div className="space-y-2">
              {[
                { l: "Portfolio Value", v: fmt(st.tv) },
                { l: "Avg Price", v: fmt(st.tv / (st.a || 1)) },
                { l: "Sold Value", v: fmt(st.sv) },
                { l: "Conversion", v: `${((st.s / Math.max(st.t, 1)) * 100).toFixed(1)}%` },
                { l: "With Buyers", v: props.filter((p) => (p.buyers || []).length > 0).length + "" },
              ].map((x, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-xs text-slate-400">{x.l}</span>
                  <span className="font-bold text-white text-xs">{x.v}</span>
                </div>
              ))}
            </div>
          </GC>
        </div>
      </div>
    );
  };

  const AuditPage = () => (
    <div className="space-y-3 animate-[fadeIn_0.3s]">
      <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Audit Logs</h1>
      <p className="text-slate-500 text-xs">Live change tracking from Firebase</p>
      <GC className="p-4" hover={false}>
        <div className="space-y-2">
          {audits.length === 0 && <p className="text-xs text-slate-600 text-center py-8">Changes will appear here in real-time</p>}
          {audits.slice(0, 30).map((l) => (
            <div key={l.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-white/[0.03]">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 text-cyan-400">
                {l.action?.includes("Created") ? <Plus size={13} /> : l.action?.includes("Updated") ? <Edit size={13} /> : l.action?.includes("Deleted") ? <Trash2 size={13} /> : <Activity size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 font-medium">{l.action}</p>
                <p className="text-[10px] text-slate-500 truncate">{l.details}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-slate-600">{l.userName}</p>
                <p className="text-[9px] text-slate-700">{ago(l.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </GC>
    </div>
  );

  const UsersPage2 = () => {
    const [fbUsers, setFbUsers] = useState([]);
    useEffect(() => {
      const unsub = fbSub("users", (data) => {
        // Sort: admins first, then by lastSeen desc
        data.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (b.role === "admin" && a.role !== "admin") return 1;
          return (b.lastSeen || "").localeCompare(a.lastSeen || "");
        });
        setFbUsers(data);
      });
      return () => unsub();
    }, []);

    const gradients = [
      "from-cyan-500 to-blue-500", "from-purple-500 to-rose-500",
      "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500",
      "from-pink-500 to-fuchsia-500", "from-indigo-500 to-purple-500",
    ];

    return (
      <div className="space-y-3 animate-[fadeIn_0.3s]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Users</h1>
          <p className="text-slate-500 text-xs mt-0.5">{fbUsers.length} registered user{fbUsers.length !== 1 ? "s" : ""} · admins can edit properties</p>
        </div>

        {/* Role legend */}
        <GC className="p-3 flex flex-wrap gap-3" hover={false}>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-400/15 text-cyan-400">admin</span>
            Full access — add, edit, delete, change status
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-400/15 text-slate-400">viewer</span>
            Read-only — browse and search only
          </div>
        </GC>

        <div className="space-y-2">
          {fbUsers.length === 0 && (
            <GC className="p-10 text-center" hover={false}>
              <Users size={28} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No users yet</p>
              <p className="text-slate-600 text-xs mt-1">Users appear here after their first sign-in</p>
            </GC>
          )}
          {fbUsers.map((u, i) => (
            <GC key={u.uid || u.id} className="p-3 flex items-center gap-3" hover={false}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm
                bg-gradient-to-br ${gradients[i % gradients.length]} flex-shrink-0`}>
                {(u.displayName || u.email || "U")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-white">{u.displayName || <span className="text-slate-500 italic">No display name</span>}</p>
                  {u.uid === currentUser?.uid && (
                    <span className="text-[9px] text-slate-600 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded-md">you</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                {u.lastSeen && <p className="text-[9px] text-slate-700 mt-0.5">Last seen {ago(u.lastSeen)}</p>}
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase flex-shrink-0
                ${u.role === "admin" ? "bg-cyan-400/15 text-cyan-400 border border-cyan-400/20"
                : "bg-slate-400/15 text-slate-400 border border-slate-400/20"}`}>
                {u.role || "viewer"}
              </span>
            </GC>
          ))}
        </div>

        {isAdmin && (
          <GC className="p-4" hover={false}>
            <h3 className="font-semibold text-xs text-white mb-2 flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <Shield size={13} className="text-cyan-400" /> Promote to Admin
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              To grant admin access, add the user's email to the <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-cyan-400">ADMIN_EMAILS</code> array
              at the top of <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-cyan-400">PropertyNexus.jsx</code> and redeploy.
              The role badge updates automatically on their next sign-in.
            </p>
          </GC>
        )}
      </div>
    );
  };

  const SettPage = () => (
    <div className="space-y-3 animate-[fadeIn_0.3s]">
      <h1 className="text-xl sm:text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <GC className="p-4 space-y-3" hover={false}>
          <h3 className="font-semibold text-sm text-white flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}><Shield size={14} /> Firebase</h3>
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${fbOk ? "bg-emerald-400/5 border-emerald-400/20" : "bg-rose-400/5 border-rose-400/20"}`}>
            <div className={`w-3 h-3 rounded-full ${fbOk ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <div>
              <p className={`text-sm font-medium ${fbOk ? "text-emerald-400" : "text-rose-400"}`}>{fbOk ? "Connected" : "Disconnected"}</p>
              <p className="text-[10px] text-slate-500">property-manager · asia-southeast1</p>
            </div>
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>Properties: {props.length}</p>
            <p>Notifications: {notifs.length}</p>
            <p>Audit Logs: {audits.length}</p>
          </div>
        </GC>
        <GC className="p-4 space-y-3" hover={false}>
          <h3 className="font-semibold text-sm text-white flex items-center gap-2" style={{ fontFamily: "'Outfit', sans-serif" }}><Bell size={14} /> Notifications</h3>
          {["Price changes", "Status updates", "New properties", "Reminders"].map((n) => (
            <label key={n} className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{n}</span>
              <div className="w-9 h-5 bg-cyan-400/30 rounded-full relative">
                <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full absolute top-[3px] right-[3px]" />
              </div>
            </label>
          ))}
        </GC>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // PAGE ROUTER
  // ═══════════════════════════════════════════════════════════
  const renderPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="text-center"><Spin size={28} /><p className="text-slate-500 text-sm mt-3">Connecting to Firebase...</p></div>
        </div>
      );
    }
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "properties": return <PropsPage />;
      case "favorites": return <FavsPage />;
      case "deals": return <DealsPage />;
      case "map": return <MapPage />;
      case "documents": return <DocsPage />;
      case "analytics": return <AnalPage />;
      case "users": return <UsersPage2 />;
      case "audit": return <AuditPage />;
      case "settings": return <SettPage />;
      default: return <Dashboard />;
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // While waiting for Firebase to confirm auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={28} className="animate-spin text-cyan-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Connecting…</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!currentUser) {
    return (
      <AuthScreen
        mode={authMode} setMode={setAuthMode}
        form={authForm} setForm={setAuthForm}
        onSubmit={handleAuth} error={authError} busy={authBusy}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
        .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        select option { background: #111827; color: #e2e8f0; }
      `}</style>

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: "radial-gradient(ellipse at 20% 50%, rgba(0,240,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(52,211,153,0.03) 0%, transparent 50%)"
      }} />

      <SidebarComp />

      <div className="lg:ml-[260px]">
        <TopBar />
        <MobSrch />
        <main className="p-3 sm:p-4 md:p-6 relative z-10">
          {renderPage()}
        </main>
      </div>

      {showAdd && (
        <PropModal
          editProp={editProp}
          saving={saving}
          showT={showT}
          saveProp={saveProp}
          currentUser={currentUser}
          onClose={() => { setShowAdd(false); setEditProp(null); }}
        />
      )}
      {showNotif && <div className="fixed inset-0 z-20" onClick={() => setShowNotif(false)} />}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border
          backdrop-blur-2xl shadow-2xl animate-[slideUp_0.3s]
          ${toast.t === "success" ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
          : toast.t === "error" ? "bg-rose-500/15 border-rose-400/30 text-rose-300"
          : "bg-cyan-500/15 border-cyan-400/30 text-cyan-300"}`}>
          {toast.t === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span className="text-sm font-medium">{toast.m}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
