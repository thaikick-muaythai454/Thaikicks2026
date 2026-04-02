import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, Users, DollarSign, Activity, Megaphone, Trash2, Edit, Plus, UserPlus, Calendar, Clock, BookOpen, Layers, ShoppingBag, Package, RotateCcw } from 'lucide-react';
import { USERS } from '../lib/auth-data';
import { Booking, AffiliateApplication, Announcement, Gym, Trainer, TrainerSchedule, User, Course, Product } from '../lib/types';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, createGym, updateGym, deleteGym, getGyms, createTrainer, deleteTrainer, getTrainerSchedules, createTrainerSchedule, deleteTrainerSchedule, getAllUsers, getCourses, createCourse, updateCourse, deleteCourse, getSystemSetting, updateSystemSetting, updateUserRole, getAffiliateApplications, updateAffiliateApplicationStatus, updateUserAffiliateStatus, updateGymApprovalStatus } from '../services/dataService';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/shopService';
import ProductManagement from './ProductManagement';
import EventManagement from './EventManagement';

const DEFAULT_PRIVACY_TEXT = `**Effective Date:** January 1, 2026

This page contains the official documentation for our Privacy Policy. We take your data security and privacy seriously.

## USER DATA DELETION

At ThaiKicks, we respect your right to privacy and control over your personal data. If you wish to delete your account and all associated data, you can do so by:

- **Email Request:** Send an email to support@thaikicks.com with the subject "Data Deletion Request". Please include your registered email address.
- **Verification:** For security purposes, we will verify your identity before processing the deletion.
- **Timeframe:** Data deletion requests are typically processed within 7-14 business days. Once deleted, your account history, bookings, and profile information cannot be recovered.

Please check back soon for the full terms and conditions governing the use of the THAIKICKS platform and booking system.

For any immediate legal inquiries, please contact our support team at legal@thaikicks.com.`;

const DEFAULT_GENERIC_TEXT = `**Effective Date:** January 1, 2026

This page contains the official documentation. We take your data security and privacy seriously.

Please check back soon for the full terms and conditions governing the use of the THAIKICKS platform and booking system.

For any immediate legal inquiries, please contact our support team at legal@thaikicks.com.`;

interface AdminDashboardProps {
  gyms: Gym[];
  setGyms: (gyms: Gym[]) => void;
  bookings: Booking[];
  applications?: AffiliateApplication[];
  handleApprove?: (id: string, ok: boolean) => void;
}

// Internal Sub-components
const BlockTable: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = "" }) => (
  <div className={`border-2 border-brand-charcoal bg-white flex flex-col ${className}`}>
    <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center shrink-0">
      <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-brand-charcoal"></div>
        <div className="w-2 h-2 border border-brand-charcoal"></div>
      </div>
    </div>
    <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
  </div>
);

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
    {children}
  </span>
);

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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ gyms, setGyms, bookings }) => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // const [gyms, setGyms] = useState<Gym[]>([]); // Removed: Using prop from App.tsx instead
  const [editingGym, setEditingGym] = useState<Partial<Gym> | null>(null);
  const [isGymFormOpen, setIsGymFormOpen] = useState(false);

  // Trainer Form State
  const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({ name: '', specialty: '', pricePerSession: 500, image: '' });

  // Schedule Management State
  const [managingScheduleFor, setManagingScheduleFor] = useState<Trainer | null>(null);
  const [trainerSchedules, setTrainerSchedules] = useState<TrainerSchedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<{ day: string; start: string; end: string }>({ day: 'Monday', start: '09:00', end: '10:00' });

  // Attendance Check State
  const [attendanceDate, setAttendanceDate] = useState<string>(''); // Default empty = All
  const [attendanceGymId, setAttendanceGymId] = useState<string>('all');

  // Course Management State
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCourseFormOpen, setIsCourseFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course>>({ designData: { modules: [] } });

  // Settings State
  const [promptPayNumber, setPromptPayNumber] = useState("");
  const [legalPrivacyPolicy, setLegalPrivacyPolicy] = useState("");
  const [legalTermsOfService, setLegalTermsOfService] = useState("");
  const [legalRefundPolicy, setLegalRefundPolicy] = useState("");
  const [legalCancellationPolicy, setLegalCancellationPolicy] = useState("");
  const [legalContact, setLegalContact] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Shop/Product State
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  // Appearance State
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [heroFilterEnabled, setHeroFilterEnabled] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'gyms' | 'announcements' | 'bookings' | 'courses' | 'shop' | 'appearance' | 'settings' | 'refunds'>('overview');

  // Refund Requests State
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [refundPolicyText, setRefundPolicyText] = useState('');
  const [refundAdminResponse, setRefundAdminResponse] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSettings = async () => {
      const number = await getSystemSetting('promptpay_number');
      if (number) setPromptPayNumber(number);

      const ppSetting = await getSystemSetting('legal_privacy_policy');
      setLegalPrivacyPolicy(ppSetting || DEFAULT_PRIVACY_TEXT);
      const tosSetting = await getSystemSetting('legal_terms_of_service');
      setLegalTermsOfService(tosSetting || DEFAULT_GENERIC_TEXT);
      const rpSetting = await getSystemSetting('legal_refund_policy');
      setLegalRefundPolicy(rpSetting || DEFAULT_GENERIC_TEXT);
      const cpSetting = await getSystemSetting('legal_cancellation_policy');
      setLegalCancellationPolicy(cpSetting || DEFAULT_GENERIC_TEXT);
      const contactSetting = await getSystemSetting('legal_contact');
      setLegalContact(contactSetting || DEFAULT_GENERIC_TEXT);

      const heroSetting = await getSystemSetting('hero_images');
      if (heroSetting) {
        try {
          // It's saved as a JSON string
          setHeroImages(JSON.parse(heroSetting));
        } catch (e) {
          console.error("Failed to parse hero_images", e);
        }
      }

      const filterSetting = await getSystemSetting('hero_filter_enabled');
      if (filterSetting !== null) {
        setHeroFilterEnabled(filterSetting !== 'false');
      }
    };

    loadSettings();
    loadAnnouncements();
    loadGyms();
    loadUsers();
    loadCourses();
    loadProducts();
    loadApplications();
    loadRefundRequests();
  }, []);

  const loadRefundRequests = async () => {
    try {
      const { getAllRefundRequests, getSystemSetting } = await import('../services/dataService');
      const data = await getAllRefundRequests();
      setRefundRequests(data);
      const policy = await getSystemSetting('refund_policy');
      if (policy) setRefundPolicyText(policy);
    } catch (err) {
      console.error('Failed to load refund requests', err);
    }
  };

  const handleRefundAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      const { updateRefundRequestStatus } = await import('../services/dataService');
      await updateRefundRequestStatus(requestId, action, refundAdminResponse[requestId] || '');
      await loadRefundRequests();
    } catch (err: any) {
      alert('Failed: ' + (err.message || String(err)));
    }
  };

  const handleSaveRefundPolicy = async () => {
    try {
      await updateSystemSetting('refund_policy', refundPolicyText);
      alert('Refund policy saved successfully');
    } catch (err: any) {
      alert('Failed: ' + (err.message || String(err)));
    }
  };

  const loadApplications = async () => {
    const data = await getAffiliateApplications();
    setApplications(data);
  };

  const handleApprove = async (appId: string, ok: boolean) => {
    const status = ok ? 'approved' : 'rejected';
    try {
      const app = applications.find(a => a.id === appId);
      await updateAffiliateApplicationStatus(appId, status);
      if (ok && app) {
        const code = `fighter${Math.floor(Math.random() * 10000)}`;
        await updateUserAffiliateStatus(app.userId, true, 'active', code);
      } else if (!ok && app) {
        await updateUserAffiliateStatus(app.userId, false, 'rejected');
      }
      // Refresh list
      await loadApplications();
    } catch (err) {
      console.error('Failed to update affiliate status', err);
    }
  };

  const loadCourses = async () => {
    const data = await getCourses();
    setCourses(data);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse.title || !editingCourse.gymId) return alert("Title and Gym are required");

    try {
      if (editingCourse.id) {
        await updateCourse(editingCourse.id, editingCourse);
      } else {
        await createCourse(editingCourse);
      }
      setIsCourseFormOpen(false);
      setEditingCourse({ designData: { modules: [] } });
      await loadCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to save course");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    try {
      await deleteCourse(id);
      await loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  const loadGyms = async () => {
    const data = await getGyms();
    setGyms(data);
  };

  const handleSaveGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGym) return;

    try {
      if (editingGym.id) {
        await updateGym(editingGym.id, editingGym);
      } else {
        await createGym(editingGym);
      }
      setIsGymFormOpen(false);
      setEditingGym(null);
      await loadGyms();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save gym: " + (err.message || String(err)));
    }
  };

  const handleDeleteGym = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gym?")) return;
    try {
      await deleteGym(id);
      await loadGyms();
    } catch (err) {
      console.error(err);
      alert("Failed to delete gym");
    }
  };

  const handleAddTrainer = async () => {
    if (!editingGym?.id || !newTrainer.name || !newTrainer.specialty) return alert("Fill in name and specialty");
    try {
      await createTrainer({ ...newTrainer, gymId: editingGym.id });
      setNewTrainer({ name: '', specialty: '', pricePerSession: 500, image: '' }); // Reset
      const updatedGyms = await getGyms();
      const currentGym = updatedGyms.find(g => g.id === editingGym.id);
      if (currentGym) setEditingGym(currentGym);
    } catch (err) {
      console.error(err);
      alert("Failed to add trainer");
    }
  };

  const handleDeleteTrainer = async (trainerId: string) => {
    if (!confirm("Remove this trainer?")) return;
    try {
      await deleteTrainer(trainerId);
      await loadGyms();
      const updatedGyms = await getGyms();
      if (editingGym?.id) {
        const currentGym = updatedGyms.find(g => g.id === editingGym.id);
        if (currentGym) setEditingGym(currentGym);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openScheduleManager = async (trainer: Trainer) => {
    setManagingScheduleFor(trainer);
    const schedules = await getTrainerSchedules(trainer.id);
    setTrainerSchedules(schedules);
  };

  const handleAddSchedule = async () => {
    if (!managingScheduleFor) return;
    try {
      await createTrainerSchedule({
        trainerId: managingScheduleFor.id,
        dayOfWeek: newSchedule.day,
        startTime: newSchedule.start,
        endTime: newSchedule.end
      });
      const schedules = await getTrainerSchedules(managingScheduleFor.id);
      setTrainerSchedules(schedules);
    } catch (err) {
      console.error(err);
      alert("Failed to add schedule");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!managingScheduleFor) return;
    try {
      await deleteTrainerSchedule(id);
      const schedules = await getTrainerSchedules(managingScheduleFor.id);
      setTrainerSchedules(schedules);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setIsSettingsLoading(true);
    try {
      await updateSystemSetting('promptpay_number', promptPayNumber);
      await updateSystemSetting('legal_privacy_policy', legalPrivacyPolicy);
      await updateSystemSetting('legal_terms_of_service', legalTermsOfService);
      await updateSystemSetting('legal_refund_policy', legalRefundPolicy);
      await updateSystemSetting('legal_cancellation_policy', legalCancellationPolicy);
      await updateSystemSetting('legal_contact', legalContact);
      alert("Settings saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    const data = await getAnnouncements();
    setAnnouncements(data);
  };

  const handlePostNews = async () => {
    if (!newsTitle || !newsContent) return alert("Fill in all fields");
    setIsPosting(true);
    try {
      await createAnnouncement(newsTitle, newsContent);
      setNewsTitle("");
      setNewsContent("");
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Failed to post news");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    try {
      await deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      if (editingProduct.id) {
        await updateProduct(editingProduct.id, editingProduct);
      } else {
        await createProduct(editingProduct as Omit<Product, 'id' | 'createdAt'>);
      }
      await loadProducts();
      setIsProductFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };

  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingHero(true);
    try {
      const { uploadImage } = await import('../services/dataService');
      const url = await uploadImage('public-images', file);
      if (url) {
        const updatedImages = [...heroImages, url];
        setHeroImages(updatedImages);
        await updateSystemSetting('hero_images', JSON.stringify(updatedImages));
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to upload hero image: " + (err.message || String(err)));
    } finally {
      setIsUploadingHero(false);
      e.target.value = '';
    }
  };

  const handleDeleteHeroImage = async (index: number) => {
    if (!confirm("Are you sure you want to remove this hero image?")) return;
    try {
      const updatedImages = [...heroImages];
      updatedImages.splice(index, 1);
      setHeroImages(updatedImages);
      await updateSystemSetting('hero_images', JSON.stringify(updatedImages));
    } catch (err: any) {
      console.error(err);
      alert("Failed to remove hero image: " + (err.message || String(err)));
    }
  };
  
  const [isRefunding, setIsRefunding] = useState<string | null>(null);
  const handleRefund = async (bookingId: string) => {
    if (!confirm("Are you sure you want to REFUND this transaction? This will refund the full amount associated with this payment intent in Stripe.")) return;
    
    setIsRefunding(bookingId);
    try {
      const { supabase } = await import('../lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('stripe-refund', {
        headers,
        body: { bookingId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      alert(`Refund successful! Refund ID: ${data.refundId}`);
      // Refresh bookings via some mechanism or just reload
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      alert("Refund failed: " + (err.message || String(err)));
    } finally {
      setIsRefunding(null);
    }
  };

  const [filterDateFrom, setFilterDateFrom] = React.useState('');
  const [filterDateTo, setFilterDateTo] = React.useState('');
  const [filterGymId, setFilterGymId] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('confirmed'); // Start with confirmed as default

  const filteredBookings = bookings.filter(b => {
    const matchFrom = !filterDateFrom || b.date >= filterDateFrom;
    const matchTo = !filterDateTo || b.date <= filterDateTo;
    const matchGym = filterGymId === 'all' || b.gymId === filterGymId;
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchFrom && matchTo && matchGym && matchStatus;
  });

  // Revenue should ONLY reflect Paid/Confirmed bookings to avoid misleading stats
  const paidBookings = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = paidBookings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
  const totalNet = totalRevenue - totalCommission;

  type GymPerf = { name: string; bookings: number; revenue: number; commission: number };
  const gymPerformance = filteredBookings.reduce((acc: Record<string, GymPerf>, b) => {
    if (!acc[b.gymId]) acc[b.gymId] = { name: b.gymName, bookings: 0, revenue: 0, commission: 0 };
    acc[b.gymId].bookings += 1;
    acc[b.gymId].revenue += b.totalPrice;
    acc[b.gymId].commission += b.commissionAmount || 0;
    return acc;
  }, {} as Record<string, GymPerf>);
  const gymPerfList: GymPerf[] = (Object.values(gymPerformance) as GymPerf[]).sort((a, b) => b.revenue - a.revenue);

  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push(['Booking ID', 'Date', 'Type', 'Status', 'Gym Name', 'User Name', 'Trainer', 'Total (฿)', 'Commission (฿)', 'Net (฿)'].join(','));
    filteredBookings.forEach(b => {
      rows.push([
        b.id,
        b.date,
        b.type,
        b.status,
        `"${b.gymName}"`,
        `"${b.userName}"`,
        `"${b.trainerName || '-'}"`,
        b.totalPrice,
        b.commissionAmount || 0,
        b.totalPrice - (b.commissionAmount || 0)
      ].join(','));
    });
    rows.push('');
    rows.push(['SUMMARY', '', '', '', '', '', '', '', '', ''].join(','));
    rows.push(['Total Revenue', '', '', '', '', '', '', totalRevenue, '', ''].join(','));
    rows.push(['Total Commission Payable', '', '', '', '', '', '', totalCommission, '', ''].join(','));
    rows.push(['Net Revenue', '', '', '', '', '', '', totalNet, '', ''].join(','));

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thaikick_report_${filterDateFrom || 'all'}_to_${filterDateTo || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal min-h-[80vh]">
      <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <Mono className="text-brand-blue">System Administration</Mono>
          <h1 className="text-3xl md:text-4xl font-black uppercase text-brand-charcoal mt-2">Overseer Console</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase w-fit">
          <Shield className="w-4 h-4" />
          Master Access
        </div>
      </div>

      <div className="mb-12 border-2 border-brand-charcoal bg-white shadow-[8px_8px_0px_0px_#1A1A1A]">
        <div className="p-5 border-b-2 border-brand-charcoal bg-brand-bone flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-brand-red animate-pulse" />
            <div>
              <div className="font-black uppercase text-sm">Revenue & Booking Report</div>
              <div className="font-mono text-[10px] text-gray-500">{filteredBookings.length} bookings matching filters</div>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-brand-charcoal text-white px-5 py-2 font-mono text-xs font-bold uppercase hover:bg-brand-blue transition-colors"
          >
            <Package className="w-3 h-3" /> Export CSV
          </button>
        </div>

        <div className="p-5 border-b border-gray-100 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">From Date</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="w-full border border-gray-200 p-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">To Date</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="w-full border border-gray-200 p-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Gym</label>
            <select value={filterGymId} onChange={e => setFilterGymId(e.target.value)} className="w-full border border-gray-200 p-2 font-mono text-xs bg-white">
              <option value="all">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full border border-gray-200 p-2 font-mono text-xs bg-white">
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-y-2 md:divide-y-0 divide-brand-charcoal/10 border-b border-gray-100">
          <div className="p-5">
            <Mono className="text-gray-400">Total Bookings</Mono>
            <div className="text-3xl font-black mt-1">{filteredBookings.length}</div>
          </div>
          <div className="p-5">
            <Mono className="text-brand-blue">Revenue</Mono>
            <div className="text-3xl font-black mt-1">฿{totalRevenue.toLocaleString()}</div>
          </div>
          <div className="p-5">
            <Mono className="text-brand-red">Commission Payable</Mono>
            <div className="text-3xl font-black mt-1 text-brand-red">฿{totalCommission.toLocaleString()}</div>
          </div>
          <div className="p-5 bg-brand-charcoal text-white">
            <Mono className="text-brand-bone opacity-70">Net Revenue</Mono>
            <div className="text-3xl font-black mt-1">฿{totalNet.toLocaleString()}</div>
          </div>
        </div>

        <div className="p-5">
          <div className="font-mono text-xs uppercase font-bold text-gray-400 mb-3">Gym Performance</div>
          {gymPerfList.length === 0 ? (
            <div className="text-center font-mono text-xs text-gray-400 py-8">No booking data for selected filters</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {gymPerfList.map(gym => (
                <div key={gym.name} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="font-bold text-sm uppercase truncate">{gym.name}</div>
                    <span className="font-mono text-[10px] text-gray-400 shrink-0">{gym.bookings} bookings</span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 text-right font-mono text-xs">
                    <div><div className="text-gray-400">Revenue</div><div className="font-bold">฿{gym.revenue.toLocaleString()}</div></div>
                    <div><div className="text-brand-red">Commission</div><div className="font-bold text-brand-red">฿{gym.commission.toLocaleString()}</div></div>
                    <div><div className="text-gray-400">Net</div><div className="font-bold">฿{(gym.revenue - gym.commission).toLocaleString()}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'overview' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Activity className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setActiveTab('gyms')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'gyms' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Layers className="w-4 h-4" /> Gym Inventory
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'announcements' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Megaphone className="w-4 h-4" /> Broadcast News
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'bookings' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Calendar className="w-4 h-4" /> Manage Bookings
          </button>
          <button onClick={() => navigate('/admin/users')} className="w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 bg-gray-50 text-gray-600 hover:bg-brand-red hover:text-white">
            <Users className="w-4 h-4" /> User Management
          </button>
          <button onClick={() => setActiveTab('courses')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'courses' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen className="w-4 h-4" /> Courses
          </button>
          <button onClick={() => setActiveTab('shop')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'shop' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <ShoppingBag className="w-4 h-4" /> Shop
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'appearance' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Plus className="w-4 h-4" /> Appearance
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'settings' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <Plus className="w-4 h-4" /> Settings
          </button>
          <button onClick={() => setActiveTab('refunds')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'refunds' ? 'bg-brand-red text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
            <RotateCcw className="w-4 h-4" /> Refund Requests
            {refundRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-brand-red text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {refundRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </aside>

        <div className="flex-1 min-w-0 space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <EventManagement />
              {applications.length > 0 && (
                <BlockTable title="Affiliate Requests" icon={<UserPlus className="w-4 h-4" />}>
                  <div className="p-4 space-y-4">
                    {applications.map(app => (
                      <div key={app.id} className="p-4 border border-gray-200 bg-gray-50">
                        <div className="font-bold text-sm uppercase mb-1">{app.userName}</div>
                        <p className="text-xs font-mono text-gray-500 mb-3">{app.reason}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(app.id, true)} className="bg-green-600 text-white px-3 py-1 text-[10px] font-bold uppercase">Approve</button>
                          <button onClick={() => handleApprove(app.id, false)} className="bg-red-600 text-white px-3 py-1 text-[10px] font-bold uppercase">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </BlockTable>
              )}
            </div>
          )}

          {activeTab === 'gyms' && (
            <BlockTable title="Gym Inventory" icon={<Layers className="w-4 h-4" />}>
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="font-mono text-xs text-gray-500">{gyms.length} Active Listings</span>
                <button onClick={() => { setEditingGym({}); setIsGymFormOpen(true); }} className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue">
                  <Plus className="w-3 h-3" /> Add Gym
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {gyms.map(gym => (
                   <div key={gym.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-bold text-sm uppercase flex items-center gap-2">
                        {gym.name}
                        {gym.approvalStatus === 'approved' ? (
                          <span className="bg-green-100 text-green-700 text-[8px] px-2 py-0.5 rounded-full font-black border border-green-200">APPROVED</span>
                        ) : gym.approvalStatus === 'rejected' ? (
                          <span className="bg-red-100 text-red-700 text-[8px] px-2 py-0.5 rounded-full font-black border border-red-200">REJECTED</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 text-[8px] px-2 py-0.5 rounded-full font-black border border-yellow-200 uppercase">Pending</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono uppercase">{gym.location} • {gym.category}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingGym(gym); setIsGymFormOpen(true); }} className="p-2 text-gray-400 hover:text-brand-blue"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteGym(gym.id)} className="p-2 text-gray-400 hover:text-brand-red"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </BlockTable>
          )}

          {activeTab === 'announcements' && (
             <BlockTable title="Broadcast News" icon={<Megaphone className="w-4 h-4" />}>
              <div className="p-6 border-b-2 border-gray-100 bg-gray-50">
                <input className="w-full bg-white border border-gray-300 p-3 mb-2 font-mono text-sm" placeholder="HEADLINE..." value={newsTitle} onChange={e => setNewsTitle(e.target.value)} />
                <textarea className="w-full bg-white border border-gray-300 p-3 mb-4 font-mono text-sm h-20" placeholder="Announcement content..." value={newsContent} onChange={e => setNewsContent(e.target.value)}></textarea>
                <button onClick={handlePostNews} disabled={isPosting} className="w-full bg-brand-charcoal text-white font-bold uppercase py-3 hover:bg-brand-blue transition-colors disabled:opacity-50">
                  {isPosting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {announcements.map(a => (
                  <div key={a.id} className="p-4 flex justify-between items-start">
                    <div>
                      <div className="font-black uppercase text-sm">{a.title}</div>
                      <p className="text-[10px] text-gray-400 font-mono">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDeleteNews(a.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </BlockTable>
          )}

          {activeTab === 'bookings' && (
            <BlockTable title="Booking Management" icon={<Calendar className="w-4 h-4" />}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-4 text-left font-mono text-[10px] uppercase text-gray-400">Date/ID</th>
                      <th className="p-4 text-left font-mono text-[10px] uppercase text-gray-400">Customer</th>
                      <th className="p-4 text-left font-mono text-[10px] uppercase text-gray-400">Gym/Type</th>
                      <th className="p-4 text-left font-mono text-[10px] uppercase text-gray-400">Total</th>
                      <th className="p-4 text-left font-mono text-[10px] uppercase text-gray-400">Status</th>
                      <th className="p-4 text-center font-mono text-[10px] uppercase text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.length === 0 ? (
                      <tr><td colSpan={6} className="p-12 text-center font-mono text-xs text-gray-400">NO BOOKINGS MATCHING FILTERS</td></tr>
                    ) : (
                      filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-brand-bone transition-colors group">
                          <td className="p-4">
                            <div className="font-bold text-xs uppercase">{b.date}</div>
                            <div className="font-mono text-[9px] text-gray-400">#{b.id.slice(0, 8)}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-xs uppercase">{b.userName}</div>
                            <div className="font-mono text-[9px] text-gray-400">{b.userEmail || 'no-email@thaikicks.com'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-xs uppercase">{b.gymName}</div>
                            <div className="font-mono text-[9px] text-gray-500 uppercase">{b.type}</div>
                          </td>
                          <td className="p-4 font-mono text-sm font-bold">฿{b.totalPrice.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-sm ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                              b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {b.status === 'confirmed' && (
                              <button 
                                onClick={() => handleRefund(b.id)}
                                disabled={isRefunding === b.id}
                                className="flex items-center gap-1 mx-auto bg-brand-red text-white px-3 py-1 text-[10px] font-bold uppercase hover:bg-brand-charcoal transition-colors disabled:opacity-50"
                                title="Refund this payment"
                              >
                                {isRefunding === b.id ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                Refund
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </BlockTable>
          )}

          {activeTab === 'courses' && (
             <BlockTable title="Course Curriculum" icon={<BookOpen className="w-4 h-4" />}>
               <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="font-mono text-xs text-gray-500">{courses.length} Active Courses</span>
                <button onClick={() => { setEditingCourse({ designData: { modules: [] } }); setIsCourseFormOpen(true); }} className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue">
                  <Plus className="w-3 h-3" /> New Course
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {courses.map(course => (
                  <div key={course.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm uppercase">{course.title}</div>
                      <div className="text-[10px] text-gray-400 font-mono">฿{course.price}</div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingCourse(course); setIsCourseFormOpen(true); }} className="p-2 text-gray-400 hover:text-brand-blue"><Edit className="w-4 h-4" /></button>
                       <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-gray-400 hover:text-brand-red"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </BlockTable>
          )}

          {activeTab === 'shop' && <ProductManagement />}

          {activeTab === 'appearance' && (
            <BlockTable title="Appearance Settings" icon={<Plus className="w-4 h-4" />}>
              <div className="p-6 space-y-8">
                <div>
                  <h4 className="font-black uppercase text-sm mb-4">Hero Carousel Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {heroImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-video bg-gray-100 border overflow-hidden group">
                        <img src={url} className="w-full h-full object-cover" />
                        <button onClick={() => handleDeleteHeroImage(idx)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="block border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <span className="font-mono text-xs uppercase font-bold text-gray-400">Add Hero image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleHeroFileUpload} disabled={isUploadingHero} />
                  </label>

                  <div className="pt-6 border-t-2 border-gray-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-black uppercase text-sm">White Gradient Filter</h4>
                      <p className="font-mono text-xs text-gray-500 mt-1">Applies a fading white overlay on the hero images to make black text legible.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={heroFilterEnabled} 
                        onChange={async (e) => {
                          const val = e.target.checked;
                          setHeroFilterEnabled(val);
                          await updateSystemSetting('hero_filter_enabled', val.toString());
                        }} 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                    </label>
                  </div>
                </div>
              </div>
            </BlockTable>
          )}

          {activeTab === 'settings' && (
            <BlockTable title="System Settings" icon={<Plus className="w-4 h-4" />}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">PromptPay Number</label>
                  <input type="text" value={promptPayNumber} onChange={e => setPromptPayNumber(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-lg" placeholder="08X-XXX-XXXX" />
                </div>

                <div className="pt-6 border-t-2 border-brand-charcoal/10">
                  <h4 className="font-black uppercase text-sm mb-4">Legal & Support Pages Content</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">Privacy Policy</label>
                      <textarea value={legalPrivacyPolicy} onChange={e => setLegalPrivacyPolicy(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-xs h-32" placeholder="Leave empty to use default text..."></textarea>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">Terms of Service</label>
                      <textarea value={legalTermsOfService} onChange={e => setLegalTermsOfService(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-xs h-32" placeholder="Leave empty to use default text..."></textarea>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">Refund Policy</label>
                      <textarea value={legalRefundPolicy} onChange={e => setLegalRefundPolicy(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-xs h-32" placeholder="Leave empty to use default text..."></textarea>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">Cancellation Policy</label>
                      <textarea value={legalCancellationPolicy} onChange={e => setLegalCancellationPolicy(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-xs h-32" placeholder="Leave empty to use default text..."></textarea>
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase font-bold text-gray-400 mb-2">Contact Information</label>
                      <textarea value={legalContact} onChange={e => setLegalContact(e.target.value)} className="w-full border-2 border-brand-charcoal p-3 font-mono text-xs h-32" placeholder="Leave empty to use default text..."></textarea>
                    </div>
                  </div>
                </div>

                <button onClick={handleSaveSettings} disabled={isSettingsLoading} className="bg-brand-charcoal text-white font-black uppercase py-4 px-10 hover:bg-brand-red transition-all">
                  {isSettingsLoading ? 'Saving...' : 'Update Settings'}
                </button>
              </div>
            </BlockTable>
          )}

          {activeTab === 'refunds' && (
            <div className="space-y-8">
              {/* Refund Policy Text Setting */}
              <BlockTable title="ตั้งค่าข้อความเงื่อนไข Refund" icon={<RotateCcw className="w-4 h-4" />}>
                <div className="p-6 space-y-4">
                  <p className="font-mono text-xs text-gray-500">ข้อความนี้จะแสดงให้ User เห็นก่อนที่จะกดส่งคำขอ Refund</p>
                  <textarea
                    value={refundPolicyText}
                    onChange={e => setRefundPolicyText(e.target.value)}
                    className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm h-40 resize-none"
                    placeholder="ระบุเงื่อนไขการขอ Refund ที่นี่ เช่น 'การขอ Refund สามารถทำได้ภายใน 7 วัน ...'"
                  />
                  <button onClick={handleSaveRefundPolicy} className="bg-brand-charcoal text-white px-6 py-3 font-mono text-xs font-bold uppercase hover:bg-brand-blue transition-colors">
                    บันทึกเงื่อนไข
                  </button>
                </div>
              </BlockTable>

              {/* Pending Refund Requests */}
              <BlockTable title={`คำขอ Refund (${refundRequests.filter(r => r.status === 'pending').length} pending)`} icon={<RotateCcw className="w-4 h-4" />}>
                {refundRequests.length === 0 ? (
                  <div className="p-12 text-center font-mono text-sm text-gray-400">ไม่มีคำขอ REFUND</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {refundRequests.map(req => (
                      <div key={req.id} className={`p-6 ${req.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-0.5 font-mono text-[9px] font-black uppercase ${
                                req.status === 'pending' ? 'bg-amber-200 text-amber-700' :
                                req.status === 'approved' ? 'bg-green-200 text-green-700' :
                                'bg-red-200 text-red-700'
                              }`}>
                                {req.status}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400 uppercase">{req.order_type}</span>
                              <span className="font-mono text-[10px] text-gray-400">#{req.order_id?.slice(0, 8)}</span>
                            </div>
                            <div className="font-mono text-xs text-gray-400 mb-1">User ID: {req.user_id?.slice(0, 12)}...</div>
                            <div className="text-xl font-black mb-2">฿{Number(req.amount || 0).toLocaleString()}</div>
                            <div className="bg-gray-50 p-3 border border-gray-200">
                              <span className="font-mono text-[10px] font-bold text-gray-400 uppercase block mb-1">เหตุผลของ User</span>
                              <p className="font-mono text-xs text-gray-700">{req.reason}</p>
                            </div>
                            <div className="font-mono text-[10px] text-gray-400 mt-2">{new Date(req.created_at).toLocaleString()}</div>
                          </div>

                          {req.status === 'pending' && (
                            <div className="w-full md:w-72 space-y-3">
                              <textarea
                                placeholder="ตอบกลับ User (ไม่บังคับ)..."
                                value={refundAdminResponse[req.id] || ''}
                                onChange={e => setRefundAdminResponse(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="w-full border-2 border-gray-300 p-3 font-mono text-xs h-20 resize-none focus:border-brand-blue outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRefundAction(req.id, 'approved')}
                                  className="flex-1 bg-green-600 text-white py-2 font-mono text-xs font-bold uppercase hover:bg-green-700 transition-colors"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() => handleRefundAction(req.id, 'rejected')}
                                  className="flex-1 bg-red-600 text-white py-2 font-mono text-xs font-bold uppercase hover:bg-red-700 transition-colors"
                                >
                                  ✗ Reject
                                </button>
                              </div>
                            </div>
                          )}

                          {req.status !== 'pending' && req.admin_response && (
                            <div className="w-full md:w-72 p-3 bg-gray-100 border border-gray-200">
                              <span className="font-mono text-[10px] font-bold text-gray-400 uppercase block mb-1">Admin Response</span>
                              <p className="font-mono text-xs text-gray-700">{req.admin_response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlockTable>
            </div>
          )}
        </div>
      </div>

      {isGymFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto border-4 border-brand-charcoal shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]">
            <div className="sticky top-0 p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest">{editingGym?.id ? 'Edit Gym' : 'New Listing'}</h2>
              <button onClick={() => setIsGymFormOpen(false)} className="hover:text-brand-red"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveGym} className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="GYM NAME" value={editingGym?.name || ''} onChange={e => setEditingGym({...editingGym, name: e.target.value})} />
                <input className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="LOCATION" value={editingGym?.location || ''} onChange={e => setEditingGym({...editingGym, location: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <select className="border-2 border-brand-charcoal p-4 font-mono text-sm" value={editingGym?.category || 'gym'} onChange={e => setEditingGym({...editingGym, category: e.target.value as 'gym' | 'camp'})}>
                  <option value="gym">Gym</option>
                  <option value="camp">Camp</option>
                </select>
                <input type="number" className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder={editingGym?.category === 'camp' ? "CAMP PRICE (TOTAL)" : "PRICE (THB)"} value={editingGym?.basePrice || ''} onChange={e => setEditingGym({...editingGym, basePrice: parseFloat(e.target.value)})} />
                <input type="number" className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="AFFILIATE %" value={editingGym?.affiliatePercentage || ''} onChange={e => setEditingGym({...editingGym, affiliatePercentage: parseFloat(e.target.value)})} title="Commission for affiliates" />
              </div>

              {editingGym?.category === 'camp' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-brand-bone border-2 border-brand-charcoal">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Start Date</label>
                        <input type="date" className="w-full border-2 border-brand-charcoal p-2 font-mono text-xs" value={editingGym?.startDate || ''} onChange={e => setEditingGym({...editingGym, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">End Date</label>
                        <input type="date" className="w-full border-2 border-brand-charcoal p-2 font-mono text-xs" value={editingGym?.endDate || ''} onChange={e => setEditingGym({...editingGym, endDate: e.target.value})} />
                    </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-brand-bone/50 p-4 border-2 border-brand-charcoal">
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isFlashSale" checked={editingGym?.isFlashSale || false} onChange={e => setEditingGym({...editingGym, isFlashSale: e.target.checked})} className="w-5 h-5 accent-brand-red" />
                    <label htmlFor="isFlashSale" className="font-black uppercase text-xs">Flash Sale Active</label>
                </div>
                <div className="flex items-center gap-3">
                    <input type="checkbox" id="isVerified" checked={editingGym?.isVerified || false} onChange={e => {
                        const verified = e.target.checked;
                        setEditingGym({...editingGym, isVerified: verified, approvalStatus: verified ? 'approved' : 'pending'});
                    }} className="w-5 h-5 accent-brand-blue" />
                    <label htmlFor="isVerified" className="font-black uppercase text-xs">Is Verified / Approved</label>
                </div>
                {editingGym?.isFlashSale && (
                    <div className="flex items-center gap-3">
                        <label className="font-mono text-[10px] uppercase font-bold text-gray-400">Discount %</label>
                        <input type="number" value={editingGym?.flashSaleDiscount || 0} onChange={e => setEditingGym({...editingGym, flashSaleDiscount: parseInt(e.target.value)})} className="w-20 border-2 border-brand-charcoal p-2 font-mono text-xs" />
                    </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase">Profile / Cover Photo</label>
                <div className="flex gap-4 items-center">
                    {editingGym?.profilePhoto && <img src={editingGym.profilePhoto} className="w-20 h-20 object-cover border-4 border-brand-charcoal" alt="Preview" />}
                    <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            try {
                                const { uploadImage } = await import('../services/dataService');
                                const url = await uploadImage('gyms', file);
                                if (url) setEditingGym({...editingGym, profilePhoto: url});
                            } catch (err) { alert("Upload failed"); }
                        }
                    }} className="flex-1 border-2 border-brand-charcoal p-4 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:bg-brand-charcoal file:text-white" />
                </div>
              </div>

              <textarea className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm h-32" placeholder="DESCRIPTION" value={editingGym?.description || ''} onChange={e => setEditingGym({...editingGym, description: e.target.value})}></textarea>
              <button type="submit" className="w-full bg-brand-red text-white py-4 font-black uppercase hover:bg-brand-charcoal transition-colors">Save Listing</button>
            </form>
          </div>
        </div>
      )}

      {isCourseFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto border-4 border-brand-charcoal shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]">
             <div className="sticky top-0 p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest">Manage Course</h2>
              <button onClick={() => setIsCourseFormOpen(false)} className="hover:text-brand-red"><X className="w-6 h-6" /></button>
            </div>
             <form onSubmit={handleSaveCourse} className="p-8 space-y-6">
                <input className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="COURSE TITLE" value={editingCourse?.title || ''} onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} />
                <textarea className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm h-24" placeholder="DESCRIPTION" value={editingCourse?.description || ''} onChange={e => setEditingCourse({...editingCourse, description: e.target.value})}></textarea>
                <div className="grid grid-cols-2 gap-4">
                   <select className="border-2 border-brand-charcoal p-4 font-mono text-sm" value={editingCourse?.gymId || ''} onChange={e => setEditingCourse({...editingCourse, gymId: e.target.value})}>
                    <option value="">Select Gym</option>
                    {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <input type="number" className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="PRICE (THB)" value={editingCourse?.price || ''} onChange={e => setEditingCourse({...editingCourse, price: parseFloat(e.target.value)})} />
                </div>
                <button type="submit" className="w-full bg-brand-blue text-white py-4 font-black uppercase hover:bg-brand-charcoal transition-all">Store Course</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;