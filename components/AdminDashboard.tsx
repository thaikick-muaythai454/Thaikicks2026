
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, DollarSign, Activity, Megaphone, Trash2, Edit, Plus, UserPlus, Calendar, Clock, BookOpen, Layers, ShoppingBag, Package } from 'lucide-react';
import { USERS } from '../lib/auth-data';
import { Booking, AffiliateApplication, Announcement, Gym, Trainer, TrainerSchedule, User, Course, Product } from '../lib/types';
import { createAnnouncement, deleteAnnouncement, getAnnouncements, createGym, updateGym, deleteGym, getGyms, createTrainer, deleteTrainer, getTrainerSchedules, createTrainerSchedule, deleteTrainerSchedule, getAllUsers, getCourses, createCourse, updateCourse, deleteCourse, getSystemSetting, updateSystemSetting, updateUserRole } from '../services/dataService';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/shopService';
import ProductManagement from './ProductManagement';

interface AdminDashboardProps {
  bookings: Booking[];
  applications: AffiliateApplication[];
  handleApprove: (id: string, ok: boolean) => void;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ bookings, applications, handleApprove }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]); // New state for users
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

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'gyms' | 'users' | 'announcements' | 'bookings' | 'courses' | 'shop' | 'settings'>('overview');

  useEffect(() => {
    const loadSettings = async () => {
      const number = await getSystemSetting('promptpay_number');
      if (number) setPromptPayNumber(number);
    };

    loadSettings();
    loadAnnouncements();
    loadGyms();
    loadUsers();
    loadCourses();
    loadProducts();
  }, []);

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


  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const totalCommission = bookings.reduce((sum, b) => sum + b.commissionAmount, 0);

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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
          <div>
            <Mono className="text-brand-blue">Total Platform Revenue</Mono>
            <div className="text-2xl md:text-3xl font-black mt-2">฿{totalRevenue.toLocaleString()}</div>
          </div>
          <DollarSign className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
          <div>
            <Mono className="text-brand-blue">Affiliate Payouts</Mono>
            <div className="text-2xl md:text-3xl font-black mt-2">฿{totalCommission.toLocaleString()}</div>
          </div>
          <Users className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
          <div>
            <Mono className="text-brand-blue">Pending Requests</Mono>
            <div className="text-2xl md:text-3xl font-black mt-2">{applications.length}</div>
          </div>
          <Activity className="w-8 h-8 text-brand-red animate-pulse" />
        </div>
      </div>

      {/* Analytics Navigation */}
      <div className="mb-12 animate-reveal" style={{ animationDelay: '0.1s' }}>
        <div className="bg-brand-charcoal p-8 border-2 border-brand-charcoal flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_0px_#AE3A17] group hover:bg-white hover:text-brand-charcoal transition-all duration-300">
          <div>
            <h3 className="text-2xl font-black uppercase text-white group-hover:text-brand-charcoal mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-brand-red animate-pulse" />
              Business Intelligence
            </h3>
            <p className="font-mono text-xs text-brand-blue group-hover:text-brand-charcoal/70">
              View deep insights, revenue trends, and top performance metrics.
            </p>
          </div>

          <a href="#/analytics" className="px-8 py-4 bg-brand-red text-white font-black uppercase text-sm border-2 border-brand-red hover:bg-transparent hover:text-brand-red hover:border-brand-red transition-all whitespace-nowrap">
            Launch Analytics Console
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pb-12">
        {/* Left Column: Actions */}
        <div className="space-y-12 min-w-0">

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
                        <input
                          className="border p-2 font-mono text-xs bg-white w-full"
                          placeholder="Image URL"
                          value={editingGym?.images?.[0] || ''}
                          onChange={e => setEditingGym({ ...editingGym, images: [e.target.value] })}
                        />
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
                              className="border p-1 text-[10px] font-mono bg-gray-50 w-full"
                              placeholder="Image URL"
                              value={newTrainer.image}
                              onChange={e => setNewTrainer({ ...newTrainer, image: e.target.value })}
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
                <div key={g.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 shrink-0 overflow-hidden border border-gray-300">
                      {g.images?.[0] && <img src={g.images[0]} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm uppercase text-brand-charcoal">{g.name}</div>
                      <div className="font-mono text-xs text-gray-400">{g.location} • ฿{g.basePrice}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingGym(g); setIsGymFormOpen(true); }} className="p-2 hover:bg-blue-100 text-brand-blue rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteGym(g.id)} className="p-2 hover:bg-red-100 text-brand-red rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue"
              >
                <Plus className="w-3 h-3" /> New Course
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

          {/* Affiliate Approval Section */}
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

        </div>

        {/* Right Column: Data */}
        <div className="space-y-12 min-w-0">

          {/* New Section: Daily Attendance / Class Roster */}
          <BlockTable title="Daily Attendance (Paid)" icon={<Users className="w-4 h-4" />}>
            <div className="p-4 bg-gray-50 border-b border-gray-100 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    className={`border p-2 font-mono text-xs w-full bg-white pr-8 placeholder-transparent ${attendanceDate ? 'text-brand-charcoal' : 'text-transparent'}`}
                    value={attendanceDate}
                    onChange={e => setAttendanceDate(e.target.value)}
                  />
                  {!attendanceDate && (
                    <div className="absolute inset-0 flex items-center px-4 pointer-events-none text-xs text-gray-400 font-mono">
                      Show All
                    </div>
                  )}
                  {attendanceDate && (
                    <button
                      onClick={() => setAttendanceDate('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 hover:text-red-700"
                      title="Clear Date"
                    >
                      X
                    </button>
                  )}
                </div>
                <select
                  className="border p-2 font-mono text-xs w-full bg-white flex-1"
                  value={attendanceGymId}
                  onChange={e => setAttendanceGymId(e.target.value)}
                >
                  <option value="all">All Locations</option>
                  {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="font-mono text-xs text-gray-500 font-bold uppercase">Total Attendees</span>
                <span className="font-black text-2xl text-brand-charcoal">{attendanceList.length}</span>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
              {attendanceList.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-gray-400">No attendees found</div>
              ) : (
                attendanceList.map(b => (
                  <div key={b.id} className="p-3 bg-white hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs uppercase text-brand-charcoal">{b.userName || 'Guest'}</span>
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-gray-400 block">{b.gymName}</span>
                        <span className="font-mono text-[10px] text-brand-blue block">{b.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${b.type === 'private' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {b.type === 'private' ? 'Private' : 'Standard'}
                      </span>
                      {b.type === 'private' && (
                        <span className="text-[10px] text-gray-500 font-mono border border-gray-200 px-1">
                          {b.trainerName} @ {b.startTime}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </BlockTable>

          {/* User Registry */}
          <BlockTable title="User Registry (Auth Data)" icon={<Shield className="w-4 h-4" />}>
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead className="bg-brand-bone font-mono text-xs font-bold text-brand-blue uppercase sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 border-b-2 border-brand-charcoal bg-brand-bone">User</th>
                    <th className="p-4 border-b-2 border-brand-charcoal bg-brand-bone">Role</th>
                    <th className="p-4 border-b-2 border-brand-charcoal text-right bg-brand-bone">Affiliate</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-brand-bone/50">
                      <td className="p-4 max-w-[200px]">
                        <div className="font-bold text-brand-charcoal truncate" title={user.name}>{user.name}</div>
                        <div className="text-gray-400 truncate" title={user.email}>{user.email}</div>
                      </td>

                      <td className="p-4 uppercase text-gray-600">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-transparent border-b border-gray-300 font-mono text-xs uppercase focus:outline-none focus:border-brand-blue"
                        >
                          <option value="customer">Customer</option>
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px - 2 py - 1 border ${user.affiliateStatus === 'active' ? 'border-green-600 text-green-700 bg-green-50' :
                          user.affiliateStatus === 'pending' ? 'border-brand-blue text-brand-blue bg-blue-50' : 'border-gray-200 text-gray-400'
                          } `}>
                          {user.affiliateStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockTable>

          {/* Booking Ledger */}
          <BlockTable title="Transaction Ledger" icon={<Activity className="w-4 h-4" />}>
            {bookings.length === 0 ? (
              <div className="p-8 text-center font-mono text-sm text-gray-400">NO TRANSACTIONS</div>
            ) : (
              <div className="divide-y-2 divide-gray-100 max-h-[500px] overflow-y-auto">
                {bookings.slice().reverse().map(b => (
                  <div key={b.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-gray-400">{b.date}</span>
                      <span className={`font - mono text - [10px] font - bold px - 2 uppercase ${b.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-brand-blue bg-blue-50'} `}>
                        {b.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-brand-charcoal uppercase truncate">{b.gymName}</div>
                        <div className="font-mono text-xs text-gray-500 truncate">User: {b.userName.split(' ')[0]}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-brand-charcoal">฿{b.totalPrice}</div>
                        {b.commissionAmount > 0 && (
                          <div className="font-mono text-[10px] text-brand-red">
                            Comm: ฿{b.commissionAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockTable>

          {/* Shop Management Navigation */}
          <div className="bg-white border-2 border-brand-charcoal p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_0px_#AE3A17] group hover:bg-brand-bone transition-all duration-300">
            <div>
              <h3 className="text-2xl font-black uppercase text-brand-charcoal mb-2 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-brand-blue" />
                E-Commerce Management
              </h3>
              <p className="font-mono text-xs text-gray-600">
                Manage products, inventory, orders, and shop settings.
              </p>
            </div>
            <a
              href="#/shop-admin"
              className="px-8 py-4 bg-brand-charcoal text-white font-black uppercase text-sm border-2 border-brand-charcoal hover:bg-brand-blue hover:border-brand-blue transition-all whitespace-nowrap"
            >
              Open Shop Admin
            </a>
          </div>

          {/* System Logs (Static) */}
          <div className="bg-brand-charcoal text-gray-400 p-6 border-2 border-brand-charcoal font-mono text-[10px] space-y-2 overflow-hidden shadow-[8px_8px_0px_0px_#AE3A17]">
            <div className="text-white font-bold border-b border-gray-600 pb-2 mb-2">SYSTEM LOGS</div>
            <p className="truncate">&gt; [SYSTEM] Initialized 3 Gym nodes</p>
            <p className="truncate">&gt; [SYSTEM] Loaded {users.length} user profiles from auth-data</p>
            <p className="truncate">&gt; [AFFILIATE] Tracking cookie expiry set to 30 days</p>
            <p className="truncate">&gt; [BOT] Kru AI agent connected successfully</p>
            <p className="animate-pulse truncate">&gt; [MONITOR] Watching for new bookings...</p>
          </div>
        </div>
        {
          activeTab === 'settings' && (
            <DashboardContainer title="System Settings" subtitle="Configuration">
              <div className="max-w-xl">
                <BlockTable title="Payment Configuration" icon={<DollarSign className="w-4 h-4" />}>
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="font-mono text-xs font-bold text-brand-blue block mb-2 uppercase">PromptPay Number</label>
                      <input
                        type="text"
                        value={promptPayNumber}
                        onChange={(e) => setPromptPayNumber(e.target.value)}
                        className="w-full border-2 border-brand-charcoal p-3 font-mono text-lg"
                        placeholder="08X-XXX-XXXX"
                      />
                      <p className="mt-2 font-mono text-xs text-gray-400">
                        This number will be used to generate dynamic QR codes for payments.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      disabled={isSettingsLoading}
                      className="bg-brand-charcoal text-white font-bold uppercase py-3 px-8 hover:bg-brand-red transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                    >
                      {isSettingsLoading ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </BlockTable>
              </div>
            </DashboardContainer>
          )
        }

      </div >
    </div >
  );
};

export default AdminDashboard;