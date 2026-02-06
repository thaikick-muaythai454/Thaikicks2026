export type UserRole = 'admin' | 'owner' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isAffiliate: boolean;
  affiliateCode?: string;
  affiliateEarnings: number;
  affiliateStatus: 'none' | 'pending' | 'active' | 'rejected';
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  languages: string[]; // Added property
  image: string;
  pricePerSession: number;
}

export interface Gym {
  id: string;
  name: string;
  category: 'gym' | 'camp';
  location: string;
  description: string;
  images: string[];
  basePrice: number;
  ownerId: string;
  trainers: Trainer[];
  isFlashSale: boolean;
  flashSaleDiscount: number;
  affiliatePercentage?: number;
}

export interface Booking {
  id: string;
  gymId: string;
  gymName: string;
  userId: string;
  userName: string;
  date: string;
  startTime?: string;
  endTime?: string;
  type: 'standard' | 'private' | 'course';
  trainerId?: string;
  trainerName?: string;
  courseId?: string;
  courseTitle?: string;
  totalPrice: number;
  commissionPaidTo?: string;
  commissionAmount: number;
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface AffiliateApplication {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface TrainerSchedule {
  id: string;
  trainerId: string;
  dayOfWeek: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  gymId: string;
  title: string;
  description: string;
  price: number;
  duration?: string;
  maxStudents?: number;
  designData: any; // Flexible JSON structure
  imageUrl?: string;
  isActive: boolean;
}

// --- SHOP TYPES ---

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  isFeatured: boolean;
  createdAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ShopOrder {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress?: string;
  contactDetails?: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentStatus?: string;
  paymentVerifiedAt?: string;
  adminNotes?: string;
  createdAt: string;
  items?: ShopOrderItem[];
}

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName?: string;
  quantity: number;
  priceAtPurchase: number;
}