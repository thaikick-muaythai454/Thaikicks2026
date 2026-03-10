
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, DollarSign, Activity, Megaphone, Trash2, Edit, Plus, UserPlus, Calendar, Clock, BookOpen, Layers, ShoppingBag, Package } from 'lucide-react';
import { USERS } from '../lib/auth-data';
import { Booking, AffiliateApplication, Announcement, Gym, Trainer, TrainerSchedule, User, Course, Product } from '../lib/types';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, createGym, updateGym, deleteGym, getGyms, createTrainer, deleteTrainer, getTrainerSchedules, createTrainerSchedule, deleteTrainerSchedule, getAllUsers, getCourses, createCourse, updateCourse, deleteCourse, getSystemSetting, updateSystemSetting, updateUserRole, getAffiliateApplications, updateAffiliateApplicationStatus, updateUserAffiliateStatus, updateGymApprovalStatus } from '../services/dataService';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/shopService';
import ProductManagement from './ProductManagement';
import EventManagement from './EventManagement';

interface AdminDashboardProps {
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ bookings }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [gyms, setGyms] = useState<Gym[]>([]);
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
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  // Shop/Product State
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  // Appearance State
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'gyms' | 'users' | 'announcements' | 'bookings' | 'courses' | 'shop' | 'appearance' | 'settings'>('overview');

  useEffect(() => {
    const loadSettings = async () => {
      const number = await getSystemSetting('promptpay_number');
      if (number) setPromptPayNumber(number);

      const heroSetting = await getSystemSetting('hero_images');
      if (heroSetting) {
        try {
          // It's saved as a JSON string
          setHeroImages(JSON.parse(heroSetting));
        } catch (e) {
          console.error("Failed to parse hero_images", e);
        }
      }
    };

    loadSettings();
    loadAnnouncements();
    loadGyms();
    loadUsers();
    loadCourses();
    loadProducts();
    loadApplications();
  }, []);

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

  const addModuleToCourse = () => {
    const currentModules = editingCourse.designData?.modules || [];
    const newModule = { title: "New Module", content: "" };
    setEditingCourse({
      ...editingCourse,
      designData: { ...editingCourse.designData, modules: [...currentModules, newModule] }
    });
  };

  const updateModule = (index: number, field: string, value: string) => {
    const modules = [...(editingCourse.designData?.modules || [])];
    modules[index] = { ...modules[index], [field]: value };
    setEditingCourse({
      ...editingCourse,
      designData: { ...editingCourse.designData, modules }
    });
  };

  const removeModule = (index: number) => {
    const modules = [...(editingCourse.designData?.modules || [])];
    modules.splice(index, 1);
    setEditingCourse({
      ...editingCourse,
      designData: { ...editingCourse.designData, modules }
    });
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
    } catch (err) {
      console.error(err);
      alert("Failed to save gym. Please check your connection and try again.");
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
      // Refresh Gyms to show new trainer (since fetching gyms also fetches trainers)
      await loadGyms();
      // Also update local editingGym state if we want to show it immediately without re-opening?
      // Actually loadGyms updates 'gyms', but we need to update the object currently being edited to reflect changes if strictly checking local state.
      // But typically we re-fetch. Let's just re-fetch and find the gym again to update editingGym view if needed.
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
      // Refresh local editing state
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
      // Reload
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
      alert("Settings saved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const loadAnnouncements = async () => { // Rename legacy loadNews
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


  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      // Refresh users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
    } catch (err) {
      console.error(err);
      alert("Failed to update role");
    }
  };

  // --- Product Management Functions ---
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

  // --- Appearance Management ---
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
    } catch (err) {
      console.error(err);
      alert("Failed to upload hero image");
    } finally {
      setIsUploadingHero(false);
      // Reset the file input so the same file could be selected again if needed
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
    } catch (err) {
      console.error(err);
      alert("Failed to remove hero image");
    }
  };

  // ── Analytics State ──────────────────────────────────────────
  const [filterDateFrom, setFilterDateFrom] = React.useState('');
  const [filterDateTo, setFilterDateTo] = React.useState('');
  const [filterGymId, setFilterGymId] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');

  // Filtered bookings for analytics
  const filteredBookings = bookings.filter(b => {
    const matchFrom = !filterDateFrom || b.date >= filterDateFrom;
    const matchTo = !filterDateTo || b.date <= filterDateTo;
    const matchGym = filterGymId === 'all' || b.gymId === filterGymId;
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchFrom && matchTo && matchGym && matchStatus;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = filteredBookings.reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
  const totalNet = totalRevenue - totalCommission;

  type GymPerf = { name: string; bookings: number; revenue: number; commission: number };
  // Gym performance map
  const gymPerformance = filteredBookings.reduce((acc: Record<string, GymPerf>, b) => {
    if (!acc[b.gymId]) acc[b.gymId] = { name: b.gymName, bookings: 0, revenue: 0, commission: 0 };
    acc[b.gymId].bookings += 1;
    acc[b.gymId].revenue += b.totalPrice;
    acc[b.gymId].commission += b.commissionAmount || 0;
    return acc;
  }, {} as Record<string, GymPerf>);
  const gymPerfList: GymPerf[] = (Object.values(gymPerformance) as GymPerf[]).sort((a, b) => b.revenue - a.revenue);

  // CSV Export
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
    // Summary rows
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

  // Filter Bookings for Attendance
  const attendanceList = bookings.filter(b => {
    const matchDate = !attendanceDate || b.date === attendanceDate;
    const matchGym = attendanceGymId === 'all' || b.gymId === attendanceGymId;
    const isPaid = b.status === 'confirmed' || b.status === 'completed';
    return matchDate && matchGym && isPaid;
  });


  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal min-h-[80vh]">
      {/* Header */}
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

      {/* ── Analytics Report Panel ─────────────────────────────── */}
      <div className="mb-12 border-2 border-brand-charcoal bg-white shadow-[8px_8px_0px_0px_#1A1A1A]">
        {/* Panel Header */}
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

        {/* Filters */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">From Date</label>
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full border border-gray-200 p-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">To Date</label>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
              className="w-full border border-gray-200 p-2 font-mono text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Gym</label>
            <select value={filterGymId} onChange={e => setFilterGymId(e.target.value)}
              className="w-full border border-gray-200 p-2 font-mono text-xs bg-white">
              <option value="all">All Gyms</option>
              {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="w-full border border-gray-200 p-2 font-mono text-xs bg-white">
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
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

        {/* Gym Performance Table */}
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
      {/* Pending Affiliates Badge */}
      {applications.length > 0 && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-brand-red text-white font-mono text-xs font-bold uppercase w-fit shadow-[4px_4px_0px_0px_#1A1A1A]">
          <Activity className="w-3 h-3 animate-pulse" /> {applications.length} Pending Affiliate Request(s)
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pb-12">
        {/* Left Column: Actions */}
        <div className="space-y-12 min-w-0">

          {/* Ticketing Management (Moved to top for visibility) */}
          <EventManagement />

          {/* New Section: News Management */}
          <BlockTable title="Broadcast News" icon={<Megaphone className="w-4 h-4" />}>
            <div className="p-6 border-b-2 border-gray-100 bg-gray-50">
              <input
                className="w-full bg-white border border-gray-300 p-3 mb-2 font-mono text-sm"
                placeholder="HEADLINE..."
                value={newsTitle}
                onChange={e => setNewsTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-white border border-gray-300 p-3 mb-4 font-mono text-sm h-20"
                placeholder="Your announcement content..."
                value={newsContent}
                onChange={e => setNewsContent(e.target.value)}
              ></textarea>
              <button
                onClick={handlePostNews}
                disabled={isPosting}
                className="w-full bg-brand-charcoal text-white font-bold uppercase py-3 hover:bg-brand-blue transition-colors disabled:opacity-50"
              >
                {isPosting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
              {announcements.map(a => (
                <div key={a.id} className="p-4 flex justify-between items-start hover:bg-brand-bone transition-colors group">
                  <div>
                    <div className="font-black uppercase text-sm">{a.title}</div>
                    <p className="font-mono text-xs text-gray-500 truncate max-w-[200px]">{a.content}</p>
                    <span className="text-[10px] text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDeleteNews(a.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {announcements.length === 0 && <div className="p-4 text-center text-xs text-gray-400 font-mono">No active announcements</div>}
            </div>
          </BlockTable>

          {/* Gym Management */}
          <BlockTable title="Gym Inventory" icon={<Activity className="w-4 h-4" />}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="font-mono text-xs text-gray-500">{gyms.length} Active Listings</span>
              <button
                onClick={() => { setEditingGym({}); setIsGymFormOpen(true); }}
                className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue"
              >
                <Plus className="w-3 h-3" /> Add Gym
              </button>
            </div>

            {isGymFormOpen && (
              <div className="p-6 bg-brand-bone border-b-2 border-brand-charcoal">
                {managingScheduleFor ? (
                  // --- SCHEDULE MANAGER MODE ---
                  <div className="animate-reveal">
                    <div className="flex justify-between items-center mb-4 border-b border-brand-charcoal pb-2">
                      <h4 className="font-black uppercase text-sm">Manage Schedule: {managingScheduleFor.name}</h4>
                      <button onClick={() => setManagingScheduleFor(null)} className="text-xs font-mono underline hover:text-brand-red">Close Schedule</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* List */}
                      <div className="space-y-2">
                        {trainerSchedules.length === 0 && <div className="text-xs text-gray-400 font-mono">No active slots.</div>}
                        {trainerSchedules.map(s => (
                          <div key={s.id} className="flex justify-between items-center bg-white p-2 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="bg-brand-blue text-white text-[10px] font-bold px-2 py-1 w-20 text-center">{s.dayOfWeek}</div>
                              <div className="font-mono text-xs">{s.startTime} - {s.endTime}</div>
                            </div>
                            <button onClick={() => handleDeleteSchedule(s.id)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Form */}
                      <div className="bg-gray-100 p-4 border border-gray-200">
                        <div className="font-bold text-xs uppercase mb-3 text-gray-500">Add New Slot</div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold mb-1">Day</label>
                            <select
                              className="w-full p-2 text-xs font-mono border"
                              value={newSchedule.day}
                              onChange={e => setNewSchedule({ ...newSchedule, day: e.target.value })}
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold mb-1">Start</label>
                              <input type="time" className="w-full p-2 text-xs font-mono border" value={newSchedule.start} onChange={e => setNewSchedule({ ...newSchedule, start: e.target.value })} />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold mb-1">End</label>
                              <input type="time" className="w-full p-2 text-xs font-mono border" value={newSchedule.end} onChange={e => setNewSchedule({ ...newSchedule, end: e.target.value })} />
                            </div>
                          </div>
                          <button onClick={handleAddSchedule} className="w-full bg-brand-charcoal text-white font-bold text-xs uppercase py-2 hover:bg-brand-blue transition-colors">
                            Add Time Slot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveGym} className="space-y-4">
                    <div className="p-2 bg-gray-100 rounded mb-2 border border-gray-200">
                      <h4 className="font-mono text-xs font-bold uppercase text-brand-charcoal mb-2 border-b border-gray-300 pb-1">Gym Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          className="border p-2 font-mono text-xs bg-white w-full"
                          placeholder="Gym Name"
                          value={editingGym?.name || ''}
                          onChange={e => setEditingGym({ ...editingGym, name: e.target.value })}
                          required
                        />
                        <select
                          className="border p-2 font-mono text-xs bg-white w-full"
                          value={editingGym?.category || 'gym'}
                          onChange={e => setEditingGym({ ...editingGym, category: e.target.value as 'gym' | 'camp' })}
                          required
                        >
                          <option value="gym">Gym</option>
                          <option value="camp">Camp</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex gap-2 items-center">
                          {editingGym?.images?.[0] && <img src={editingGym.images[0]} className="w-10 h-10 object-cover border" alt="Preview" />}
                          <input
                            type="file"
                            accept="image/*"
                            className="border p-2 font-mono text-xs bg-white w-full file:mr-2 file:border-0 file:bg-brand-charcoal file:text-white file:text-xs file:px-2 file:cursor-pointer"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  e.target.disabled = true;
                                  const { uploadImage } = await import('../services/dataService');
                                  const url = await uploadImage('gyms', file);
                                  if (url) setEditingGym({ ...editingGym, images: [url] });
                                } catch (err) {
                                  alert("Failed to upload image");
                                } finally {
                                  e.target.disabled = false;
                                }
                              }
                            }}
                          />
                        </div>
                        <input
                          className="border p-2 font-mono text-xs bg-white w-full"
                          placeholder="Location"
                          value={editingGym?.location || ''}
                          onChange={e => setEditingGym({ ...editingGym, location: e.target.value })}
                          required
                        />
                        <input
                          className="border p-2 font-mono text-xs bg-white w-full"
                          placeholder="Base Price (THB)"
                          type="number"
                          value={editingGym?.basePrice ?? ''}
                          onChange={e => setEditingGym({ ...editingGym, basePrice: Number(e.target.value) })}
                          title="Price per session (Standard)"
                          required
                        />
                        <input
                          className="border p-2 font-mono text-xs bg-white w-full"
                          placeholder="Affiliate Share % (e.g. 10)"
                          type="number"
                          value={editingGym?.affiliatePercentage ?? ''}
                          onChange={e => setEditingGym({ ...editingGym, affiliatePercentage: Number(e.target.value) })}
                          title="Percentage of revenue shared with affiliates"
                        />

                      </div>
                      <textarea
                        className="border p-2 font-mono text-xs bg-white w-full h-16 mt-2"
                        placeholder="Description"
                        value={editingGym?.description || ''}
                        onChange={e => setEditingGym({ ...editingGym, description: e.target.value })}
                      />
                    </div>

                    {/* Trainer Management Section (Only if editing existing gym) */}
                    {editingGym?.id && (
                      <div className="p-2 bg-white rounded border border-gray-200">
                        <h4 className="font-mono text-xs font-bold uppercase text-brand-charcoal mb-2 border-b border-gray-100 pb-1 flex justify-between items-center">
                          <span>Trainer Roster ({editingGym.trainers?.length || 0})</span>
                          <span className="text-[10px] text-gray-400">Add below</span>
                        </h4>

                        {/* List Existing Trainers */}
                        <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto">
                          {editingGym.trainers?.map((t: Trainer) => (
                            <div key={t.id} className="flex justify-between items-center bg-gray-50 p-2 text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                                  {t.image && <img src={t.image} className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                  <div className="font-bold">{t.name}</div>
                                  <div className="text-[10px] text-gray-500">{t.specialty}</div>
                                </div>
                              </div>
                              <button type="button" onClick={() => openScheduleManager(t)} className="text-brand-blue hover:text-brand-charcoal mr-2" title="Manage Schedule">
                                <Calendar className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => handleDeleteTrainer(t.id)} className="text-red-400 hover:text-red-600">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {(!editingGym.trainers || editingGym.trainers.length === 0) && <div className="text-center py-2 text-gray-300 text-[10px]">No trainers yet</div>}
                        </div>

                        {/* Add Trainer Inputs */}
                        <div className="flex flex-col gap-2 border-t border-gray-100 pt-2">
                          <div className="flex gap-2">
                            <input
                              className="border p-1 text-[10px] font-mono bg-gray-50 w-full"
                              placeholder="Name"
                              value={newTrainer.name}
                              onChange={e => setNewTrainer({ ...newTrainer, name: e.target.value })}
                            />
                            <input
                              className="border p-1 text-[10px] font-mono bg-gray-50 w-full"
                              placeholder="Specialty (e.g. Boxing)"
                              value={newTrainer.specialty}
                              onChange={e => setNewTrainer({ ...newTrainer, specialty: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <input
                              className="border p-1 text-[10px] font-mono bg-gray-50 w-full"
                              placeholder="Price (+THB)"
                              type="number"
                              value={newTrainer.pricePerSession}
                              onChange={e => setNewTrainer({ ...newTrainer, pricePerSession: Number(e.target.value) })}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              className="border p-1 text-[10px] font-mono bg-gray-50 w-full file:mr-2 file:border-0 file:bg-brand-charcoal file:text-white file:text-[10px] file:px-2 file:cursor-pointer"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    e.target.disabled = true;
                                    const { uploadImage } = await import('../services/dataService');
                                    const url = await uploadImage('trainers', file);
                                    if (url) setNewTrainer({ ...newTrainer, image: url });
                                  } catch (err) {
                                    alert("Failed to upload image");
                                  } finally {
                                    e.target.disabled = false;
                                  }
                                }
                              }}
                            />
                            <button type="button" onClick={handleAddTrainer} className="bg-brand-blue text-white px-2 rounded hover:bg-blue-600 flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2 border-t border-brand-charcoal">
                      <button type="button" onClick={() => setIsGymFormOpen(false)} className="px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-gray-200">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase hover:bg-green-600">Save Changes</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
              {gyms.map(g => (
                <div key={g.id} className={`p-4 flex justify-between items-center hover:bg-gray-50 group border-l-4 ${g.approvalStatus === 'approved' ? 'border-green-500' : g.approvalStatus === 'rejected' ? 'bg-red-50/50 border-red-500' : 'bg-orange-50/20 border-orange-500'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 shrink-0 overflow-hidden border border-gray-300">
                      {g.images?.[0] && <img src={g.images[0]} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm uppercase text-brand-charcoal flex items-center gap-2">
                        {g.name}
                        {g.approvalStatus === 'approved' ? (
                          <span title="Verified" className="text-green-500 flex items-center gap-1 text-[10px]"><Check className="w-3 h-3" /> Approved</span>
                        ) : g.approvalStatus === 'rejected' ? (
                          <span className="bg-red-500 text-white text-[9px] px-1 rounded-sm uppercase tracking-wider">Rejected</span>
                        ) : (
                          <span className="bg-orange-500 text-white text-[9px] px-1 rounded-sm uppercase tracking-wider animate-pulse">Pending Review</span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-gray-400">{g.location} • ฿{g.basePrice}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {g.approvalStatus === 'pending' ? (
                      <>
                        <button
                          onClick={async () => {
                            try {
                              await updateGymApprovalStatus(g.id, 'approved');
                              await loadGyms();
                            } catch (err) {
                              alert("Failed to approve gym");
                            }
                          }}
                          className="font-mono text-[10px] font-bold uppercase px-2 py-1 bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >Approve</button>
                        <button
                          onClick={async () => {
                            try {
                              await updateGymApprovalStatus(g.id, 'rejected');
                              await loadGyms();
                            } catch (err) {
                              alert("Failed to reject gym");
                            }
                          }}
                          className="font-mono text-[10px] font-bold uppercase px-2 py-1 bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >Reject</button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const newStatus = g.approvalStatus === 'approved' ? 'rejected' : 'approved';
                            await updateGymApprovalStatus(g.id, newStatus);
                            await loadGyms();
                          } catch (err) {
                            console.error(err);
                            alert("Failed to update gym verification status");
                          }
                        }}
                        className={`font-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors ${g.approvalStatus === 'approved' ? 'text-gray-500 border border-gray-300 hover:bg-gray-100' : 'bg-gray-800 text-white hover:bg-gray-900'}`}
                      >
                        {g.approvalStatus === 'approved' ? 'Revoke' : 'Re-Approve'}
                      </button>
                    )}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingGym(g); setIsGymFormOpen(true); }} className="p-2 hover:bg-blue-100 text-brand-blue rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteGym(g.id)} className="p-2 hover:bg-red-100 text-brand-red rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BlockTable>

          {/* Course / Curriculum Management */}
          <BlockTable title="Course Curriculum Design" icon={<BookOpen className="w-4 h-4" />}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="font-mono text-xs text-brand-blue font-bold uppercase">Flexible Course Designer</span>
              <button
                onClick={() => { setEditingCourse({ designData: { modules: [] } }); setIsCourseFormOpen(true); }}
                className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'courses' ? 'bg-brand-blue text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <BookOpen className="w-4 h-4" />
                Training Courses
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'appearance' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <Layers className="w-4 h-4" />
                Appearance
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'settings' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <Layers className="w-4 h-4" />
                Settings
              </button>
            </div>

            {isCourseFormOpen && (
              <div className="p-6 bg-brand-bone border-b-2 border-brand-charcoal animate-reveal">
                <form onSubmit={handleSaveCourse} className="space-y-4">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2">
                    <h4 className="font-black uppercase text-sm">Course Metadata</h4>
                    <button type="button" onClick={() => setIsCourseFormOpen(false)} className="text-xs font-mono underline hover:text-brand-red">Close</button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1">Title</label>
                      <input className="w-full border p-2 font-mono text-xs" value={editingCourse.title || ''} onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })} placeholder="e.g. 10-Day Intensive" required />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1">Gym Location</label>
                      <select className="w-full border p-2 font-mono text-xs" value={editingCourse.gymId || ''} onChange={e => setEditingCourse({ ...editingCourse, gymId: e.target.value })} required>
                        <option value="">Select Gym...</option>
                        {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1">Price (THB)</label>
                      <input type="number" className="w-full border p-2 font-mono text-xs" value={editingCourse.price || ''} onChange={e => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold mb-1">Duration string</label>
                      <input className="w-full border p-2 font-mono text-xs" value={editingCourse.duration || ''} onChange={e => setEditingCourse({ ...editingCourse, duration: e.target.value })} placeholder="e.g. 2 Weeks" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <label className="font-black uppercase text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-brand-blue" />
                        Modules / Curriculum
                      </label>
                      <button type="button" onClick={addModuleToCourse} className="text-[10px] font-mono font-bold uppercase border border-brand-charcoal px-2 py-1 hover:bg-brand-charcoal hover:text-white transition-colors">
                        + Add Module
                      </button>
                    </div>

                    <div className="space-y-4">
                      {editingCourse.designData?.modules?.map((mod: any, idx: number) => (
                        <div key={idx} className="bg-white p-3 border border-gray-200 shadow-sm relative group">
                          <button type="button" onClick={() => removeModule(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                          <div className="mb-2">
                            <input
                              className="font-bold text-xs uppercase w-full bg-transparent outline-none border-b border-transparent focus:border-brand-blue mb-1"
                              value={mod.title}
                              onChange={e => updateModule(idx, 'title', e.target.value)}
                              placeholder="Module Title"
                            />
                            <textarea
                              className="w-full text-xs font-mono text-gray-500 bg-gray-50 p-2 outline-none h-16 resize-none"
                              value={mod.content}
                              onChange={e => updateModule(idx, 'content', e.target.value)}
                              placeholder="Description or content..."
                            />
                          </div>
                        </div>
                      ))}
                      {(!editingCourse.designData?.modules || editingCourse.designData.modules.length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 text-gray-300 font-mono text-xs">
                          Start designing your course structure
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 gap-2">
                    <button type="button" onClick={() => setIsCourseFormOpen(false)} className="px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-gray-200">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase hover:bg-green-600 shadow-[4px_4px_0px_0px_#1A1A1A]">Save Course</button>
                  </div>
                </form>
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
              {courses.map(c => (
                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                  <div>
                    <div className="font-bold text-sm uppercase text-brand-charcoal">{c.title}</div>
                    <div className="font-mono text-xs text-brand-blue flex items-center gap-2">
                      {gyms.find(g => g.id === c.gymId)?.name || 'Unknown Gym'}
                      <span className="text-gray-300">•</span>
                      {c.designData?.modules?.length || 0} Modules
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingCourse(c); setIsCourseFormOpen(true); }} className="p-2 hover:bg-blue-100 text-brand-blue rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteCourse(c.id)} className="p-2 hover:bg-red-100 text-brand-red rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <div className="p-8 text-center font-mono text-xs text-gray-400">No courses defined</div>}
            </div>
          </BlockTable>

          <BlockTable title="Pending Affiliates" icon={<Users className="w-4 h-4" />}>
            {applications.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm text-gray-400">NO PENDING APPLICATIONS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100 max-h-[400px] overflow-y-auto">
                {applications.map(app => (
                  <div key={app.id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-bone border border-brand-charcoal flex items-center justify-center font-bold text-xs shrink-0">
                          {app.userName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm uppercase text-brand-charcoal truncate">{app.userName}</div>
                          <Mono className="text-gray-400 block truncate">ID: {app.id}</Mono>
                        </div>
                      </div>
                      <div className="bg-brand-blue text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider shrink-0">
                        Action Reqd
                      </div>
                    </div>

                    <div className="mb-6 pl-0 sm:pl-11">
                      <p className="font-mono text-xs text-brand-blue mb-1 uppercase font-bold">Statement:</p>
                      <p className="text-sm text-gray-600 font-mono bg-brand-bone p-3 border border-gray-200 italic break-words">
                        "{app.reason}"
                      </p>
                    </div>

                    <div className="flex gap-4 pl-0 sm:pl-11">
                      <button
                        onClick={() => handleApprove(app.id, true)}
                        className="flex-1 bg-brand-charcoal text-white font-bold uppercase text-xs py-3 hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleApprove(app.id, false)}
                        className="flex-1 border-2 border-brand-charcoal text-brand-charcoal font-bold uppercase text-xs py-3 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" /> Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

          {/* Appearance Panel */}
          {activeTab === 'appearance' && (
            <BlockTable title="Appearance Settings" icon={<Layers className="w-4 h-4" />}>
              <div className="p-6 bg-white space-y-8">
                <div>
                  <h4 className="font-black uppercase text-brand-charcoal mb-4">Hero Carousel Images</h4>
                  <div className="text-sm font-mono text-gray-500 mb-6 border-l-2 border-brand-blue pl-4">
                    Upload images to be displayed in the background of the Home page hero section. They will automatically rotate.
                  </div>

                  {/* List of current hero images */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {heroImages.map((url, idx) => (
                      <div key={idx} className="relative group border border-gray-200 aspect-video md:aspect-square bg-gray-100 overflow-hidden">
                        <img src={url} alt={`Hero ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleDeleteHeroImage(idx)}
                            className="bg-brand-red text-white p-2 rounded-full hover:bg-white hover:text-brand-red transition-colors"
                            title="Remove Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {heroImages.length === 0 && (
                      <div className="col-span-2 md:col-span-4 p-8 border-2 border-dashed border-gray-300 text-center font-mono text-sm text-gray-400">
                        No hero images uploaded yet.<br />Default placeholder will be shown.
                      </div>
                    )}
                  </div>

                  {/* Upload new image */}
                  <div>
                    <label className={`block flex items-center justify-center border-2 border-brand-charcoal border-dashed p-6 cursor-pointer hover:bg-brand-bone transition-colors ${isUploadingHero ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="flex flex-col items-center">
                        <Plus className="w-6 h-6 text-brand-charcoal mb-2" />
                        <span className="font-mono text-sm font-bold uppercase text-brand-charcoal">
                          {isUploadingHero ? 'Uploading...' : 'Add New Image'}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 mt-1">Recommended: High quality, landscape orientation</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroFileUpload}
                        disabled={isUploadingHero}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </BlockTable>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;