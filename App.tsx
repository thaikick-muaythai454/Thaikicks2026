import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Shield, Activity, Users, MapPin, Star, Calendar, MessageSquare, Menu, X, ArrowRight, CheckCircle, ChevronDown, Award, PlayCircle, BookOpen, Layers, ShoppingBag, Trash2, Edit, Check, Link as LinkIcon, Square, TrendingUp } from 'lucide-react';

import AffiliateTracker from './components/AffiliateTracker';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import AdminDashboard from './components/AdminDashboard';
import OwnerDashboard from './components/OwnerDashboard'; // Import new component
import AnalyticsDashboard from './components/AnalyticsDashboard'; // New Import
import BookingPage from './components/BookingPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import ShopAdminPage from './components/ShopAdminPage';
import ShopPage from './components/ShopPage';
import CheckoutPage from './components/CheckoutPage';
import CheckoutSuccessPage from './components/CheckoutSuccessPage';
import TicketingPage from './components/TicketingPage';
import NotFoundPage from './components/NotFoundPage';
import LegalPage from './components/LegalPage';
import CookieBanner from './components/CookieBanner';

import { BOOKINGS, AFFILIATE_APPLICATIONS } from './lib/data';
import { USERS } from './lib/auth-data';
import { Gym, User, Booking, Product } from './lib/types';
import {
  getGyms,
  getUserBookings,
  createAffiliateApplication,
  getAffiliateApplications,
  updateAffiliateApplicationStatus,
  updateUserAffiliateStatus,
  getAnnouncements, // Added import
  getAllBookings,
  getGymBookings,
  getSystemSetting
} from './services/dataService';
import { getCurrentUser } from './services/authService';
import { supabase } from './lib/supabaseClient';

// --- Shared Components ---

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

const Notification: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => (
  <div className={`fixed top-28 left-1/2 -translate-x-1/2 z-50 px-6 py-4 border-2 font-mono text-xs font-bold uppercase shadow-[4px_4px_0px_0px_#1A1A1A] animate-reveal flex items-center gap-4 ${type === 'success' ? 'bg-white border-brand-charcoal text-brand-charcoal' : 'bg-brand-red text-white border-brand-charcoal'
    }`}>
    {type === 'success' && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
    {message}
    <button onClick={onClose} className="ml-4 hover:opacity-50 font-black">X</button>
  </div>
);

const BlockInput: React.FC<{ label: string; value?: string; onChange?: (e: any) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div className="p-6 border-b md:border-b-0 md:border-r border-brand-charcoal last:border-r-0 md:border-gray-200">
    <label className="block font-mono text-sm text-brand-blue font-bold mb-2 uppercase">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-transparent border-none outline-none font-mono text-xl text-brand-charcoal placeholder-gray-300"
    />
  </div>
);

const GymCard: React.FC<{ gym: Gym; onBook: () => void; isLarge?: boolean }> = ({ gym, onBook, isLarge = false }) => (
  <div className={`col-span-12 ${isLarge ? 'md:col-span-8' : 'md:col-span-4'} bg-white border border-gray-300 group opacity-0 animate-reveal fill-mode-forwards`}>
    {/* Image Container */}
    <div className="relative w-full h-[400px] overflow-hidden bg-gray-200">
      <img
        src={gym.images?.[0] || gym.profilePhoto || 'https://via.placeholder.com/600x400?text=No+Image'}
        alt={gym.name}
        className="w-full h-full object-cover contrast-125 transition-all duration-500"
      />
      {gym.isFlashSale && (
        <div className="absolute top-0 left-0 bg-brand-red text-white font-mono text-xs px-4 py-2 font-bold animate-pulse">
          FLASH SALE -{gym.flashSaleDiscount}%
        </div>
      )}
    </div>

    {/* Info Container */}
    <div className="p-8 relative">
      <div className="absolute -top-5 right-8 bg-brand-blue text-white font-mono font-bold px-6 py-3 text-sm shadow-sm">
        ฿{gym.basePrice} / DAY
      </div>

      <Mono className="text-gray-500 block mb-2">{gym.location}</Mono>
      <h3 className="text-3xl font-black uppercase text-brand-charcoal mb-4 leading-none">{gym.name}</h3>

      <div className="flex gap-2 mb-6 flex-wrap">
        {gym.trainers.slice(0, 2).map(t => (
          <span key={t.id} className="border border-gray-200 px-3 py-1 font-mono text-[10px] uppercase text-gray-500">
            {t.specialty}
          </span>
        ))}
        {isLarge && <span className="border border-gray-200 px-3 py-1 font-mono text-[10px] uppercase text-gray-500">Professional Ring</span>}
      </div>

      <div className="flex justify-end">
        <button onClick={onBook} className="font-mono text-xs font-bold uppercase text-brand-blue hover:text-brand-red border-b-2 border-brand-blue hover:border-brand-red transition-colors pb-1">
          Book Session
        </button>
      </div>
    </div>
  </div>
);

const HomePage: React.FC<{
  user: User | null;
  gyms: Gym[];
  setBookings: any;
  categoryFilter?: 'gym' | 'camp';
  heroImages?: string[];
  currentHeroIndex?: number;
}> = ({ user, gyms, setBookings, categoryFilter, heroImages = [], currentHeroIndex = 0 }) => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Search State
  const [locationInput, setLocationInput] = useState('');
  // const [dateInput, setDateInput] = useState(''); 
  const [disciplineInput, setDisciplineInput] = useState('');

  React.useEffect(() => {
    getAnnouncements().then(setAnnouncements);
  }, []);

  const handleBookClick = (gym: Gym) => {
    navigate(`/booking/${gym.id}`);
  };

  const filteredGyms = gyms.filter(gym => {
    // Only show verified or approved gyms in search results
    if (!gym.isVerified && gym.approvalStatus !== 'approved') return false;

    const matchLocation = gym.location.toLowerCase().includes(locationInput.toLowerCase()) || gym.name.toLowerCase().includes(locationInput.toLowerCase());
    const matchDiscipline = disciplineInput === '' || gym.trainers.some(t => t.specialty.toLowerCase().includes(disciplineInput.toLowerCase()));
    const matchCategory = !categoryFilter || gym.category === categoryFilter;
    return matchLocation && matchDiscipline && matchCategory;
  });

  return (
    <div className="relative pb-20">
      {/* Dynamic Carousel Background */}
      {heroImages.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-[90vh] md:h-[80vh] overflow-hidden -z-10 bg-brand-charcoal">
          {heroImages.map((src, idx) => (
            <div
              key={src}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: currentHeroIndex === idx ? 1 : 0 }}
            >
              <img
                src={src}
                alt={`Hero image ${idx + 1}`}
                className="w-full h-full object-cover scale-105"
              />
              {/* Overlay for text legibility (matches the white theme of the site) */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 relative z-10">
        {/* Hero */}
        <div className="pt-32 lg:pt-44 pb-16 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-end">
          <div>
            <Mono className="text-brand-red block mb-6">Bangkok • Phuket • Chiang Mai</Mono>
            <h1 className="text-[clamp(3.5rem,8vw,8rem)] font-black text-brand-charcoal leading-[0.9] tracking-tight">
              {categoryFilter === 'gym' ? 'ELITE GYMS' : categoryFilter === 'camp' ? 'AUTHENTIC CAMPS' : 'FORGE YOUR'}<br />
              <span className="text-brand-red">{categoryFilter ? 'SELECTION' : 'LEGACY.'}</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button className="bg-brand-red text-white font-black uppercase text-lg px-8 py-4 hover:bg-brand-charcoal transition-colors whitespace-nowrap" onClick={() => {
                const element = document.getElementById('gyms');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}>
                BOOK YOUR TRAINING NOW
              </button>
              <button className="bg-brand-blue text-white font-black uppercase text-lg px-8 py-4 hover:bg-brand-charcoal transition-colors whitespace-nowrap" onClick={() => {
                const element = document.getElementById('gyms');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}>
                EXPLORE GYMS
              </button>
            </div>
            <div className="mt-4 font-mono text-xs text-brand-charcoal opacity-70 flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Verified Gyms | Secure Stripe Payment | Instant Confirmation
            </div>
          </div>
          <div className="font-mono text-sm leading-relaxed border-l-2 border-brand-blue pl-8 text-brand-charcoal opacity-80 mb-4 lg:mb-0">
            The world's most curated platform for authentic Muay Thai training.
            From backyard rings to world-class stadiums.
          </div>
        </div>

        {/* News Ticker / Announcements */}
        {announcements.length > 0 && (
          <div className="mb-12 bg-brand-charcoal text-white p-6 border-l-4 border-brand-red animate-reveal shadow-[8px_8px_0px_0px_#AE3A17]">
            <h3 className="font-black uppercase tracking-widest text-sm mb-4 text-brand-red flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
              Ring Side News
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.slice(0, 3).map((news: any) => (
                <div key={news.id} className="border border-gray-700 p-4 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="font-bold uppercase text-lg mb-2 text-white">{news.title}</div>
                  <p className="font-mono text-xs text-gray-400 leading-relaxed mb-3">
                    {news.content}
                  </p>
                  <div className="text-[10px] font-mono text-brand-blue uppercase">{new Date(news.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Bar Component */}
        <div className="bg-white border-2 border-brand-charcoal grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] shadow-[12px_12px_0px_0px_#3471AE]">
          <BlockInput
            label="Location / Name"
            placeholder="Where do you fight?"
            value={locationInput}
            onChange={(e: any) => setLocationInput(e.target.value)}
          />
          <BlockInput
            label="Discipline"
            placeholder="Muay Thai / Boxing"
            value={disciplineInput}
            onChange={(e: any) => setDisciplineInput(e.target.value)}
          />
          <div className="p-6 border-b md:border-r border-brand-charcoal md:border-gray-200 bg-gray-50 flex flex-col justify-center">
            <label className="block font-mono text-xs text-brand-blue font-bold mb-2 uppercase">RESULTS</label>
            <div className="font-black text-xl">{filteredGyms.length} GYMS FOUND</div>
          </div>
          <button
            className="bg-brand-red text-white font-black uppercase text-lg px-10 py-6 md:py-0 hover:bg-brand-charcoal transition-colors h-full"
            onClick={() => {
              const element = document.getElementById('gyms');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Search
          </button>
        </div>

        {/* How It Works Section */}
        <div className="py-24 border-t-2 border-brand-charcoal/10 mt-20">
          <div className="mb-12 text-center">
            <Mono className="text-brand-blue mb-4">The Process</Mono>
            <h2 className="text-4xl font-black uppercase text-brand-charcoal">How ThaiKicks Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-brand-charcoal/10 -z-10"></div>

            <div className="bg-white border-2 border-brand-charcoal p-8 flex flex-col items-center text-center shadow-[6px_6px_0px_#1A1A1A] relative z-10 transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-brand-charcoal text-white rounded-full flex items-center justify-center font-black text-2xl mb-6 shadow-sm">1</div>
              <h3 className="font-black text-xl uppercase mb-3 text-brand-charcoal">Choose Your Gym</h3>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">Filter by location, discipline, and vibe. From gritty professional camps to modern fitness facilities.</p>
            </div>

            <div className="bg-white border-2 border-brand-charcoal p-8 flex flex-col items-center text-center shadow-[6px_6px_0px_#1A1A1A] relative z-10 transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-brand-red text-white rounded-full flex items-center justify-center font-black text-2xl mb-6 shadow-sm">2</div>
              <h3 className="font-black text-xl uppercase mb-3 text-brand-charcoal">Select Your Date</h3>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">Book your session instantly through our secure gateway. Lock in spots at high-demand camps.</p>
            </div>

            <div className="bg-white border-2 border-brand-charcoal p-8 flex flex-col items-center text-center shadow-[6px_6px_0px_#1A1A1A] relative z-10 transition-transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-brand-blue text-white rounded-full flex items-center justify-center font-black text-2xl mb-6 shadow-sm">3</div>
              <h3 className="font-black text-xl uppercase mb-3 text-brand-charcoal">Train Like A Fighter</h3>
              <p className="font-mono text-xs text-gray-500 leading-relaxed">Receive your instant confirmation barcode. Show up, wrap your hands, and forge your legacy.</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div id="gyms" className="pt-24 pb-12 grid grid-cols-12 gap-y-12 md:gap-x-10">

          {/* Dynamic Cards */}
          {filteredGyms.length > 0 ? (
            filteredGyms.map((gym, index) => (
              <React.Fragment key={gym.id}>
                <GymCard gym={gym} onBook={() => handleBookClick(gym)} isLarge={index === 0} />
                {/* Insert Canvas Block after first item */}
                {index === 0 && (
                  <div className="col-span-12 md:col-span-6 bg-brand-blue text-white p-12 flex flex-col justify-center animate-reveal" style={{ animationDelay: '0.2s' }}>
                    <Mono className="text-brand-bone mb-4">Tradition</Mono>
                    <h2 className="text-5xl font-black mb-6 uppercase text-brand-red">The Art of Eight Limbs</h2>
                    <p className="opacity-90 leading-relaxed max-w-md mb-8">
                      Booking a gym shouldn't be a fight. We connect practitioners with verified camps that respect the lineage of the sport.
                    </p>
                    <a href="#" className="font-mono underline text-sm uppercase">Read Heritage Guide</a>
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="col-span-12 text-center py-20 font-mono text-gray-400 border-2 border-dashed border-gray-300">
              NO GYMS FOUND MATCHING YOUR CRITERIA
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Components ---

const DashboardContainer: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal">
    <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex justify-between items-end">
      <div>
        <Mono className="text-brand-blue">{subtitle}</Mono>
        <h1 className="text-4xl font-black uppercase text-brand-charcoal mt-2">{title}</h1>
      </div>
      <div className="hidden md:block w-20 h-2 bg-brand-red"></div>
    </div>
    {children}
  </div>
);

const BlockTable: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="border-2 border-brand-charcoal bg-white">
    <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-black uppercase tracking-wide text-sm">{title}</h3>
      </div>
      <div className="flex gap-1">
        <Square className="w-3 h-3 text-brand-charcoal fill-current" />
      </div>
    </div>
    <div>{children}</div>
  </div>
);


// Shop Orders Section Component
const ShopOrdersSection: React.FC<{ userId: string }> = ({ userId }) => {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUserOrders();
  }, [userId]);

  const loadUserOrders = async () => {
    try {
      const { getShopOrdersByUser } = await import('./services/shopService');
      const data = await getShopOrdersByUser(userId);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'paid': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono text-sm text-gray-400">LOADING ORDERS...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <div className="font-mono text-sm text-gray-400">NO ORDERS YET</div>
        <a href="#/shop" className="inline-block mt-4 text-brand-blue hover:text-brand-red font-mono text-xs uppercase underline">Browse Shop</a>
      </div>
    );
  }

  return (
    <div className="divide-y-2 divide-gray-100">
      {orders.map(order => {
        const contactDetails = order.contactDetails ? JSON.parse(order.contactDetails) : {};
        return (
          <div key={order.id} className="p-6 hover:bg-brand-bone transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-mono text-xs text-gray-400">Order #{order.id.slice(0, 8)}</div>
                <div className="font-mono text-sm text-gray-600 mt-1">
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black">฿{order.totalAmount.toLocaleString()}</div>
                <span className={`inline-block px-2 py-1 text-xs font-bold uppercase mt-1 ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
            {order.items && order.items.length > 0 && (
              <div className="bg-gray-50 p-3 space-y-1">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between font-mono text-xs text-gray-600">
                    <span>{item.quantity}x Product</span>
                    <span>฿{item.priceAtPurchase.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {order.status === 'pending' && order.paymentStatus !== 'paid' && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-amber-600 uppercase font-bold">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Payment Pending
                </div>
                {order.stripeSessionId && (
                  <button
                    onClick={() => {
                      // Attempt to redirect if we have a session ID
                      // In a real app, you might want to call the edge function to get a fresh URL
                      alert('Please complete the payment on the Stripe page.');
                    }}
                    className="w-full bg-brand-charcoal text-white py-2 px-4 font-mono text-xs uppercase hover:bg-brand-blue transition-colors"
                  >
                    💳 Complete Stripe Payment
                  </button>
                )}
              </div>
            )}

            {order.status === 'paid' && (
              <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-green-600 uppercase font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Payment Verified
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CustomerDashboard: React.FC<{ user: User; bookings: Booking[]; requestAffiliate: () => void }> = ({ user, bookings, requestAffiliate }) => {
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editName, setEditName] = React.useState(user.name);
  const [editAvatar, setEditAvatar] = React.useState(user.avatar || '');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  // Filter bookings for this user
  const myBookings = bookings.filter(b => b.userId === user.id);

  // Sort by date (newest first)
  const sortedBookings = [...myBookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeBookings = sortedBookings.filter(b =>
    (b.status === 'confirmed') && new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const pastBookings = sortedBookings.filter(b =>
    !activeBookings.includes(b)
  );

  const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-gray-200 text-gray-500";
    if (status === 'confirmed') color = "bg-brand-blue text-white";
    if (status === 'completed') color = "bg-green-500 text-white";
    if (status === 'cancelled') color = "bg-red-500 text-white";

    return (
      <span className={`${color} px-2 py-1 font-mono text-[10px] uppercase font-bold`}>
        {status}
      </span>
    );
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const { updateUserProfile, uploadAvatar } = await import('./services/dataService');

      let finalAvatarUrl = editAvatar;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(user.id, avatarFile);
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      await updateUserProfile(user.id, { name: editName, avatar_url: finalAvatarUrl });
      setIsEditingProfile(false);
      setAvatarFile(null);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create a local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardContainer title={`Welcome Back, ${user.name.split(' ')[0]}`} subtitle={`Fighter Dashboard // ID: ${user.id}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">

          {/* Section: Profile Info */}
          <BlockTable title="Personal Information">
            <div className="p-6 bg-white">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 p-3 font-mono text-sm uppercase text-brand-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-gray-500 mb-1">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 overflow-hidden border border-gray-300 shrink-0">
                        <img src={editAvatar || 'https://via.placeholder.com/150'} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full bg-gray-50 border border-gray-200 p-2 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-brand-charcoal file:text-white hover:file:bg-brand-blue file:cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="bg-brand-charcoal text-white px-6 py-3 font-mono text-xs font-bold uppercase hover:bg-brand-blue disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="border border-brand-charcoal text-brand-charcoal px-6 py-3 font-mono text-xs font-bold uppercase hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gray-200 overflow-hidden border border-gray-300 shrink-0 mt-1">
                      <img src={user.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="text-xl font-black uppercase text-brand-charcoal truncate">{user.name}</div>
                        <div className="flex gap-2 items-center mt-1 flex-wrap">
                          <span className="font-mono text-[10px] bg-brand-charcoal text-white px-2 py-0.5 uppercase tracking-wider font-bold shadow-sm">{user.role}</span>
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 border border-gray-200" title={user.id}>ID: <span className="font-bold">{user.id.substring(0, 8)}...</span></span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email Address</label>
                          <div className="font-mono text-xs text-brand-charcoal truncate">{user.email}</div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Password</label>
                          <div className="font-mono text-xs text-brand-charcoal flex items-center justify-between">
                            ••••••••••••
                            <button onClick={() => window.location.hash = '/reset-password'} className="text-[10px] text-brand-blue hover:text-brand-red uppercase underline font-bold">Manage</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="hidden md:block border border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white transition-colors uppercase font-mono text-xs font-bold px-4 py-2 shrink-0"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-6 sm:hidden w-full border border-brand-charcoal py-3 text-brand-charcoal hover:bg-gray-100 uppercase font-mono text-xs font-bold"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </BlockTable>

          {/* Section 1: Active Bookings */}
          <BlockTable title="Active & Upcoming Sessions">
            {activeBookings.length === 0 ? (
              <div className="p-12 text-center font-mono text-sm text-gray-400">NO ACTIVE BOOKINGS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100">
                {activeBookings.map(b => (
                  <div key={b.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-brand-bone transition-colors group">
                    <div className="flex items-center gap-6 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 flex items-center justify-center border-2 border-brand-charcoal font-black text-sm bg-brand-bone text-brand-charcoal`}>
                        {b.type === 'private' ? 'PVT' : 'STD'}
                      </div>
                      <div>
                        <div className="font-black text-lg uppercase leading-none mb-1 group-hover:text-brand-red transition-colors">{b.gymName}</div>
                        <Mono className="text-gray-500">{b.date} • {b.trainerName || 'No Trainer'}</Mono>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold mb-1">฿{b.totalPrice}</div>
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

          {/* Section 2: History */}
          <BlockTable title="Booking History">
            {pastBookings.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-gray-400">NO HISTORY FOUND</div>
            ) : (
              <div className="divide-y-2 divide-gray-100 opacity-80">
                {pastBookings.map(b => (
                  <div key={b.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50">
                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                      <div className="font-mono text-xs text-gray-400 w-24">{b.date}</div>
                      <div className="font-bold text-sm uppercase text-gray-600">{b.gymName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={b.status} />
                      <div className="font-mono text-sm text-gray-400">฿{b.totalPrice}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

          {/* Section 3: Shop Orders */}
          <BlockTable title="My Shop Orders" icon={<ShoppingBag className="w-4 h-4" />}>
            <ShopOrdersSection userId={user.id} />
          </BlockTable>

        </div>

        <div>
          <div className="bg-brand-charcoal text-white p-8 border-2 border-brand-charcoal shadow-[8px_8px_0px_0px_#AE3A17] relative overflow-hidden">
            <Mono className="text-brand-bone opacity-70">Affiliate Network</Mono>

            <div className="mt-8 mb-10 relative z-10">
              <div className="text-5xl font-black mb-2">
                {user.affiliateStatus === 'active' ? `฿${user.affiliateEarnings}` : 'INACTIVE'}
              </div>
              {user.affiliateStatus === 'active' && (
                <div className="text-sm font-mono text-brand-bone opacity-80 mb-4">
                  Pending Payout: ฿0
                </div>
              )}
              <div className="font-mono text-xs text-brand-red mt-2 uppercase font-bold tracking-widest">{user.affiliateStatus} STATUS</div>
            </div>

            {(user.affiliateStatus === 'none' || user.affiliateStatus === 'rejected') && (
              <button
                onClick={requestAffiliate}
                className="w-full bg-white text-brand-charcoal font-black uppercase py-4 hover:bg-brand-blue hover:text-white transition-colors relative z-10"
              >
                {user.affiliateStatus === 'rejected' ? 'Request Again' : 'Join Program'}
              </button>
            )}

            {user.affiliateStatus === 'active' && (
              <div className="relative z-10 mt-4">
                <label className="block text-xs font-mono text-brand-bone mb-2 uppercase opacity-70">Your Affiliate Code</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/30 border border-white/20 p-3 font-mono text-lg font-black text-white tracking-widest uppercase">
                    {user.affiliateCode}
                  </div>
                  <button
                    onClick={() => {
                      const code = user.affiliateCode || '';
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(code).then(() => alert('Code copied!'));
                      } else {
                        // Fallback for non-HTTPS (local network)
                        const el = document.createElement('textarea');
                        el.value = code;
                        el.style.position = 'fixed';
                        el.style.opacity = '0';
                        document.body.appendChild(el);
                        el.focus();
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        alert('Code copied!');
                      }
                    }}
                    className="bg-brand-red text-white font-bold uppercase text-xs px-4 py-3 hover:bg-white hover:text-brand-red border border-brand-red transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] font-mono text-brand-bone opacity-50 mt-2">Enter this code at checkout to earn commission</p>
              </div>
            )}

            {/* Background Pattern */}
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <TrendingUp className="w-48 h-48" />
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};

// Inline OwnerDashboard removed in favor of external component


const App: React.FC = () => {
  /* Auth State */
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Default to loading

  /* App Data */
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); // Start empty, fetch real data
  const [applications, setApplications] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<Product[]>([]); // Added shopProducts state

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // HERO CAROUSEL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [heroImages, setHeroImages] = useState<string[]>([
    // Fallback image if none are loaded from settings
    'https://images.unsplash.com/photo-1599552375107-160de4e511cf?auto=format&fit=crop&q=80'
  ]);

  useEffect(() => {
    if (heroImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  // Initial Data Fetch & Auth Subscription
  React.useEffect(() => {
    let mounted = true;

    // 0. Check for Redirect Hash (Email Confirmation)
    if (window.location.hash && window.location.hash.includes('access_token')) {
      setNotification({ message: "SYSTEM ACCESS GRANTED // EMAIL VERIFIED", type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    }

    // Handle Password Recovery Event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Redirect to reset password page is handled via HashRouter generally, 
        // but we can force it here if base URL landed on home.
        // However, since we are using HashRouter, the link from email usually points to /#access_token=...
        // Supabase automatically sets the session. We just need to detect we want to show the reset page.
        // A simple way is to check the URL hash or let the user navigate, but for UX:
        // We'll let the router handle a specific route '/reset-password' if we set up the email template to point there?
        // OR we just rely on the user being logged in and maybe a special query param?
        // Standard Supabase flow: Click Link -> App Opens -> 'PASSWORD_RECOVERY' event fires.
        // So we should navigate to /reset-password
        // Since we are outside Router context here (in App functional component but not under <Routes>), 
        // we can't use useNavigate easily unless we restructure.
        // BUT App IS inside HashRouter in the return but fetch logic is here.
        // Actually, App is INSIDE HashRouter? No, HashRouter is inside App return.
        // Wait, <HashRouter> is WRAPPING the content of App.
        // So `useNavigate` can't be used at top level of App.

        // Fix: We'll change the window location hash manualy
        window.location.hash = '/reset-password';
      }
    });

    // 0.5. Realtime Profile Sync (The "Pro" feature)
    let profileSubscription: any = null;

    const setupProfileSubscription = (userId: string) => {
      // Clean up previous sub if any
      if (profileSubscription) supabase.removeChannel(profileSubscription);

      profileSubscription = supabase
        .channel('public:users')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log("Realtime: User Profile Updated!", payload);
            // Re-fetch clean user data when DB changes
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session) handleUserUpdate(session);
            });
          }
        )
        .subscribe();
    };

    // 1. Fetch Gyms
    const fetchGyms = async () => {
      const data = await getGyms();
      if (mounted) setGyms(data);
    };
    fetchGyms();

    // 2. Auth Logic (Merged)
    const handleUserUpdate = async (session: any, forceUpdate = false) => {
      if (!session?.user) {
        // Don't clear user state unless it's a forced update (actual logout)
        // This prevents clearing state during token refresh
        if (forceUpdate && mounted) {
          setActiveUser(null);
          setBookings([]);
          setIsAuthChecking(false);
        } else if (mounted) {
          // Just mark auth checking as done, keep existing user
          setIsAuthChecking(false);
        }
        return;
      }

      const basicUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.email?.split('@')[0] || 'Member',
        role: 'customer',
        avatar: 'https://via.placeholder.com/150',
        isAffiliate: false,
        affiliateEarnings: 0,
        affiliateStatus: 'none'
      };

      // Only set basicUser if we don't have an activeUser yet (initial load)
      // This prevents role flickering when tab regains focus
      if (mounted && !activeUser) {
        setActiveUser(basicUser);
        setupProfileSubscription(session.user.id);
      } else if (mounted && activeUser.id !== session.user.id) {
        // Different user logged in, update
        setActiveUser(basicUser);
        setupProfileSubscription(session.user.id);
      }

      try {
        // Parallel: Fetch Profile + Fetch Bookings
        const [fullUser, userBookings] = await Promise.all([
          getCurrentUser(),
          getUserBookings(session.user.id)
        ]);

        if (mounted) {
          let bookingsToShow = userBookings;

          if (fullUser) {
            setActiveUser(fullUser);
            // If Admin, fetch all applications & ALL bookings
            // If Admin OR Owner (Super User), fetch all applications & ALL bookings for now
            if (fullUser.role === 'admin' || fullUser.role === 'owner') {
              bookingsToShow = await getAllBookings();
              getAffiliateApplications().then(apps => {
                if (mounted) setApplications(apps);
              });
            }
            // Logic for specific "Gym Owner" scoped dashboard disabled temporarily as per request
            /* 
            else if (fullUser.role === 'owner') {
               const latestGyms = await getGyms();
               const myGym = latestGyms.find(g => g.ownerId === fullUser.id);
               if (myGym) {
                  bookingsToShow = await getGymBookings(myGym.id);
               }
            }
            */
          }
          setBookings(bookingsToShow);
          const { getProducts } = await import('./services/shopService');
          getProducts().then(prods => setShopProducts(prods || [])).catch(console.error);

          // Load dynamic hero images
          const heroSetting = await getSystemSetting('hero_images');
          if (heroSetting) {
            try {
              const urls = JSON.parse(heroSetting);
              if (Array.isArray(urls) && urls.length > 0) {
                setHeroImages(urls);
              }
            } catch (e) {
              console.error("Failed to parse hero_images", e);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load user data", err);
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    };



    // Initialize
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserUpdate(session);
    });

    // Listen for changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle significant auth events, ignore token refresh
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        handleUserUpdate(session, false);
      } else if (event === 'SIGNED_OUT') {
        handleUserUpdate(session, true); // Force clear on logout
      }
      // TOKEN_REFRESHED events are ignored to prevent unnecessary re-renders and redirects
    });

    // Clean up subscription
    return () => {
      mounted = false;
      subscription.unsubscribe();
      authListener.subscription.unsubscribe();
      if (profileSubscription) supabase.removeChannel(profileSubscription);
    };
  }, []);


  const handleUpdateGym = (updatedGym: Gym) => {
    setGyms(gyms.map(g => g.id === updatedGym.id ? updatedGym : g));
  };

  const handleAffiliateRequest = async () => {
    if (!activeUser) return;
    try {
      await createAffiliateApplication(activeUser.id, "Requested via dashboard");
      setActiveUser({ ...activeUser, affiliateStatus: 'pending' });
      alert("APPLICATION SUBMITTED");
    } catch (error) {
      console.error("Affiliate request failed", error);
      alert("Error submitting application");
    }
  };

  const handleAffiliateApproval = async (appId: string, approved: boolean) => {
    try {
      // 1. Update Application Status
      const status = approved ? 'approved' : 'rejected';
      const app = await updateAffiliateApplicationStatus(appId, status);

      // 2. Update Local State (Remove from pending list)
      setApplications(applications.filter(a => a.id !== appId));

      // 3. Update User Status if Approved
      if (approved) {
        const userId = app.user_id; // From DB return
        // Generate a simple code: First name + random number
        // We need to fetch the user name or just use a random code for now if name not available easily here
        // But actually getAffiliateApplications returns user name. 
        // Let's assume we can generate a code.
        const code = `fighter${Math.floor(Math.random() * 10000)}`;

        await updateUserAffiliateStatus(userId, true, 'active', code);
      } else {
        await updateUserAffiliateStatus(app.user_id, false, 'rejected'); // Update status to rejected
      }

    } catch (error) {
      console.error("Approval failed", error);
      alert("Action failed");
    }
  };

  // -- LOADING SCREEN --
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F9F9]">
        <div className="font-black text-3xl text-brand-charcoal animate-pulse">
          <img src="/tk-logo.png" alt="Thaikick" className="h-16 w-auto object-contain" />
        </div>
        <Mono className="text-brand-blue mt-4">Authenticating...</Mono>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <AffiliateTracker />
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
        <Navbar activeUser={activeUser} onLogout={() => setActiveUser(null)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage user={activeUser} gyms={gyms} setBookings={setBookings} heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/gyms" element={<HomePage user={activeUser} gyms={gyms} setBookings={setBookings} categoryFilter="gym" heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/camps" element={<HomePage user={activeUser} gyms={gyms} setBookings={setBookings} categoryFilter="camp" heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/booking/:gymId" element={<BookingPage gyms={gyms} user={activeUser} setBookings={setBookings} />} />
            <Route path="/dashboard" element={activeUser?.role === 'customer' ? <CustomerDashboard user={activeUser} bookings={bookings} requestAffiliate={handleAffiliateRequest} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/owner" element={activeUser?.role === 'owner' ? <OwnerDashboard user={activeUser} gyms={gyms} updateGym={handleUpdateGym} bookings={bookings} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/admin" element={activeUser?.role === 'admin' ? <AdminDashboard bookings={bookings} applications={applications} handleApprove={handleAffiliateApproval} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/analytics" element={(activeUser?.role === 'admin' || activeUser?.role === 'owner') ? <AnalyticsDashboard bookings={bookings} /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} heroImages={heroImages} currentHeroIndex={currentHeroIndex} />} />
            <Route path="/shop" element={<ShopPage user={activeUser} />} />
            <Route path="/tickets" element={<TicketingPage user={activeUser} />} />
            <Route path="/checkout" element={<CheckoutPage user={activeUser} />} />
            <Route path="/checkout-success" element={<CheckoutSuccessPage />} />
            <Route path="/shop-admin" element={(activeUser?.role === 'admin' || activeUser?.role === 'owner') ? <ShopAdminPage /> : <HomePage user={activeUser} gyms={gyms} setBookings={setBookings} />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<LegalPage title="Privacy Policy" />} />
            <Route path="/terms-of-service" element={<LegalPage title="Terms of Service" />} />
            <Route path="/refund-policy" element={<LegalPage title="Refund Policy" />} />
            <Route path="/cancellation-policy" element={<LegalPage title="Cancellation Policy" />} />

            {/* 404 Catch All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Verified by ThaiKicks Trust Badge */}
        < div className="bg-brand-blue py-12 border-y-2 border-brand-charcoal" >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-white text-center sm:text-left">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shrink-0 shadow-[4px_4px_0px_#1A1A1A]">
              <svg className="w-8 h-8 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-wide">Verified by ThaiKicks</h3>
              <p className="font-mono text-sm opacity-80 mt-1 max-w-xl">Every camp on our platform goes through a rigorous on-site verification process to ensure authentic training, safe environments, and fair pricing.</p>
            </div>
          </div>
        </div >

        <footer className="bg-brand-charcoal text-white py-24">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-10 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center gap-1 mb-6">
                <img src="/tk-logo.png" alt="Thaikick" className="h-10 w-auto object-contain" />
              </Link>
              <p className="font-mono text-sm opacity-50 max-w-xs leading-relaxed">
                Standardizing the Muay Thai experience for the global community.
                Built with respect for the tradition.
              </p>
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6 text-brand-bone">Regions</h4>
              <ul className="font-mono text-sm opacity-60 space-y-3">
                <li>Central Thailand</li>
                <li>Isaan Region</li>
                <li>Southern Islands</li>
                <li>Northern Highlands</li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold uppercase mb-6 text-brand-bone">Support & Legal</h4>
              <ul className="font-mono text-sm opacity-60 space-y-3">
                <li><Link to="/privacy-policy" className="hover:text-brand-red transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-brand-red transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-brand-red transition-colors">Refund Policy</Link></li>
                <li><Link to="/cancellation-policy" className="hover:text-brand-red transition-colors">Cancellation Policy</Link></li>
                <li><Link to="/contact" className="hover:text-brand-red transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
        </footer>

        <Chatbot />
        <CookieBanner />

      </div >
    </HashRouter >
  );
};

export default App;