export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagLine?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  mapLink?: string;
  whatsappNumber?: string;
  openingHours: string;
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  isOrderingEnabled: boolean;
  isPayAtCounterOnly: boolean;
  isOpen: boolean;
}

export interface LandingPageContent {
  id?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImage?: string;
  aboutTitle: string;
  aboutText: string;
  aboutHighlight1: string;
  aboutHighlight2: string;
  aboutHighlight3: string;
  aboutImage?: string;
  announcementText?: string;
  announcementActive: boolean;
  instagramUrl?: string;
  facebookUrl?: string;
  mapEmbedUrl?: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
}

export interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
  displayOrder: number;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ItemVariant {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isDefault: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  isVeg: boolean;
  isBestseller: boolean;
  isSpecial: boolean;
  isAvailable: boolean;
  image?: string;
  prepTimeMinutes: number;
  displayOrder: number;
  category?: { id: string; name: string };
  variants?: ItemVariant[];
  modifierGroups?: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder: number;
  isActive: boolean;
  items?: MenuItem[];
  _count?: { items: number };
}

export interface Table {
  id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  section: string;
  isActive: boolean;
  qrCode?: {
    token: string;
    scanCount: number;
    lastScannedAt?: string;
  };
  qrUrl?: string;
  qrDataUrl?: string;
  _count?: { orders: number };
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  isVeg: boolean;
  variantId?: string;
  variantName?: string;
  selectedModifiers?: { id: string; name: string; price: number }[];
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  notes?: string;
  modifiers?: { modifierName: string; price: number }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  orderToken: string;
  orderType: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  paymentStatus: string;
  paymentMethod: string;
  rejectionReason?: string;
  estimatedPrepTime?: number;
  createdAt: string;
  table?: { tableNumber: string; name: string; section?: string };
  items?: OrderItem[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'KITCHEN';
  status: string;
  restaurantId?: string;
  restaurant?: { id: string; name: string; slug: string; logo?: string };
}
