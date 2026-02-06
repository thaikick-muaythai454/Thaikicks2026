import { User } from './types';

export const USERS: User[] = [
  {
    id: 'u_admin',
    name: 'Master Admin',
    email: 'admin@thaikick.com',
    role: 'admin',
    avatar: 'https://picsum.photos/100/100?random=1',
    isAffiliate: false,
    affiliateEarnings: 0,
    affiliateStatus: 'none'
  },
  {
    id: 'u_owner1',
    name: 'Somchai (Tiger Gym)',
    email: 'somchai@tiger.com',
    role: 'owner',
    avatar: 'https://picsum.photos/100/100?random=2',
    isAffiliate: false,
    affiliateEarnings: 0,
    affiliateStatus: 'none'
  },
  {
    id: 'u_cust1',
    name: 'Alex Striker',
    email: 'alex@gmail.com',
    role: 'customer',
    avatar: 'https://picsum.photos/100/100?random=3',
    isAffiliate: true,
    affiliateCode: 'alexkicks',
    affiliateEarnings: 150.00,
    affiliateStatus: 'active'
  },
  {
    id: 'u_cust2',
    name: 'Sarah Punch',
    email: 'sarah@gmail.com',
    role: 'customer',
    avatar: 'https://picsum.photos/100/100?random=4',
    isAffiliate: false,
    affiliateEarnings: 0,
    affiliateStatus: 'pending'
  }
];

export const getUserById = (id: string): User | undefined => {
  return USERS.find(u => u.id === id);
};