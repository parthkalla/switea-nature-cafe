export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tagLine?: string;
  themeTemplate?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgCream?: string;
  photoLayout?: 'bento' | 'magazine' | 'cinematic' | 'split' | 'zen';
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
  upiId?: string;
  openingHours: string;
  currency: string;
  currencySymbol: string;
  taxPercent: number;
  isOrderingEnabled: boolean;
  isPayAtCounterOnly: boolean;
  isOpen: boolean;
  isLoyaltyEnabled?: boolean;
  loyaltyPerOrderPoints?: number;
  loyaltyFoodSpendPerPoint?: number;
  loyaltyCoffeeSpendPerPoint?: number;
  loyaltyPointValue?: number;
  loyaltyMinOrderAmount?: number;
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
  itemType?: 'FOOD' | 'COFFEE';
  isVeg: boolean;
  isBestseller: boolean;
  isSpecial: boolean;
  isAvailable: boolean;
  image?: string;
  prepTimeMinutes: number;
  loyaltyPoints?: number;
  displayOrder: number;
  category?: { id: string; name: string; itemType?: 'FOOD' | 'COFFEE' };
  variants?: ItemVariant[];
  modifierGroups?: ModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  itemType?: 'FOOD' | 'COFFEE';
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
  isOccupied?: boolean;
  status?: 'AVAILABLE' | 'OCCUPIED';
  activeOrders?: any[];
  _count?: { orders: number };
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  itemType?: 'FOOD' | 'COFFEE';
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
  itemType?: 'FOOD' | 'COFFEE';
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
  source?: 'DIRECT' | 'SWIGGY' | 'ZOMATO' | string;
  isDemo?: boolean;
  externalOrderId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  riderVehicle?: string | null;
  deliveryAddress?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryEta?: number | null;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  subtotal: number;
  discountAmount: number;
  foodPointsEarned?: number;
  coffeePointsEarned?: number;
  foodPointsRedeemed?: number;
  coffeePointsRedeemed?: number;
  loyaltyDiscount?: number;
  customerLoyalty?: {
    foodPoints: number;
    coffeePoints: number;
    lifetimeFoodPoints: number;
    lifetimeCoffeePoints: number;
  } | null;
  taxAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  paymentStatus: string;
  paymentMethod: string;
  rejectionReason?: string;
  estimatedPrepTime?: number;
  createdAt: string;
  table?: { id?: string; tableNumber: string; name: string; section?: string; token?: string | null };
  items?: OrderItem[];
  whatsappLink?: string | null;
}

export interface CustomerLoyalty {
  id?: string;
  customerPhone: string;
  customerName?: string | null;
  foodPoints: number;
  coffeePoints: number;
  lifetimeFoodPoints: number;
  lifetimeCoffeePoints: number;
  transactions?: LoyaltyTransaction[];
}

export interface LoyaltyTransaction {
  id: string;
  pointsType: 'FOOD' | 'COFFEE';
  points: number;
  reason: string;
  description?: string;
  createdAt: string;
  order?: { orderNumber: string; totalAmount: number; status: string };
}

export interface CartCalculation {
  subtotal: number;
  foodSubtotal: number;
  coffeeSubtotal: number;
  potentialFoodPoints: number;
  potentialCoffeePoints: number;
  availableFoodPoints: number;
  availableCoffeePoints: number;
  maxRedeemableFoodPoints: number;
  maxRedeemableCoffeePoints: number;
  foodPointsRedeemed: number;
  coffeePointsRedeemed: number;
  loyaltyDiscount: number;
  discountAmount: number;
  discount?: { code: string; amount: number; value: number; type: string } | null;
  discountError?: string | null;
  minOrderAmount?: number | null;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  items: any[];
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
