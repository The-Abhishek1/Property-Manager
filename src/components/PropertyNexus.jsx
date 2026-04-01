import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Plus, Home, BarChart3, Map, Heart, Bell, Settings, ChevronLeft, ChevronRight, Filter, X, Edit, Trash2, Eye, Star, MapPin, Phone, User, Calendar, DollarSign, TrendingUp, Building2, Landmark, TreePine, FileText, Tag, ArrowUpRight, ArrowDownRight, MoreHorizontal, CheckCircle, Clock, AlertCircle, Layers, Download, ChevronDown, Menu, LogOut, Shield, Activity, Bookmark, MessageSquare, Upload, Grid, List, SlidersHorizontal, Copy, ExternalLink, IndianRupee, SquareStack, Compass, Maximize2, LayoutDashboard, FolderOpen, Users, BellRing, ScrollText, Lock, Zap, Sparkles, CircleDot } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

// ── Helpers ──
const generateId = () => "p_" + Math.random().toString(36).substr(2, 9);
const formatCurrency = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ── Sample Data ──
const SAMPLE_PROPERTIES = [
  { id:"prop_001", title:"2 Acre Premium Farm Land", type:"land", category:"agricultural", description:"Beautiful 2 acre farm land with fertile soil, water supply, and road access. Ideal for organic farming or weekend retreat. Located near upcoming Bangalore-Chennai expressway.", price:4500000, previousPrice:4000000, pricePerUnit:55, priceUnit:"sqft", size:2, sizeUnit:"acres", status:"available", owner:"Rajesh Kumar", ownerContact:"+91 98765 43210", country:"India", state:"Karnataka", city:"Bangalore", area:"Devanahalli", pincode:"562110", lat:13.2468, lng:77.7120, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800","https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800","https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800"], coverImage:0, tags:["investment","prime-location","near-highway"], facing:"east", nearHighway:true, cornerSite:false, approved:true, notes:[{id:"n1",text:"Owner ready to negotiate on price",createdAt:"2025-03-15T10:30:00Z",author:"Admin"}], buyers:[{id:"b1",name:"Suresh Patel",contact:"+91 87654 32109",notes:"Interested, visiting next week",addedAt:"2025-03-20T14:00:00Z"}], negotiationNotes:"Owner asking 45L, market rate is 40L.", views:234, isFavorite:true, createdAt:"2025-01-15T08:00:00Z", updatedAt:"2025-03-25T16:00:00Z" },
  { id:"prop_002", title:"30x40 Corner Site - Yelahanka", type:"plot", category:"residential", description:"BDA approved 30x40 corner site in a premium gated layout with all amenities. Clear title, ready for construction.", price:7200000, pricePerUnit:6000, priceUnit:"sqft", size:1200, sizeUnit:"sqft", status:"available", owner:"Meena Sharma", ownerContact:"+91 99887 76655", country:"India", state:"Karnataka", city:"Bangalore", area:"Yelahanka", pincode:"560064", lat:13.1007, lng:77.5963, images:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800","https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800"], coverImage:0, tags:["corner-site","approved","prime-location"], facing:"north", nearHighway:false, cornerSite:true, approved:true, notes:[], buyers:[], negotiationNotes:"", views:567, isFavorite:false, createdAt:"2025-02-01T09:00:00Z", updatedAt:"2025-03-20T12:00:00Z" },
  { id:"prop_003", title:"3BHK Villa - Whitefield", type:"house", category:"residential", description:"Luxurious 3BHK independent villa with garden, car parking, and modern interiors in a gated community near ITPL.", price:18500000, previousPrice:17000000, pricePerUnit:8500, priceUnit:"sqft", size:2200, sizeUnit:"sqft", status:"on-hold", owner:"Anand Verma", ownerContact:"+91 77665 54433", country:"India", state:"Karnataka", city:"Bangalore", area:"Whitefield", pincode:"560066", lat:12.9698, lng:77.7500, images:["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"], coverImage:0, tags:["luxury","gated-community"], facing:"west", nearHighway:false, cornerSite:false, approved:true, notes:[{id:"n2",text:"Buyer finalizing loan approval",createdAt:"2025-03-22T11:00:00Z",author:"Admin"}], buyers:[{id:"b2",name:"Vikram Singh",contact:"+91 88990 01122",notes:"Loan approved, registration pending",addedAt:"2025-03-10T09:00:00Z"}], negotiationNotes:"Deal almost closed at 1.85Cr", views:892, isFavorite:true, createdAt:"2025-01-20T10:00:00Z", updatedAt:"2025-03-22T11:00:00Z" },
  { id:"prop_004", title:"Commercial Space - MG Road", type:"commercial", category:"commercial", description:"Prime commercial space on MG Road. Suitable for retail, office, or showroom. High footfall area with metro connectivity.", price:35000000, pricePerUnit:18000, priceUnit:"sqft", size:1950, sizeUnit:"sqft", status:"available", owner:"Prakash Industries", ownerContact:"+91 66554 43322", country:"India", state:"Karnataka", city:"Bangalore", area:"MG Road", pincode:"560001", lat:12.9756, lng:77.6068, images:["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800","https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"], coverImage:0, tags:["prime-location","investment","high-roi"], nearHighway:false, cornerSite:true, approved:true, notes:[], buyers:[], negotiationNotes:"", views:1203, isFavorite:false, createdAt:"2025-02-15T08:00:00Z", updatedAt:"2025-03-18T15:00:00Z" },
  { id:"prop_005", title:"5 Acre Agricultural Land", type:"land", category:"agricultural", description:"Spacious 5 acre agricultural land on Mysore Road with borewell and electricity. Perfect for farming or future development.", price:8000000, previousPrice:7500000, pricePerUnit:37, priceUnit:"sqft", size:5, sizeUnit:"acres", status:"sold", owner:"Ravi Gowda", ownerContact:"+91 55443 32211", country:"India", state:"Karnataka", city:"Bangalore", area:"Mysore Road", pincode:"562130", lat:12.8500, lng:77.4000, images:["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"], coverImage:0, tags:["investment"], nearHighway:true, cornerSite:false, approved:true, notes:[], buyers:[], finalSellingPrice:7800000, soldDate:"2025-03-01", negotiationNotes:"Sold at 78L", views:456, isFavorite:false, createdAt:"2024-12-01T08:00:00Z", updatedAt:"2025-03-01T10:00:00Z" },
  { id:"prop_006", title:"40x60 Plot - Electronic City", type:"plot", category:"residential", description:"BMRDA approved 40x60 plot near Electronic City Phase 2. Close to IT parks, metro station, and schools.", price:5400000, pricePerUnit:2250, priceUnit:"sqft", size:2400, sizeUnit:"sqft", status:"available", owner:"Sunita Reddy", ownerContact:"+91 44332 21100", country:"India", state:"Karnataka", city:"Bangalore", area:"Electronic City", pincode:"560100", lat:12.8440, lng:77.6593, images:["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800"], coverImage:0, tags:["approved","near-it-park"], facing:"south", nearHighway:true, cornerSite:false, approved:true, notes:[], buyers:[], negotiationNotes:"", views:345, isFavorite:false, createdAt:"2025-03-01T08:00:00Z", updatedAt:"2025-03-25T10:00:00Z" },
  { id:"prop_007", title:"Penthouse - Indiranagar", type:"house", category:"residential", description:"Ultra-luxury 4BHK penthouse with rooftop pool, 360-degree city views, smart home automation, and premium finishes.", price:45000000, pricePerUnit:22000, priceUnit:"sqft", size:2050, sizeUnit:"sqft", status:"available", owner:"Kiran Desai", ownerContact:"+91 99001 22334", country:"India", state:"Karnataka", city:"Bangalore", area:"Indiranagar", pincode:"560038", lat:12.9784, lng:77.6408, images:["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"], coverImage:0, tags:["luxury","prime-location","investment"], facing:"east", nearHighway:false, cornerSite:false, approved:true, notes:[{id:"n3",text:"Premium property - handle with care",createdAt:"2025-03-20T09:00:00Z",author:"Admin"}], buyers:[], negotiationNotes:"", views:1876, isFavorite:true, createdAt:"2025-03-10T08:00:00Z", updatedAt:"2025-03-28T14:00:00Z" },
  { id:"prop_008", title:"Warehouse - Peenya Industrial", type:"commercial", category:"commercial", description:"10,000 sqft warehouse space in Peenya Industrial Area with loading docks, 3-phase power, and 24/7 security.", price:12000000, pricePerUnit:1200, priceUnit:"sqft", size:10000, sizeUnit:"sqft", status:"draft", owner:"Industrial Props Ltd", ownerContact:"+91 88776 65544", country:"India", state:"Karnataka", city:"Bangalore", area:"Peenya", pincode:"560058", lat:13.0325, lng:77.5177, images:["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800"], coverImage:0, tags:["commercial","industrial"], nearHighway:true, cornerSite:false, approved:false, notes:[], buyers:[], negotiationNotes:"", views:89, isFavorite:false, createdAt:"2025-03-25T08:00:00Z", updatedAt:"2025-03-25T08:00:00Z" },
];

const SAMPLE_NOTIFICATIONS = [
  { id:"notif_1", type:"price_change", message:'Price updated for "3BHK Villa - Whitefield"', propertyId:"prop_003", read:false, createdAt:"2025-03-25T10:00:00Z" },
  { id:"notif_2", type:"status_change", message:'"5 Acre Agricultural Land" marked as Sold', propertyId:"prop_005", read:false, createdAt:"2025-03-01T10:00:00Z" },
  { id:"notif_3", type:"new_property", message:'New property: "40x60 Plot - Electronic City"', propertyId:"prop_006", read:true, createdAt:"2025-03-01T08:00:00Z" },
  { id:"notif_4", type:"reminder", message:'"2 Acre Premium Farm Land" unsold 60+ days', propertyId:"prop_001", read:true, createdAt:"2025-03-15T08:00:00Z" },
];

const SALES_DATA = [
  { month:"Oct", sales:2, value:12 }, { month:"Nov", sales:3, value:18 },
  { month:"Dec", sales:1, value:8 }, { month:"Jan", sales:4, value:25 },
  { month:"Feb", sales:2, value:15 }, { month:"Mar", sales:3, value:22 },
];

const TAG_OPTIONS = ["investment","prime-location","near-highway","corner-site","approved","luxury","urgent-sale","gated-community","near-it-park","high-roi","industrial","commercial"];

// ── Glass Components ──
const GlassCard = ({ children, className = "", onClick, hover = true }) => (
  <div onClick={onClick} className={`relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl ${hover ? "transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]" : ""} ${onClick ? "cursor-pointer" : ""} ${className}`}>
    {children}
  </div>
);

const GlassInput = ({ className = "", ...props }) => (
  <input {...props} className={`w-full bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 focus:bg-white/[0.08] transition-all ${className}`} />
);

const GlassSelect = ({ className = "", children, ...props }) => (
  <select {...props} className={`w-full bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 transition-all appearance-none ${className}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
    {children}
  </select>
);

const GlassTextarea = ({ className = "", ...props }) => (
  <textarea {...props} className={`w-full bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 focus:bg-white/[0.08] transition-all resize-none ${className}`} />
);

const StatusBadge = ({ status }) => {
  const styles = { available: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30", sold: "bg-rose-400/15 text-rose-400 border-rose-400/30", "on-hold": "bg-amber-400/15 text-amber-400 border-amber-400/30", draft: "bg-slate-400/15 text-slate-400 border-slate-400/30" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider border ${styles[status] || styles.draft}`}>{status}</span>;
};

const TypeIcon = ({ type, size = 16 }) => {
  const icons = { land: TreePine, plot: Layers, house: Home, commercial: Building2 };
  const Icon = icons[type] || Landmark;
  return <Icon size={size} />;
};

// ── Main App ──
export default function PropertyNexus() {
  const [properties, setProperties] = useState(SAMPLE_PROPERTIES);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ type: "", category: "", status: "", minPrice: "", maxPrice: "", area: "", nearHighway: "", cornerSite: "", facing: "", approved: "", favoritesOnly: false });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.area.toLowerCase().includes(searchQuery.toLowerCase()) && !p.id.toLowerCase().includes(searchQuery.toLowerCase()) && !p.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
      if (filters.area && !p.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
      if (filters.nearHighway === "true" && !p.nearHighway) return false;
      if (filters.cornerSite === "true" && !p.cornerSite) return false;
      if (filters.facing && p.facing !== filters.facing) return false;
      if (filters.approved === "true" && !p.approved) return false;
      if (filters.favoritesOnly && !p.isFavorite) return false;
      return true;
    });
  }, [properties, searchQuery, filters]);

  // Stats
  const stats = useMemo(() => {
    const total = properties.length;
    const available = properties.filter(p => p.status === "available").length;
    const sold = properties.filter(p => p.status === "sold").length;
    const onHold = properties.filter(p => p.status === "on-hold").length;
    const totalValue = properties.filter(p => p.status !== "sold").reduce((s, p) => s + p.price, 0);
    const totalSoldValue = properties.filter(p => p.status === "sold").reduce((s, p) => s + (p.finalSellingPrice || p.price), 0);
    const mostViewed = [...properties].sort((a, b) => b.views - a.views).slice(0, 5);
    return { total, available, sold, onHold, totalValue, totalSoldValue, mostViewed };
  }, [properties]);

  const toggleFavorite = (id) => setProperties(ps => ps.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));

  const deleteProperty = (id) => {
    if (confirm("Are you sure you want to delete this property?")) {
      setProperties(ps => ps.filter(p => p.id !== id));
      if (selectedProperty?.id === id) setSelectedProperty(null);
    }
  };

  const updatePropertyStatus = (id, status) => {
    setProperties(ps => ps.map(p => p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p));
    const prop = properties.find(p => p.id === id);
    setNotifications(ns => [{ id: generateId(), type: "status_change", message: `"${prop?.title}" → ${status}`, read: false, createdAt: new Date().toISOString() }, ...ns]);
  };

  const saveProperty = (data) => {
    if (editingProperty) {
      setProperties(ps => ps.map(p => p.id === editingProperty.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
    } else {
      const newProp = { ...data, id: generateId(), images: ["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800"], coverImage: 0, notes: [], buyers: [], views: 0, isFavorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setProperties(ps => [newProp, ...ps]);
      setNotifications(ns => [{ id: generateId(), type: "new_property", message: `New property: "${data.title}"`, read: false, createdAt: new Date().toISOString() }, ...ns]);
    }
    setShowAddModal(false);
    setEditingProperty(null);
  };

  // ── Sidebar ──
  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "properties", icon: Building2, label: "Properties" },
    { id: "favorites", icon: Heart, label: "Favorites" },
    { id: "deals", icon: IndianRupee, label: "Deals" },
    { id: "map", icon: Map, label: "Map View" },
    { id: "documents", icon: FolderOpen, label: "Documents" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
    { id: "users", icon: Users, label: "Users" },
    { id: "audit", icon: ScrollText, label: "Audit Logs" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  const Sidebar = () => (
    <div className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${sidebarCollapsed ? "w-[72px]" : "w-[260px]"} bg-[#0c1121]/90 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col`}>
      <div className="p-4 flex items-center gap-3 border-b border-white/[0.06] h-16">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Landmark size={18} className="text-slate-900" />
        </div>
        {!sidebarCollapsed && <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">PropertyNexus</span>}
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActivePage(item.id); setSelectedProperty(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${activePage === item.id ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"}`}>
            <item.icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/[0.06]">
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all text-sm">
          {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  // ── Top Bar ──
  const TopBar = () => (
    <div className="h-16 bg-[#0c1121]/60 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="lg:hidden text-slate-400 hover:text-white"><Menu size={20} /></button>
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <GlassInput placeholder="Search properties, areas, IDs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 !py-2" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => { setShowAddModal(true); setEditingProperty(null); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold hover:shadow-[0_8px_30px_-8px_rgba(0,240,255,0.4)] transition-all hover:-translate-y-0.5">
          <Plus size={16} /> <span className="hidden sm:inline">Add Property</span>
        </button>
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-[#111827]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm">Notifications</h3>
                <button onClick={() => setNotifications(ns => ns.map(n => ({ ...n, read: true })))} className="text-xs text-cyan-400 hover:text-cyan-300">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 8).map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.04] transition-all ${!n.read ? "bg-cyan-400/[0.03]" : ""}`}>
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />}
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">A</div>
      </div>
    </div>
  );

  // ── Dashboard ──
  const Dashboard = () => (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your property portfolio</p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: stats.total, icon: Building2, color: "cyan", sub: `${stats.available} available` },
          { label: "Available", value: stats.available, icon: CheckCircle, color: "emerald", sub: formatCurrency(stats.totalValue) },
          { label: "Sold", value: stats.sold, icon: TrendingUp, color: "rose", sub: formatCurrency(stats.totalSoldValue) },
          { label: "On Hold", value: stats.onHold, icon: Clock, color: "amber", sub: `${properties.filter(p => p.status === "draft").length} drafts` },
        ].map((s, i) => (
          <GlassCard key={i} className="p-5" hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-display font-bold text-white mt-2">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color === "cyan" ? "bg-cyan-400/10 text-cyan-400" : s.color === "emerald" ? "bg-emerald-400/10 text-emerald-400" : s.color === "rose" ? "bg-rose-400/10 text-rose-400" : "bg-amber-400/10 text-amber-400"}`}>
                <s.icon size={20} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5 lg:col-span-2" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white mb-4">Sales Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SALES_DATA}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              <Area type="monotone" dataKey="sales" stroke="#a855f7" strokeWidth={2} fillOpacity={0.1} fill="#a855f7" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
        <GlassCard className="p-5" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white mb-4">By Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={[
                { name: "Land", value: properties.filter(p => p.type === "land").length },
                { name: "Plot", value: properties.filter(p => p.type === "plot").length },
                { name: "House", value: properties.filter(p => p.type === "house").length },
                { name: "Commercial", value: properties.filter(p => p.type === "commercial").length },
              ]} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                {["#00f0ff", "#a855f7", "#34d399", "#fbbf24"].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {[{ l: "Land", c: "#00f0ff" }, { l: "Plot", c: "#a855f7" }, { l: "House", c: "#34d399" }, { l: "Comm.", c: "#fbbf24" }].map(i => (
              <div key={i.l} className="flex items-center gap-1.5 text-[11px] text-slate-400"><div className="w-2 h-2 rounded-full" style={{ background: i.c }} />{i.l}</div>
            ))}
          </div>
        </GlassCard>
      </div>
      {/* Most Viewed + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white mb-4">Most Viewed</h3>
          <div className="space-y-3">
            {stats.mostViewed.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer" onClick={() => { setSelectedProperty(p); setActivePage("properties"); }}>
                <span className="text-xs font-mono text-slate-600 w-5">#{i + 1}</span>
                <div className="w-10 h-10 rounded-lg bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium truncate">{p.title}</p>
                  <p className="text-[11px] text-slate-500">{p.area} · {formatCurrency(p.price)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500"><Eye size={12} />{p.views}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-5" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="flex items-start gap-3 p-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === "price_change" ? "bg-amber-400/10 text-amber-400" : n.type === "status_change" ? "bg-emerald-400/10 text-emerald-400" : n.type === "new_property" ? "bg-cyan-400/10 text-cyan-400" : "bg-purple-400/10 text-purple-400"}`}>
                  {n.type === "price_change" ? <TrendingUp size={14} /> : n.type === "status_change" ? <CheckCircle size={14} /> : n.type === "new_property" ? <Plus size={14} /> : <Bell size={14} />}
                </div>
                <div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );

  // ── Property Card ──
  const PropertyCard = ({ property: p }) => (
    <GlassCard className="overflow-hidden group" onClick={() => setSelectedProperty(p)}>
      <div className="relative h-44 bg-cover bg-center" style={{ backgroundImage: `url(${p.images[p.coverImage || 0]})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={p.status} />
          {p.cornerSite && <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-400/20 text-purple-300 border border-purple-400/30">CORNER</span>}
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }} className={`w-8 h-8 rounded-lg backdrop-blur-sm flex items-center justify-center transition-all ${p.isFavorite ? "bg-rose-500/30 text-rose-400" : "bg-black/30 text-white/60 hover:text-white"}`}>
            <Heart size={14} fill={p.isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display font-bold text-white text-base leading-tight drop-shadow-lg">{p.title}</p>
          <div className="flex items-center gap-1 mt-1 text-slate-300 text-xs"><MapPin size={11} />{p.area}, {p.city}</div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-display font-bold text-cyan-400">{formatCurrency(p.price)}</p>
            {p.previousPrice && <p className="text-[11px] text-slate-500 line-through">{formatCurrency(p.previousPrice)}</p>}
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] text-xs text-slate-400">
            <TypeIcon type={p.type} size={12} />
            <span className="capitalize">{p.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span>{p.size} {p.sizeUnit}</span>
          <span>₹{p.pricePerUnit}/{p.priceUnit}</span>
          {p.facing && <span className="flex items-center gap-1"><Compass size={11} />{p.facing}</span>}
        </div>
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {p.tags.slice(0, 3).map(t => <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] text-slate-400 border border-white/[0.06]">{t}</span>)}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 text-[11px] text-slate-500"><Eye size={11} />{p.views} views</div>
          <div className="flex gap-1">
            <button onClick={e => { e.stopPropagation(); setEditingProperty(p); setShowAddModal(true); }} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-white transition-all"><Edit size={13} /></button>
            <button onClick={e => { e.stopPropagation(); deleteProperty(p.id); }} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  // ── Property List Item ──
  const PropertyListItem = ({ property: p }) => (
    <GlassCard className="p-4 flex items-center gap-4 group" onClick={() => setSelectedProperty(p)}>
      <div className="w-20 h-16 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(${p.images[0]})` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold text-white text-sm truncate">{p.title}</p>
          <StatusBadge status={p.status} />
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={11} />{p.area}</span>
          <span>{p.size} {p.sizeUnit}</span>
          <span className="capitalize flex items-center gap-1"><TypeIcon type={p.type} size={11} />{p.type}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-display font-bold text-cyan-400">{formatCurrency(p.price)}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{p.id}</p>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }} className={`p-1.5 rounded-lg ${p.isFavorite ? "text-rose-400" : "text-slate-500 hover:text-white"}`}><Heart size={14} fill={p.isFavorite ? "currentColor" : "none"} /></button>
        <button onClick={e => { e.stopPropagation(); setEditingProperty(p); setShowAddModal(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-white"><Edit size={14} /></button>
        <button onClick={e => { e.stopPropagation(); deleteProperty(p.id); }} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
      </div>
    </GlassCard>
  );

  // ── Property Detail ──
  const PropertyDetail = ({ property: p }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [activeImg, setActiveImg] = useState(0);
    const [newNote, setNewNote] = useState("");
    const [newBuyer, setNewBuyer] = useState({ name: "", contact: "", notes: "" });

    const addNote = () => {
      if (!newNote.trim()) return;
      const updated = { ...p, notes: [...p.notes, { id: generateId(), text: newNote, createdAt: new Date().toISOString(), author: "Admin" }] };
      setProperties(ps => ps.map(x => x.id === p.id ? updated : x));
      setSelectedProperty(updated);
      setNewNote("");
    };

    const addBuyer = () => {
      if (!newBuyer.name.trim()) return;
      const updated = { ...p, buyers: [...p.buyers, { id: generateId(), ...newBuyer, addedAt: new Date().toISOString() }] };
      setProperties(ps => ps.map(x => x.id === p.id ? updated : x));
      setSelectedProperty(updated);
      setNewBuyer({ name: "", contact: "", notes: "" });
    };

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <button onClick={() => setSelectedProperty(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all"><ChevronLeft size={16} /> Back to properties</button>

        {/* Image Gallery */}
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="relative h-64 sm:h-80 bg-cover bg-center" style={{ backgroundImage: `url(${p.images[activeImg]})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2"><StatusBadge status={p.status} /></div>
            <button onClick={() => toggleFavorite(p.id)} className={`absolute top-4 right-4 w-10 h-10 rounded-xl backdrop-blur-sm flex items-center justify-center ${p.isFavorite ? "bg-rose-500/30 text-rose-400" : "bg-black/40 text-white/70 hover:text-white"}`}>
              <Heart size={18} fill={p.isFavorite ? "currentColor" : "none"} />
            </button>
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="font-display text-2xl font-bold text-white">{p.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-slate-300 text-sm"><MapPin size={14} />{p.area}, {p.city}, {p.state}</div>
            </div>
          </div>
          {p.images.length > 1 && (
            <div className="flex gap-2 p-3">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-12 rounded-lg bg-cover bg-center border-2 transition-all ${i === activeImg ? "border-cyan-400" : "border-transparent opacity-60 hover:opacity-100"}`} style={{ backgroundImage: `url(${img})` }} />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Price", value: formatCurrency(p.price), icon: IndianRupee, color: "text-cyan-400" },
            { label: "Size", value: `${p.size} ${p.sizeUnit}`, icon: Maximize2, color: "text-purple-400" },
            { label: "Type", value: p.type, icon: Building2, color: "text-emerald-400" },
            { label: "ID", value: p.id, icon: Tag, color: "text-amber-400" },
          ].map((item, i) => (
            <GlassCard key={i} className="p-3 flex items-center gap-3" hover={false}>
              <div className={`w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center ${item.color}`}><item.icon size={16} /></div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className={`text-sm font-semibold capitalize ${item.color}`}>{item.value}</p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          {["overview", "notes", "buyers", "documents"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all ${activeTab === tab ? "bg-white/[0.08] text-white border border-white/[0.1]" : "text-slate-500 hover:text-slate-300"}`}>{tab}</button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard className="p-5 space-y-4" hover={false}>
              <h3 className="font-display font-semibold text-white text-sm">Description</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{p.description}</p>
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</h4>
                {[
                  { l: "Price per unit", v: `₹${p.pricePerUnit}/${p.priceUnit}` },
                  { l: "Category", v: p.category },
                  { l: "Facing", v: p.facing || "N/A" },
                  { l: "Near Highway", v: p.nearHighway ? "Yes" : "No" },
                  { l: "Corner Site", v: p.cornerSite ? "Yes" : "No" },
                  { l: "Approved", v: p.approved ? "Yes" : "No" },
                ].map(d => (
                  <div key={d.l} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{d.l}</span>
                    <span className="text-slate-200 font-medium capitalize">{d.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {p.tags.map(t => <span key={t} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">{t}</span>)}
              </div>
            </GlassCard>
            <div className="space-y-4">
              <GlassCard className="p-5" hover={false}>
                <h3 className="font-display font-semibold text-white text-sm mb-3">Owner Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3"><User size={14} className="text-slate-500" /><span className="text-sm text-slate-300">{p.owner}</span></div>
                  <div className="flex items-center gap-3"><Phone size={14} className="text-slate-500" /><span className="text-sm text-slate-300">{p.ownerContact}</span></div>
                  <div className="flex items-center gap-3"><MapPin size={14} className="text-slate-500" /><span className="text-sm text-slate-300">{p.pincode}</span></div>
                </div>
              </GlassCard>
              {p.previousPrice && (
                <GlassCard className="p-5" hover={false}>
                  <h3 className="font-display font-semibold text-white text-sm mb-3">Price History</h3>
                  <div className="flex items-center gap-4">
                    <div><p className="text-[10px] text-slate-500">Previous</p><p className="text-sm text-slate-400 line-through">{formatCurrency(p.previousPrice)}</p></div>
                    <ArrowUpRight size={16} className="text-emerald-400" />
                    <div><p className="text-[10px] text-slate-500">Current</p><p className="text-sm font-semibold text-emerald-400">{formatCurrency(p.price)}</p></div>
                    <div className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-semibold">+{((p.price - p.previousPrice) / p.previousPrice * 100).toFixed(1)}%</div>
                  </div>
                </GlassCard>
              )}
              <GlassCard className="p-5" hover={false}>
                <h3 className="font-display font-semibold text-white text-sm mb-3">Status</h3>
                <div className="flex gap-2">
                  {["available", "on-hold", "sold", "draft"].map(s => (
                    <button key={s} onClick={() => updatePropertyStatus(p.id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${p.status === s ? "bg-cyan-400/15 text-cyan-400 border-cyan-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06] hover:bg-white/[0.08]"}`}>{s}</button>
                  ))}
                </div>
              </GlassCard>
              {p.negotiationNotes && (
                <GlassCard className="p-5" hover={false}>
                  <h3 className="font-display font-semibold text-white text-sm mb-2">Negotiation Notes</h3>
                  <p className="text-sm text-slate-400">{p.negotiationNotes}</p>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <GlassCard className="p-5 space-y-4" hover={false}>
            <h3 className="font-display font-semibold text-white text-sm">Internal Notes</h3>
            <div className="flex gap-2">
              <GlassInput placeholder="Add a private note..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()} />
              <button onClick={addNote} className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold flex-shrink-0">Add</button>
            </div>
            <div className="space-y-2">
              {p.notes.length === 0 && <p className="text-sm text-slate-600 py-4 text-center">No notes yet</p>}
              {p.notes.map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-sm text-slate-300">{n.text}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
                    <span>{n.author}</span><span>·</span><span>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {activeTab === "buyers" && (
          <GlassCard className="p-5 space-y-4" hover={false}>
            <h3 className="font-display font-semibold text-white text-sm">Interested Buyers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <GlassInput placeholder="Buyer name" value={newBuyer.name} onChange={e => setNewBuyer({ ...newBuyer, name: e.target.value })} />
              <GlassInput placeholder="Contact" value={newBuyer.contact} onChange={e => setNewBuyer({ ...newBuyer, contact: e.target.value })} />
              <div className="flex gap-2">
                <GlassInput placeholder="Notes" value={newBuyer.notes} onChange={e => setNewBuyer({ ...newBuyer, notes: e.target.value })} />
                <button onClick={addBuyer} className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold flex-shrink-0">Add</button>
              </div>
            </div>
            <div className="space-y-2">
              {p.buyers.length === 0 && <p className="text-sm text-slate-600 py-4 text-center">No buyers tracked yet</p>}
              {p.buyers.map(b => (
                <div key={b.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center text-purple-400"><User size={16} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.contact} · {b.notes}</p>
                  </div>
                  <p className="text-[11px] text-slate-600">{timeAgo(b.addedAt)}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {activeTab === "documents" && (
          <GlassCard className="p-5 space-y-4" hover={false}>
            <h3 className="font-display font-semibold text-white text-sm">Documents</h3>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-cyan-400/30 transition-all cursor-pointer">
              <Upload size={28} className="mx-auto text-slate-500 mb-2" />
              <p className="text-sm text-slate-400">Drag & drop files or click to upload</p>
              <p className="text-xs text-slate-600 mt-1">Sale agreements, tax docs, legal papers</p>
            </div>
            <p className="text-sm text-slate-600 text-center py-2">No documents attached yet</p>
          </GlassCard>
        )}
      </div>
    );
  };

  // ── Add/Edit Property Modal ──
  const PropertyModal = () => {
    const [form, setForm] = useState(editingProperty || {
      title: "", type: "plot", category: "residential", description: "", price: "", pricePerUnit: "", priceUnit: "sqft", size: "", sizeUnit: "sqft", status: "draft", owner: "", ownerContact: "", country: "India", state: "Karnataka", city: "Bangalore", area: "", pincode: "", tags: [], facing: "", nearHighway: false, cornerSite: false, approved: false, negotiationNotes: "",
    });
    const [selectedTags, setSelectedTags] = useState(form.tags || []);

    const toggleTag = (tag) => {
      setSelectedTags(ts => ts.includes(tag) ? ts.filter(t => t !== tag) : [...ts, tag]);
    };

    const handleSubmit = () => {
      if (!form.title || !form.price) return;
      saveProperty({ ...form, price: Number(form.price), pricePerUnit: Number(form.pricePerUnit) || 0, size: Number(form.size) || 0, tags: selectedTags });
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setEditingProperty(null); }}>
        <div className="w-full max-w-2xl max-h-[85vh] bg-[#111827]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white">{editingProperty ? "Edit Property" : "Add New Property"}</h2>
            <button onClick={() => { setShowAddModal(false); setEditingProperty(null); }} className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white"><X size={18} /></button>
          </div>
          <div className="p-5 overflow-y-auto max-h-[calc(85vh-130px)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Title *</label><GlassInput placeholder="e.g. 2 Acre Farm Land" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Property Type</label>
                <GlassSelect value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="land">Land</option><option value="plot">Plot</option><option value="house">House</option><option value="commercial">Commercial</option>
                </GlassSelect></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                <GlassSelect value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="agricultural">Agricultural</option>
                </GlassSelect></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Status</label>
                <GlassSelect value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option><option value="available">Available</option><option value="on-hold">On Hold</option><option value="sold">Sold</option>
                </GlassSelect></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Price (₹) *</label><GlassInput type="number" placeholder="4500000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Price Per Unit</label><GlassInput type="number" placeholder="55" value={form.pricePerUnit} onChange={e => setForm({ ...form, pricePerUnit: e.target.value })} /></div>
                <div className="w-24"><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Unit</label>
                  <GlassSelect value={form.priceUnit} onChange={e => setForm({ ...form, priceUnit: e.target.value })}>
                    <option value="sqft">sqft</option><option value="acre">acre</option><option value="gunta">gunta</option>
                  </GlassSelect></div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Size</label><GlassInput type="number" placeholder="2" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} /></div>
                <div className="w-24"><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Unit</label>
                  <GlassSelect value={form.sizeUnit} onChange={e => setForm({ ...form, sizeUnit: e.target.value })}>
                    <option value="sqft">sqft</option><option value="acres">acres</option><option value="guntas">guntas</option>
                  </GlassSelect></div>
              </div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Facing</label>
                <GlassSelect value={form.facing || ""} onChange={e => setForm({ ...form, facing: e.target.value })}>
                  <option value="">Select</option><option value="east">East</option><option value="west">West</option><option value="north">North</option><option value="south">South</option>
                </GlassSelect></div>
            </div>
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Description</label><GlassTextarea rows={3} placeholder="Describe the property..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Area</label><GlassInput placeholder="Devanahalli" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">City</label><GlassInput placeholder="Bangalore" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">State</label><GlassInput placeholder="Karnataka" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Pincode</label><GlassInput placeholder="562110" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Owner Name</label><GlassInput placeholder="Owner name" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></div>
              <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Contact</label><GlassInput placeholder="+91 98765 43210" value={form.ownerContact} onChange={e => setForm({ ...form, ownerContact: e.target.value })} /></div>
            </div>
            <div className="flex gap-6">
              {[
                { key: "nearHighway", label: "Near Highway" },
                { key: "cornerSite", label: "Corner Site" },
                { key: "approved", label: "Approved" },
              ].map(c => (
                <label key={c.key} className="flex items-center gap-2 cursor-pointer text-sm text-slate-400">
                  <input type="checkbox" checked={form[c.key]} onChange={e => setForm({ ...form, [c.key]: e.target.checked })} className="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-400 focus:ring-cyan-400/30" />
                  {c.label}
                </label>
              ))}
            </div>
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(t => (
                  <button key={t} onClick={() => toggleTag(t)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${selectedTags.includes(t) ? "bg-cyan-400/15 text-cyan-400 border-cyan-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06] hover:bg-white/[0.08]"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Negotiation Notes</label><GlassTextarea rows={2} placeholder="Internal negotiation notes..." value={form.negotiationNotes} onChange={e => setForm({ ...form, negotiationNotes: e.target.value })} /></div>
          </div>
          <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
            <button onClick={() => { setShowAddModal(false); setEditingProperty(null); }} className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold hover:shadow-[0_8px_30px_-8px_rgba(0,240,255,0.4)] transition-all">{editingProperty ? "Save Changes" : "Add Property"}</button>
          </div>
        </div>
      </div>
    );
  };

  // ── Filter Panel ──
  const FilterPanel = () => (
    <GlassCard className="p-4 space-y-3" hover={false}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><SlidersHorizontal size={14} /> Filters</h3>
        <button onClick={() => setFilters({ type:"", category:"", status:"", minPrice:"", maxPrice:"", area:"", nearHighway:"", cornerSite:"", facing:"", approved:"", favoritesOnly:false })} className="text-[11px] text-cyan-400 hover:text-cyan-300">Reset</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <GlassSelect value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
          <option value="">All Types</option><option value="land">Land</option><option value="plot">Plot</option><option value="house">House</option><option value="commercial">Commercial</option>
        </GlassSelect>
        <GlassSelect value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
          <option value="">All Categories</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="agricultural">Agricultural</option>
        </GlassSelect>
        <GlassSelect value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option><option value="available">Available</option><option value="on-hold">On Hold</option><option value="sold">Sold</option><option value="draft">Draft</option>
        </GlassSelect>
        <GlassInput placeholder="Min price" type="number" value={filters.minPrice} onChange={e => setFilters({...filters, minPrice: e.target.value})} />
        <GlassInput placeholder="Max price" type="number" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} />
        <GlassInput placeholder="Area/Locality" value={filters.area} onChange={e => setFilters({...filters, area: e.target.value})} />
      </div>
      <div className="flex flex-wrap gap-2">
        <GlassSelect className="!w-auto" value={filters.facing} onChange={e => setFilters({...filters, facing: e.target.value})}>
          <option value="">Facing</option><option value="east">East</option><option value="west">West</option><option value="north">North</option><option value="south">South</option>
        </GlassSelect>
        <GlassSelect className="!w-auto" value={filters.nearHighway} onChange={e => setFilters({...filters, nearHighway: e.target.value})}>
          <option value="">Highway</option><option value="true">Near Highway</option>
        </GlassSelect>
        <GlassSelect className="!w-auto" value={filters.cornerSite} onChange={e => setFilters({...filters, cornerSite: e.target.value})}>
          <option value="">Corner</option><option value="true">Corner Site</option>
        </GlassSelect>
        <GlassSelect className="!w-auto" value={filters.approved} onChange={e => setFilters({...filters, approved: e.target.value})}>
          <option value="">Approval</option><option value="true">Approved</option>
        </GlassSelect>
        <button onClick={() => setFilters({...filters, favoritesOnly: !filters.favoritesOnly})} className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${filters.favoritesOnly ? "bg-rose-400/15 text-rose-400 border-rose-400/30" : "bg-white/[0.04] text-slate-500 border-white/[0.06]"}`}>
          <Heart size={12} className="inline mr-1" fill={filters.favoritesOnly ? "currentColor" : "none"} />Favorites
        </button>
      </div>
    </GlassCard>
  );

  // ── Properties Page ──
  const PropertiesPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      {selectedProperty ? <PropertyDetail property={selectedProperty} /> : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Properties</h1>
              <p className="text-slate-500 text-sm mt-1">{filteredProperties.length} of {properties.length} properties</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition-all ${showFilters ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]"}`}><Filter size={16} /></button>
              <button onClick={() => setViewMode("grid")} className={`p-2.5 rounded-xl border transition-all ${viewMode === "grid" ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08]"}`}><Grid size={16} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2.5 rounded-xl border transition-all ${viewMode === "list" ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20" : "bg-white/[0.04] text-slate-400 border-white/[0.08]"}`}><List size={16} /></button>
            </div>
          </div>
          {showFilters && <FilterPanel />}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProperties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProperties.map(p => <PropertyListItem key={p.id} property={p} />)}
            </div>
          )}
          {filteredProperties.length === 0 && (
            <div className="text-center py-16">
              <Building2 size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">No properties match your filters</p>
              <button onClick={() => setFilters({ type:"", category:"", status:"", minPrice:"", maxPrice:"", area:"", nearHighway:"", cornerSite:"", facing:"", approved:"", favoritesOnly:false })} className="text-cyan-400 text-sm mt-2 hover:underline">Reset filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Favorites Page ──
  const FavoritesPage = () => {
    const favs = properties.filter(p => p.isFavorite);
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        {selectedProperty ? <PropertyDetail property={selectedProperty} /> : (
          <>
            <div><h1 className="font-display text-2xl font-bold text-white">Favorites</h1><p className="text-slate-500 text-sm mt-1">{favs.length} shortlisted properties</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {favs.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
            {favs.length === 0 && <div className="text-center py-16"><Heart size={40} className="mx-auto text-slate-700 mb-3" /><p className="text-slate-500">No favorites yet</p></div>}
          </>
        )}
      </div>
    );
  };

  // ── Deals Page ──
  const DealsPage = () => {
    const deals = properties.filter(p => p.buyers.length > 0 || p.status === "sold" || p.status === "on-hold");
    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <div><h1 className="font-display text-2xl font-bold text-white">Deal Tracker</h1><p className="text-slate-500 text-sm mt-1">Track negotiations and buyer interest</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {["on-hold", "available", "sold"].map(status => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3"><StatusBadge status={status} /><span className="text-xs text-slate-500">({deals.filter(d => d.status === status).length})</span></div>
              <div className="space-y-2">
                {deals.filter(d => d.status === status).map(d => (
                  <GlassCard key={d.id} className="p-4" onClick={() => { setSelectedProperty(d); setActivePage("properties"); }}>
                    <p className="font-display font-semibold text-sm text-white">{d.title}</p>
                    <p className="text-cyan-400 font-semibold text-sm mt-1">{formatCurrency(d.price)}</p>
                    {d.buyers.length > 0 && <div className="mt-2 space-y-1">{d.buyers.map(b => <div key={b.id} className="text-xs text-slate-500 flex items-center gap-1"><User size={10} />{b.name}</div>)}</div>}
                    {d.finalSellingPrice && <p className="text-xs text-emerald-400 mt-2">Sold: {formatCurrency(d.finalSellingPrice)}</p>}
                    {d.negotiationNotes && <p className="text-xs text-slate-600 mt-1 italic">{d.negotiationNotes}</p>}
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Map Page ──
  const MapPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div><h1 className="font-display text-2xl font-bold text-white">Map View</h1><p className="text-slate-500 text-sm mt-1">Visualize property locations</p></div>
      <GlassCard className="p-0 overflow-hidden h-[500px] relative" hover={false}>
        <div className="absolute inset-0 bg-[#0d1117] flex items-center justify-center">
          <div className="relative w-full h-full p-8">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",backgroundSize:"40px 40px"}}/>
            {properties.filter(p => p.lat && p.lng).map(p => {
              const x = ((p.lng - 77.3) / 0.6) * 100;
              const y = (1 - (p.lat - 12.8) / 0.5) * 100;
              return (
                <button key={p.id} onClick={() => { setSelectedProperty(p); setActivePage("properties"); }} className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10" style={{ left: `${Math.min(90, Math.max(10, x))}%`, top: `${Math.min(90, Math.max(10, y))}%` }}>
                  <div className={`w-4 h-4 rounded-full border-2 border-white/30 shadow-lg transition-all group-hover:scale-150 ${p.status === "available" ? "bg-emerald-400" : p.status === "sold" ? "bg-rose-400" : p.status === "on-hold" ? "bg-amber-400" : "bg-slate-400"}`}>
                    <div className={`absolute w-4 h-4 rounded-full animate-ping opacity-30 ${p.status === "available" ? "bg-emerald-400" : "bg-transparent"}`} />
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-[#111827]/95 backdrop-blur-sm border border-white/10 rounded-xl p-3 w-48 pointer-events-none z-20">
                    <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{p.area}</p>
                    <p className="text-xs text-cyan-400 font-semibold mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </button>
              );
            })}
            <div className="absolute bottom-4 left-4 bg-[#111827]/80 backdrop-blur-sm border border-white/10 rounded-xl p-3 space-y-1.5">
              {[{l:"Available",c:"bg-emerald-400"},{l:"On Hold",c:"bg-amber-400"},{l:"Sold",c:"bg-rose-400"},{l:"Draft",c:"bg-slate-400"}].map(i=>(
                <div key={i.l} className="flex items-center gap-2 text-[11px] text-slate-400"><div className={`w-2.5 h-2.5 rounded-full ${i.c}`}/>{i.l}</div>
              ))}
            </div>
            <p className="absolute top-4 right-4 text-[11px] text-slate-600">Bangalore Region · Connect Google Maps API for live maps</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );

  // ── Documents Page ──
  const DocumentsPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div><h1 className="font-display text-2xl font-bold text-white">Documents</h1><p className="text-slate-500 text-sm mt-1">Manage property documents</p></div>
      <GlassCard className="p-8 text-center" hover={false}>
        <FolderOpen size={40} className="mx-auto text-slate-600 mb-3" />
        <p className="text-slate-400 text-sm">Upload and manage documents per property</p>
        <p className="text-slate-600 text-xs mt-1">Sale agreements, tax documents, legal papers</p>
        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 mt-4 hover:border-cyan-400/30 transition-all cursor-pointer">
          <Upload size={24} className="mx-auto text-slate-500 mb-2" />
          <p className="text-sm text-slate-400">Drag & drop files here</p>
        </div>
      </GlassCard>
      <div className="space-y-2">
        {properties.filter(p => p.notes.length > 0).map(p => (
          <GlassCard key={p.id} className="p-4 flex items-center gap-4" hover={false}>
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400"><FileText size={18} /></div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{p.title}</p><p className="text-xs text-slate-500">{p.notes.length} notes attached</p></div>
            <button onClick={() => { setSelectedProperty(p); setActivePage("properties"); }} className="text-xs text-cyan-400 hover:underline">View</button>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  // ── Analytics Page ──
  const AnalyticsPage = () => {
    const priceByArea = useMemo(() => {
      const areas = {};
      properties.forEach(p => { if (!areas[p.area]) areas[p.area] = { area: p.area, total: 0, count: 0 }; areas[p.area].total += p.price; areas[p.area].count++; });
      return Object.values(areas).map(a => ({ ...a, avg: a.total / a.count })).sort((a, b) => b.avg - a.avg);
    }, [properties]);

    return (
      <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
        <div><h1 className="font-display text-2xl font-bold text-white">Analytics</h1><p className="text-slate-500 text-sm mt-1">Insights and trends</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard className="p-5" hover={false}>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Avg Price by Area</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priceByArea.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => formatCurrency(v)} />
                <YAxis dataKey="area" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#e2e8f0" }} formatter={v => formatCurrency(v)} />
                <Bar dataKey="avg" fill="#00f0ff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Property Views</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={properties.sort((a, b) => b.views - a.views).slice(0, 6).map(p => ({ name: p.title.substring(0, 15) + "...", views: p.views }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#e2e8f0" }} />
                <Bar dataKey="views" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Sales Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={SALES_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#e2e8f0" }} />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} dot={{ fill: "#34d399", r: 4 }} />
                <Line type="monotone" dataKey="sales" stroke="#fbbf24" strokeWidth={2} dot={{ fill: "#fbbf24", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard className="p-5" hover={false}>
            <h3 className="font-display font-semibold text-sm text-white mb-4">Portfolio Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: "Total Portfolio Value", value: formatCurrency(stats.totalValue), sub: "Active listings" },
                { label: "Average Price", value: formatCurrency(stats.totalValue / (stats.available || 1)), sub: "Per property" },
                { label: "Total Sold Value", value: formatCurrency(stats.totalSoldValue), sub: `${stats.sold} properties` },
                { label: "Conversion Rate", value: `${((stats.sold / stats.total) * 100).toFixed(1)}%`, sub: "Sold / Total" },
                { label: "Properties with Buyers", value: properties.filter(p => p.buyers.length > 0).length.toString(), sub: "Active interest" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div><p className="text-sm text-slate-300">{item.label}</p><p className="text-[11px] text-slate-600">{item.sub}</p></div>
                  <p className="font-display font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };

  // ── Users Page ──
  const UsersPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-2xl font-bold text-white">User Management</h1><p className="text-slate-500 text-sm mt-1">Manage roles and access</p></div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold"><Plus size={16} /> Add User</button>
      </div>
      <div className="space-y-2">
        {[
          { name: "Admin", email: "admin@propertynexus.com", role: "admin", color: "cyan" },
          { name: "Rahul Agent", email: "rahul@propertynexus.com", role: "agent", color: "purple" },
          { name: "Viewer Account", email: "viewer@propertynexus.com", role: "viewer", color: "slate" },
        ].map((u, i) => (
          <GlassCard key={i} className="p-4 flex items-center gap-4" hover={false}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${u.color === "cyan" ? "bg-gradient-to-br from-cyan-500 to-blue-500" : u.color === "purple" ? "bg-gradient-to-br from-purple-500 to-rose-500" : "bg-gradient-to-br from-slate-500 to-slate-600"}`}>{u.name[0]}</div>
            <div className="flex-1"><p className="text-sm font-medium text-white">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase ${u.role === "admin" ? "bg-cyan-400/15 text-cyan-400" : u.role === "agent" ? "bg-purple-400/15 text-purple-400" : "bg-slate-400/15 text-slate-400"}`}>{u.role}</span>
            <button className="p-2 rounded-lg hover:bg-white/[0.08] text-slate-500"><MoreHorizontal size={16} /></button>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-5 space-y-3" hover={false}>
        <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><Shield size={14} /> Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-slate-500 text-xs uppercase">
              <th className="text-left py-2 px-3">Permission</th><th className="text-center py-2 px-3">Admin</th><th className="text-center py-2 px-3">Agent</th><th className="text-center py-2 px-3">Viewer</th>
            </tr></thead>
            <tbody>
              {["Add/Edit Properties","Delete Properties","View All Properties","Manage Users","View Analytics","Export Data","Manage Deals","View Documents"].map(p => (
                <tr key={p} className="border-t border-white/[0.04]">
                  <td className="py-2.5 px-3 text-slate-300">{p}</td>
                  <td className="text-center"><CheckCircle size={14} className="inline text-emerald-400" /></td>
                  <td className="text-center">{["Add/Edit Properties","View All Properties","View Analytics","Manage Deals","View Documents"].includes(p) ? <CheckCircle size={14} className="inline text-emerald-400" /> : <X size={14} className="inline text-slate-600" />}</td>
                  <td className="text-center">{["View All Properties","View Documents"].includes(p) ? <CheckCircle size={14} className="inline text-emerald-400" /> : <X size={14} className="inline text-slate-600" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );

  // ── Audit Logs Page ──
  const AuditPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div><h1 className="font-display text-2xl font-bold text-white">Audit Logs</h1><p className="text-slate-500 text-sm mt-1">Security and change tracking</p></div>
      <GlassCard className="p-5" hover={false}>
        <div className="space-y-2">
          {[
            { action:"Property Created", detail:"Added '40x60 Plot - Electronic City'", user:"Admin", time:"2025-03-25 08:00", icon:Plus, color:"text-emerald-400" },
            { action:"Price Updated", detail:"'3BHK Villa - Whitefield' ₹1.7Cr → ₹1.85Cr", user:"Admin", time:"2025-03-22 11:00", icon:TrendingUp, color:"text-amber-400" },
            { action:"Status Changed", detail:"'5 Acre Agricultural Land' → Sold", user:"Admin", time:"2025-03-01 10:00", icon:CheckCircle, color:"text-cyan-400" },
            { action:"Property Edited", detail:"Updated '2 Acre Premium Farm Land' details", user:"Admin", time:"2025-02-28 14:30", icon:Edit, color:"text-purple-400" },
            { action:"User Login", detail:"Admin logged in from 103.21.xx.xx", user:"System", time:"2025-03-25 07:45", icon:Shield, color:"text-slate-400" },
            { action:"Buyer Added", detail:"Vikram Singh added to '3BHK Villa'", user:"Admin", time:"2025-03-10 09:00", icon:User, color:"text-emerald-400" },
            { action:"Document Uploaded", detail:"Sale deed for prop_003", user:"Admin", time:"2025-03-08 16:20", icon:Upload, color:"text-purple-400" },
          ].map((log, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all">
              <div className={`w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 ${log.color}`}><log.icon size={14} /></div>
              <div className="flex-1">
                <p className="text-sm text-slate-200 font-medium">{log.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">{log.detail}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-600">{log.user}</p>
                <p className="text-[10px] text-slate-700">{log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  // ── Settings Page ──
  const SettingsPage = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <div><h1 className="font-display text-2xl font-bold text-white">Settings</h1><p className="text-slate-500 text-sm mt-1">Configure your workspace</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-5 space-y-4" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><User size={14} /> Profile</h3>
          <div className="space-y-3">
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Name</label><GlassInput defaultValue="Admin" /></div>
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Email</label><GlassInput defaultValue="admin@propertynexus.com" /></div>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl text-slate-900 text-sm font-bold">Save Changes</button>
          </div>
        </GlassCard>
        <GlassCard className="p-5 space-y-4" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><Lock size={14} /> Security</h3>
          <div className="space-y-3">
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">Current Password</label><GlassInput type="password" placeholder="••••••••" /></div>
            <div><label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">New Password</label><GlassInput type="password" placeholder="••••••••" /></div>
            <button className="px-4 py-2 bg-white/[0.08] border border-white/[0.1] rounded-xl text-sm text-slate-300 hover:bg-white/[0.12] transition-all">Update Password</button>
          </div>
        </GlassCard>
        <GlassCard className="p-5 space-y-4" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><Bell size={14} /> Notifications</h3>
          {["Price changes","Status updates","New properties","Unsold reminders"].map(n => (
            <label key={n} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-400">{n}</span>
              <div className="w-10 h-6 bg-cyan-400/30 rounded-full relative"><div className="w-4 h-4 bg-cyan-400 rounded-full absolute top-1 right-1 transition-all" /></div>
            </label>
          ))}
        </GlassCard>
        <GlassCard className="p-5 space-y-4" hover={false}>
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2"><Zap size={14} /> Automation</h3>
          {["Auto-generate property IDs","Auto watermark images","Unsold property reminders (60 days)","AI description generator"].map(n => (
            <label key={n} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-400">{n}</span>
              <div className="w-10 h-6 bg-cyan-400/30 rounded-full relative"><div className="w-4 h-4 bg-cyan-400 rounded-full absolute top-1 right-1 transition-all" /></div>
            </label>
          ))}
        </GlassCard>
      </div>
    </div>
  );

  // ── Page Router ──
  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "properties": return <PropertiesPage />;
      case "favorites": return <FavoritesPage />;
      case "deals": return <DealsPage />;
      case "map": return <MapPage />;
      case "documents": return <DocumentsPage />;
      case "analytics": return <AnalyticsPage />;
      case "users": return <UsersPage />;
      case "audit": return <AuditPage />;
      case "settings": return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(0,240,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(52,211,153,0.03) 0%, transparent 50%)" }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"}`}>
        <TopBar />
        <main className="p-6 relative z-10">
          {renderPage()}
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && <PropertyModal />}

      {/* Click outside to close notifications */}
      {showNotifications && <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />}

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />
    </div>
  );
}
