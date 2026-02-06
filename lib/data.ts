import { Gym, Booking, AffiliateApplication } from './types';

export const GYMS: Gym[] = [
  {
    id: 'gym_1',
    name: 'Tiger Muay Thai',
    location: 'Phuket, Soi Ta-iad',
    description: 'The world-famous training camp in Phuket. Offers comprehensive training for all levels.',
    images: ['https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?q=80&w=2000&auto=format&fit=crop', 'https://picsum.photos/800/400?random=11'],
    basePrice: 500,
    ownerId: 'u_owner1',
    isFlashSale: false,
    flashSaleDiscount: 20,
    trainers: [
      { 
        id: 't_1', 
        name: 'Kru Bird', 
        specialty: 'Clinch Specialist', 
        languages: ['Thai', 'English'],
        image: 'https://picsum.photos/200/200?random=20', 
        pricePerSession: 1000 
      },
      { 
        id: 't_2', 
        name: 'Kru Oh', 
        specialty: 'Boxing Technique', 
        languages: ['Thai'],
        image: 'https://picsum.photos/200/200?random=21', 
        pricePerSession: 800 
      }
    ]
  },
  {
    id: 'gym_2',
    name: 'Diamond Fight Team',
    location: 'Koh Samui',
    description: 'Island style training with a view. Focus on conditioning and traditional technique.',
    images: ['https://picsum.photos/800/400?random=12', 'https://picsum.photos/800/400?random=13'],
    basePrice: 400,
    ownerId: 'u_owner2',
    isFlashSale: true,
    flashSaleDiscount: 15,
    trainers: [
      { 
        id: 't_3', 
        name: 'Kru Yod', 
        specialty: 'Kicks & Power', 
        languages: ['Thai', 'English', 'Japanese'],
        image: 'https://picsum.photos/200/200?random=22', 
        pricePerSession: 900 
      }
    ]
  }
];

export const BOOKINGS: Booking[] = [
  {
    id: 'b_1',
    gymId: 'gym_1',
    gymName: 'Tiger Muay Thai',
    userId: 'u_cust2',
    userName: 'Sarah Punch',
    date: '2023-11-15',
    type: 'standard',
    totalPrice: 500,
    commissionPaidTo: 'alexkicks',
    commissionAmount: 75,
    status: 'completed'
  },
  {
    id: 'b_2',
    gymId: 'gym_1',
    gymName: 'Tiger Muay Thai',
    userId: 'u_cust1',
    userName: 'Alex Striker',
    date: '2023-12-01',
    type: 'private',
    trainerId: 't_1',
    trainerName: 'Kru Bird',
    totalPrice: 1500,
    commissionAmount: 0,
    status: 'confirmed'
  }
];

export const AFFILIATE_APPLICATIONS: AffiliateApplication[] = [
  {
    id: 'app_1',
    userId: 'u_cust2',
    userName: 'Sarah Punch',
    reason: 'I am a travel blogger focusing on martial arts tourism.',
    status: 'pending'
  }
];