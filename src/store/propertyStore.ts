// src/store/propertyStore.ts
import { create } from 'zustand';

// Types
export interface Property {
  id: string;
  title: string;
  type: 'land' | 'plot' | 'house' | 'commercial';
  category: 'residential' | 'commercial' | 'agricultural';
  description: string;
  price: number;
  previousPrice?: number;
  pricePerUnit: number;
  priceUnit: 'sqft' | 'acre' | 'gunta';
  size: number;
  sizeUnit: 'sqft' | 'acres' | 'guntas';
  status: 'draft' | 'available' | 'on-hold' | 'sold';
  owner: string;
  ownerContact: string;
  country: string;
  state: string;
  city: string;
  area: string;
  pincode: string;
  lat?: number;
  lng?: number;
  images: string[];
  coverImage: number;
  videoUrl?: string;
  documents: DocumentFile[];
  tags: string[];
  facing?: 'east' | 'west' | 'north' | 'south';
  nearHighway: boolean;
  cornerSite: boolean;
  approved: boolean;
  notes: Note[];
  buyers: Buyer[];
  finalSellingPrice?: number;
  soldDate?: string;
  negotiationNotes: string;
  views: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface Buyer {
  id: string;
  name: string;
  contact: string;
  notes: string;
  addedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar?: string;
}

export interface Notification {
  id: string;
  type: 'price_change' | 'status_change' | 'new_property' | 'reminder';
  message: string;
  propertyId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface Filters {
  search: string;
  type: string;
  category: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  minSize: number;
  maxSize: number;
  area: string;
  tags: string[];
  nearHighway: boolean | null;
  cornerSite: boolean | null;
  facing: string;
  approved: boolean | null;
  favoritesOnly: boolean;
}

interface PropertyStore {
  // Data
  properties: Property[];
  users: User[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  currentUser: User;

  // UI State
  activePage: string;
  selectedProperty: Property | null;
  isModalOpen: boolean;
  modalType: string;
  filters: Filters;
  sidebarCollapsed: boolean;

  // Actions
  addProperty: (property: Property) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setActivePage: (page: string) => void;
  setSelectedProperty: (property: Property | null) => void;
  openModal: (type: string) => void;
  closeModal: () => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  addAuditLog: (log: AuditLog) => void;
  toggleSidebar: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultFilters: Filters = {
  search: '',
  type: '',
  category: '',
  status: '',
  minPrice: 0,
  maxPrice: 0,
  minSize: 0,
  maxSize: 0,
  area: '',
  tags: [],
  nearHighway: null,
  cornerSite: null,
  facing: '',
  approved: null,
  favoritesOnly: false,
};

// Sample data
const sampleProperties: Property[] = [
  {
    id: 'prop_001',
    title: '2 Acre Premium Farm Land',
    type: 'land',
    category: 'agricultural',
    description: 'Beautiful 2 acre farm land with fertile soil, water supply, and road access. Ideal for organic farming or weekend retreat.',
    price: 4500000,
    previousPrice: 4000000,
    pricePerUnit: 55,
    priceUnit: 'sqft',
    size: 2,
    sizeUnit: 'acres',
    status: 'available',
    owner: 'Rajesh Kumar',
    ownerContact: '+91 98765 43210',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'Devanahalli',
    pincode: '562110',
    lat: 13.2468,
    lng: 77.7120,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['investment', 'prime-location', 'near-highway'],
    facing: 'east',
    nearHighway: true,
    cornerSite: false,
    approved: true,
    notes: [
      { id: 'n1', text: 'Owner ready to negotiate on price', createdAt: '2025-03-15T10:30:00Z', author: 'Admin' },
    ],
    buyers: [
      { id: 'b1', name: 'Suresh Patel', contact: '+91 87654 32109', notes: 'Interested, visiting next week', addedAt: '2025-03-20T14:00:00Z' },
    ],
    negotiationNotes: 'Owner asking 45L, market rate is 40L. Room for negotiation.',
    views: 234,
    isFavorite: true,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-03-25T16:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'prop_002',
    title: '30x40 Corner Site - Yelahanka',
    type: 'plot',
    category: 'residential',
    description: 'BDA approved 30x40 corner site in a premium gated layout with all amenities. Clear title, ready for construction.',
    price: 7200000,
    pricePerUnit: 6000,
    priceUnit: 'sqft',
    size: 1200,
    sizeUnit: 'sqft',
    status: 'available',
    owner: 'Meena Sharma',
    ownerContact: '+91 99887 76655',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'Yelahanka',
    pincode: '560064',
    lat: 13.1007,
    lng: 77.5963,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['corner-site', 'approved', 'prime-location'],
    facing: 'north',
    nearHighway: false,
    cornerSite: true,
    approved: true,
    notes: [],
    buyers: [],
    negotiationNotes: '',
    views: 567,
    isFavorite: false,
    createdAt: '2025-02-01T09:00:00Z',
    updatedAt: '2025-03-20T12:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'prop_003',
    title: '3BHK Villa - Whitefield',
    type: 'house',
    category: 'residential',
    description: 'Luxurious 3BHK independent villa with garden, car parking, and modern interiors. Located in a gated community.',
    price: 18500000,
    previousPrice: 17000000,
    pricePerUnit: 8500,
    priceUnit: 'sqft',
    size: 2200,
    sizeUnit: 'sqft',
    status: 'on-hold',
    owner: 'Anand Verma',
    ownerContact: '+91 77665 54433',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'Whitefield',
    pincode: '560066',
    lat: 12.9698,
    lng: 77.7500,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['luxury', 'gated-community'],
    facing: 'west',
    nearHighway: false,
    cornerSite: false,
    approved: true,
    notes: [
      { id: 'n2', text: 'Buyer finalizing loan approval', createdAt: '2025-03-22T11:00:00Z', author: 'Admin' },
    ],
    buyers: [
      { id: 'b2', name: 'Vikram Singh', contact: '+91 88990 01122', notes: 'Loan approved, registration pending', addedAt: '2025-03-10T09:00:00Z' },
    ],
    negotiationNotes: 'Deal almost closed at 1.85Cr',
    views: 892,
    isFavorite: true,
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-03-22T11:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'prop_004',
    title: 'Commercial Space - MG Road',
    type: 'commercial',
    category: 'commercial',
    description: 'Prime commercial space on MG Road. Suitable for retail, office, or showroom. High footfall area.',
    price: 35000000,
    pricePerUnit: 18000,
    priceUnit: 'sqft',
    size: 1950,
    sizeUnit: 'sqft',
    status: 'available',
    owner: 'Prakash Industries',
    ownerContact: '+91 66554 43322',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'MG Road',
    pincode: '560001',
    lat: 12.9756,
    lng: 77.6068,
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['prime-location', 'investment', 'high-roi'],
    nearHighway: false,
    cornerSite: true,
    approved: true,
    notes: [],
    buyers: [],
    negotiationNotes: '',
    views: 1203,
    isFavorite: false,
    createdAt: '2025-02-15T08:00:00Z',
    updatedAt: '2025-03-18T15:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'prop_005',
    title: '5 Acre Agricultural Land - Mysore Road',
    type: 'land',
    category: 'agricultural',
    description: 'Spacious 5 acre agricultural land with borewell and electricity. Perfect for farming or future development.',
    price: 8000000,
    previousPrice: 7500000,
    pricePerUnit: 37,
    priceUnit: 'sqft',
    size: 5,
    sizeUnit: 'acres',
    status: 'sold',
    owner: 'Ravi Gowda',
    ownerContact: '+91 55443 32211',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'Mysore Road',
    pincode: '562130',
    lat: 12.8500,
    lng: 77.4000,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['investment'],
    nearHighway: true,
    cornerSite: false,
    approved: true,
    notes: [],
    buyers: [],
    finalSellingPrice: 7800000,
    soldDate: '2025-03-01',
    negotiationNotes: 'Sold at 78L after negotiation from 80L',
    views: 456,
    isFavorite: false,
    createdAt: '2024-12-01T08:00:00Z',
    updatedAt: '2025-03-01T10:00:00Z',
    createdBy: 'admin',
  },
  {
    id: 'prop_006',
    title: '40x60 Plot - Electronic City',
    type: 'plot',
    category: 'residential',
    description: 'BMRDA approved 40x60 plot near Electronic City Phase 2. Close to IT parks and all amenities.',
    price: 5400000,
    pricePerUnit: 2250,
    priceUnit: 'sqft',
    size: 2400,
    sizeUnit: 'sqft',
    status: 'available',
    owner: 'Sunita Reddy',
    ownerContact: '+91 44332 21100',
    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    area: 'Electronic City',
    pincode: '560100',
    lat: 12.8440,
    lng: 77.6593,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
    ],
    coverImage: 0,
    documents: [],
    tags: ['approved', 'near-it-park'],
    facing: 'south',
    nearHighway: true,
    cornerSite: false,
    approved: true,
    notes: [],
    buyers: [],
    negotiationNotes: '',
    views: 345,
    isFavorite: false,
    createdAt: '2025-03-01T08:00:00Z',
    updatedAt: '2025-03-25T10:00:00Z',
    createdBy: 'admin',
  },
];

const sampleNotifications: Notification[] = [
  { id: 'notif_1', type: 'price_change', message: 'Price updated for "3BHK Villa - Whitefield" from ₹1.7Cr to ₹1.85Cr', propertyId: 'prop_003', read: false, createdAt: '2025-03-25T10:00:00Z' },
  { id: 'notif_2', type: 'status_change', message: '"5 Acre Agricultural Land" marked as Sold', propertyId: 'prop_005', read: false, createdAt: '2025-03-01T10:00:00Z' },
  { id: 'notif_3', type: 'new_property', message: 'New property added: "40x60 Plot - Electronic City"', propertyId: 'prop_006', read: true, createdAt: '2025-03-01T08:00:00Z' },
  { id: 'notif_4', type: 'reminder', message: '"2 Acre Premium Farm Land" has been unsold for 60+ days', propertyId: 'prop_001', read: true, createdAt: '2025-03-15T08:00:00Z' },
];

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: sampleProperties,
  users: [
    { id: 'u1', name: 'Admin', email: 'admin@propertynexus.com', role: 'admin' },
    { id: 'u2', name: 'Rahul Agent', email: 'rahul@propertynexus.com', role: 'agent' },
  ],
  notifications: sampleNotifications,
  auditLogs: [],
  currentUser: { id: 'u1', name: 'Admin', email: 'admin@propertynexus.com', role: 'admin' },

  activePage: 'dashboard',
  selectedProperty: null,
  isModalOpen: false,
  modalType: '',
  filters: { ...defaultFilters },
  sidebarCollapsed: false,

  addProperty: (property) => {
    set((state) => ({
      properties: [property, ...state.properties],
      notifications: [
        {
          id: generateId(),
          type: 'new_property',
          message: `New property added: "${property.title}"`,
          propertyId: property.id,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    }));
  },

  updateProperty: (id, updates) => {
    set((state) => {
      const oldProp = state.properties.find((p) => p.id === id);
      const newNotifications = [...state.notifications];

      if (oldProp && updates.price && updates.price !== oldProp.price) {
        newNotifications.unshift({
          id: generateId(),
          type: 'price_change',
          message: `Price updated for "${oldProp.title}"`,
          propertyId: id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
      if (oldProp && updates.status && updates.status !== oldProp.status) {
        newNotifications.unshift({
          id: generateId(),
          type: 'status_change',
          message: `"${oldProp.title}" status changed to ${updates.status}`,
          propertyId: id,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        properties: state.properties.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        ),
        notifications: newNotifications,
      };
    });
  },

  deleteProperty: (id) => {
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
    }));
  },

  toggleFavorite: (id) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      ),
    }));
  },

  setActivePage: (page) => set({ activePage: page, selectedProperty: null }),
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  openModal: (type) => set({ isModalOpen: true, modalType: type }),
  closeModal: () => set({ isModalOpen: false, modalType: '' }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  addAuditLog: (log) =>
    set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));
