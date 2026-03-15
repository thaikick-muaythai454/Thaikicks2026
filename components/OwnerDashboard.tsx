
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, DollarSign, Activity, Trash2, Edit, Plus, Calendar } from 'lucide-react';
import { Booking, Gym, Trainer, TrainerSchedule, User } from '../lib/types';
import { createGym, updateGym as updateGymDB, createTrainer, deleteTrainer, getTrainerSchedules, createTrainerSchedule, deleteTrainerSchedule } from '../services/dataService';

interface OwnerDashboardProps {
    user: User;
    gyms: Gym[];
    updateGym: (gym: Gym) => void;
    refreshGyms: () => void;
    bookings: Booking[];
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

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, gyms, updateGym, refreshGyms, bookings }) => {
    const [myGym, setMyGym] = useState<Gym | null>(null);
    const [editingGym, setEditingGym] = useState<Partial<Gym> | null>(null);
    const [isGymFormOpen, setIsGymFormOpen] = useState(false);

    // Trainer Form State
    const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({ name: '', specialty: '', pricePerSession: 500, image: '' });

    // Schedule Management State
    const [managingScheduleFor, setManagingScheduleFor] = useState<Trainer | null>(null);
    const [trainerSchedules, setTrainerSchedules] = useState<TrainerSchedule[]>([]);
    const [newSchedule, setNewSchedule] = useState<{ day: string; start: string; end: string }>({ day: 'Monday', start: '09:00', end: '10:00' });

    // Booking Filter State
    const [bookingDateFilter, setBookingDateFilter] = useState('');

    useEffect(() => {
        // Find my gym
        const found = gyms.find(g => g.ownerId === user.id);
        if (found) {
            setMyGym(found);
        }
    }, [gyms, user.id]);

    const handleSaveGym = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGym) return;

        try {
            if (editingGym.id) {
                // Update in the database and reset approval status
                const payload = { ...editingGym, approvalStatus: 'pending' as const };
                await updateGymDB(editingGym.id, payload);

                // Update local state for immediate UI reflection
                updateGym(payload as Gym);
                setMyGym({ ...myGym, ...payload } as Gym);
            }

            setIsGymFormOpen(false);
            setEditingGym(null);
        } catch (err: any) {
            console.error(err);
            alert("Failed to save gym: " + (err.message || String(err)));
        }
    };

    // --- Methods ---

    // Filter bookings for this gym
    const gymBookings = bookings.filter(b => b.gymId === myGym?.id);
    const totalRevenue = gymBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Filter by date
    const filteredBookings = gymBookings.filter(b => !bookingDateFilter || b.date === bookingDateFilter);

    // Handlers for Gym/Trainer/Schedule (similar to Admin)
    // ... (Implementing below)

    if (!myGym) {
        if (gyms.length >= 0 && !myGym) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center border-2 border-brand-charcoal m-10 border-dashed bg-brand-bone animate-reveal">
                    {isGymFormOpen ? (
                        <div className="bg-white border-2 border-brand-charcoal p-6 max-w-xl w-full text-left shadow-[8px_8px_0px_0px_#1A1A1A]">
                            <h2 className="font-black text-2xl uppercase mb-4 border-b-2 border-brand-charcoal pb-2">Register Facility</h2>
                            <form className="space-y-4" onSubmit={async (e) => {
                                e.preventDefault();
                                if (editingGym && editingGym.name) {
                                    try {
                                        await createGym({
                                            ...editingGym,
                                            ownerId: user.id
                                        } as Gym);
                                        refreshGyms();
                                    } catch (err: any) {
                                        alert("Failed to create facility: " + (err.message || String(err)));
                                    }
                                }
                            }}>
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="border p-2 text-xs font-mono w-full" value={editingGym?.name || ''} onChange={e => setEditingGym({ ...editingGym, name: e.target.value })} placeholder="Gym / Camp Name" required />
                                    <input className="border p-2 text-xs font-mono w-full" type="number" value={editingGym?.basePrice || ''} onChange={e => setEditingGym({ ...editingGym, basePrice: parseFloat(e.target.value) })} placeholder={editingGym?.category === 'camp' ? "Camp Package Price (THB)" : "Base Price (THB)"} required />
                                </div>
                                <select
                                    className="border p-2 text-xs font-mono w-full"
                                    value={editingGym?.category || 'gym'}
                                    onChange={e => setEditingGym({ ...editingGym, category: e.target.value as 'gym' | 'camp' })}
                                    required
                                >
                                    <option value="gym">Gym Setting</option>
                                    <option value="camp">Camp Setting (Fixed Dates)</option>
                                </select>

                                {editingGym?.category === 'camp' && (
                                    <div className="grid grid-cols-2 gap-4 p-3 bg-brand-bone border border-brand-charcoal/20">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Start Date</label>
                                            <input type="date" className="w-full border p-2 text-xs font-mono" value={editingGym?.startDate || ''} onChange={e => setEditingGym({ ...editingGym, startDate: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">End Date</label>
                                            <input type="date" className="w-full border p-2 text-xs font-mono" value={editingGym?.endDate || ''} onChange={e => setEditingGym({ ...editingGym, endDate: e.target.value })} required />
                                        </div>
                                    </div>
                                )}

                                <input className="border p-2 text-xs font-mono w-full" value={editingGym?.location || ''} onChange={e => setEditingGym({ ...editingGym, location: e.target.value })} placeholder="Location (City, Province)" required />
                                
                                <div className="space-y-1">
                                    <label className="block text-[10px] uppercase font-bold text-gray-400">Profile Image</label>
                                    <div className="flex gap-2 items-center">
                                        {editingGym?.profilePhoto && <img src={editingGym.profilePhoto} className="w-10 h-10 object-cover border-2 border-brand-charcoal" alt="Preview" />}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="flex-1 border p-1 font-mono text-xs file:mr-2 file:border-0 file:bg-brand-charcoal file:text-white file:text-[10px] file:px-2"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        const { uploadImage } = await import('../services/dataService');
                                                        const url = await uploadImage('gyms', file);
                                                        if (url) setEditingGym({ ...editingGym, profilePhoto: url });
                                                    } catch (err) { alert("Upload failed"); }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <textarea className="border p-2 text-xs font-mono w-full h-24" value={editingGym?.description || ''} onChange={e => setEditingGym({ ...editingGym, description: e.target.value })} placeholder="Short description..." required />
                                <div className="flex gap-2 pt-4">
                                    <button type="button" onClick={() => { setIsGymFormOpen(false); setEditingGym(null); }} className="flex-1 bg-gray-200 border-2 border-brand-charcoal py-2 font-black uppercase text-xs hover:bg-gray-300">Cancel</button>
                                    <button type="submit" className="flex-1 bg-brand-charcoal text-white border-2 border-brand-charcoal py-2 font-black uppercase text-xs hover:bg-brand-blue">Submit for Approval</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-black text-2xl uppercase mb-4 text-brand-charcoal">No Facility Found</h2>
                            <p className="font-mono text-sm max-w-md mb-6 text-gray-600">
                                Your owner account is not linked to any Gym or Camp yet. You need to create one and wait for Admin approval.
                            </p>
                            <button onClick={() => { setEditingGym({ category: 'gym' }); setIsGymFormOpen(true); }} className="bg-brand-charcoal text-white font-bold uppercase px-6 py-3 hover:bg-brand-blue flex items-center gap-2 shadow-[4px_4px_0px_0px_#AE3A17] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_#AE3A17] transition-all">
                                <Plus className="w-5 h-5" /> Register Gym / Camp
                            </button>
                        </>
                    )}
                </div>
            );
        }
        return <div className="p-12 text-center font-mono animate-pulse">LOADING MANAGEMENT CONSOLE...</div>;
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal min-h-[80vh]">
            {/* Header */}
            <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <Mono className="text-brand-blue">Gym Owner Console</Mono>
                    <h1 className="text-3xl md:text-4xl font-black uppercase text-brand-charcoal mt-2">{myGym.name}</h1>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase w-fit">
                        <Shield className="w-4 h-4" />
                        Owner Access
                    </div>
                    {myGym.approvalStatus === 'approved' ? (
                        <div className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-200 shadow-sm">
                            <Check className="w-3 h-3" /> Approved & Verified
                        </div>
                    ) : myGym.approvalStatus === 'rejected' ? (
                        <div className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 border border-red-200 shadow-sm">
                            <X className="w-3 h-3" /> Rejected
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-orange-600 bg-orange-50 px-2 py-1 border border-orange-200 shadow-sm">
                            <Activity className="w-3 h-3 animate-pulse" /> Pending Approval (Under Review)
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
                    <div>
                        <Mono className="text-brand-blue">Total Revenue</Mono>
                        <div className="text-3xl font-black mt-2">฿{totalRevenue.toLocaleString()}</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-gray-200" />
                </div>
                <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
                    <div>
                        <Mono className="text-brand-blue">Total Bookings</Mono>
                        <div className="text-3xl font-black mt-2">{gymBookings.length}</div>
                    </div>
                    <Users className="w-8 h-8 text-gray-200" />
                </div>
                <div className="bg-white border-2 border-brand-charcoal p-6 flex items-center justify-between">
                    <div>
                        <Mono className="text-brand-blue">Active Trainers</Mono>
                        <div className="text-3xl font-black mt-2">{myGym.trainers.length}</div>
                    </div>
                    <Activity className="w-8 h-8 text-brand-blue" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Left Col: Management */}
                <div className="space-y-12">

                    {/* Gym Details & Trainers */}
                    <BlockTable title="Facility Management" icon={<Edit className="w-4 h-4" />}>
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-mono text-xs text-gray-500">Manage your facility details</span>
                            {myGym.approvalStatus === 'pending' ? (
                                <span className="text-[10px] font-mono font-bold text-orange-600 uppercase">Locked: Waiting Admin Approval</span>
                            ) : (
                                <button
                                    onClick={() => { setEditingGym(myGym); setIsGymFormOpen(true); }}
                                    className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue"
                                >
                                    <Edit className="w-3 h-3" /> Edit Profile
                                </button>
                            )}
                        </div>

                        {isGymFormOpen && (
                            <div className="p-6 bg-brand-bone border-b-2 border-brand-charcoal">
                                {managingScheduleFor ? (
                                    // SCHEDULE MANAGER
                                    <div className="animate-reveal">
                                        <div className="flex justify-between items-center mb-4 border-b border-brand-charcoal pb-2">
                                            <h4 className="font-black uppercase text-sm">Schedule: {managingScheduleFor.name}</h4>
                                            <button onClick={() => setManagingScheduleFor(null)} className="text-xs font-mono underline hover:text-brand-red">Close</button>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                {trainerSchedules.length === 0 && <div className="text-xs text-gray-400 font-mono">No slots set.</div>}
                                                {trainerSchedules.map(s => (
                                                    <div key={s.id} className="flex justify-between items-center bg-white p-2 border border-gray-200">
                                                        <div className="text-xs font-mono">
                                                            <span className="font-bold mr-2">{s.dayOfWeek}</span>
                                                            {s.startTime} - {s.endTime}
                                                        </div>
                                                        <button onClick={async () => {
                                                            await deleteTrainerSchedule(s.id);
                                                            setTrainerSchedules(await getTrainerSchedules(managingScheduleFor.id));
                                                        }} className="text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
                                                <select className="border p-1 text-xs font-mono" value={newSchedule.day} onChange={e => setNewSchedule({ ...newSchedule, day: e.target.value })}>
                                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                                <input type="time" className="border p-1 text-xs" value={newSchedule.start} onChange={e => setNewSchedule({ ...newSchedule, start: e.target.value })} />
                                                <input type="time" className="border p-1 text-xs" value={newSchedule.end} onChange={e => setNewSchedule({ ...newSchedule, end: e.target.value })} />
                                            </div>
                                            <button onClick={async () => {
                                                if (!managingScheduleFor) return;
                                                await createTrainerSchedule({
                                                    trainerId: managingScheduleFor.id,
                                                    dayOfWeek: newSchedule.day,
                                                    startTime: newSchedule.start,
                                                    endTime: newSchedule.end
                                                });
                                                setTrainerSchedules(await getTrainerSchedules(managingScheduleFor.id));
                                            }} className="w-full bg-brand-charcoal text-white font-bold text-xs uppercase py-2 hover:bg-brand-blue">Add Slot</button>
                                        </div>
                                    </div>
                                ) : (
                                    // GYM & TRAINER EDIT
                                    <form className="space-y-4" onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (editingGym && editingGym.id) {
                                            // Make sure to reset approval status to pending if editing
                                            await updateGymDB(editingGym.id, { ...editingGym, approvalStatus: 'pending', isVerified: false });
                                            setIsGymFormOpen(false);
                                            refreshGyms();
                                        }
                                    }}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input className="border p-2 text-xs w-full" value={editingGym?.name} onChange={e => setEditingGym({ ...editingGym, name: e.target.value })} placeholder="Gym Name" />
                                            <select
                                                className="border p-2 text-xs w-full font-mono"
                                                value={editingGym?.category || 'gym'}
                                                onChange={e => setEditingGym({ ...editingGym, category: e.target.value as 'gym' | 'camp' })}
                                                required
                                            >
                                                <option value="gym">Gym</option>
                                                <option value="camp">Camp</option>
                                            </select>
                                            <input className="border p-2 text-xs w-full" type="number" value={editingGym?.basePrice ?? ''} onChange={e => setEditingGym({ ...editingGym, basePrice: Number(e.target.value) })} placeholder={editingGym?.category === 'camp' ? "Camp Total Price" : "Base Price (THB)"} title={editingGym?.category === 'camp' ? "Total package price" : "Price per session"} />
                                            <input className="border p-2 text-xs w-full" type="number" value={editingGym?.affiliatePercentage ?? ''} onChange={e => setEditingGym({ ...editingGym, affiliatePercentage: Number(e.target.value) })} placeholder="Affiliate Share %" title="Percentage for affiliates" />
                                        </div>

                                        {editingGym?.category === 'camp' && (
                                            <div className="grid grid-cols-2 gap-4 p-3 bg-white border">
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Start Date</label>
                                                    <input type="date" className="w-full border p-2 text-xs font-mono" value={editingGym?.startDate || ''} onChange={e => setEditingGym({ ...editingGym, startDate: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">End Date</label>
                                                    <input type="date" className="w-full border p-2 text-xs font-mono" value={editingGym?.endDate || ''} onChange={e => setEditingGym({ ...editingGym, endDate: e.target.value })} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-4">
                                            <input className="border p-2 text-xs w-full" value={editingGym?.location} onChange={e => setEditingGym({ ...editingGym, location: e.target.value })} placeholder="Location" />
                                            <div className="flex gap-2 items-center w-full">
                                                {editingGym?.profilePhoto && <img src={editingGym.profilePhoto} className="w-8 h-8 object-cover border" alt="Preview" />}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="border p-1 font-mono text-xs w-full file:mr-2 file:border-0 file:bg-brand-charcoal file:text-white file:text-[10px] file:px-2 file:cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                e.target.disabled = true;
                                                                const { uploadImage } = await import('../services/dataService');
                                                                const url = await uploadImage('gyms', file);
                                                                if (url) setEditingGym({ ...editingGym, profilePhoto: url });
                                                            } catch (err) {
                                                                alert("Failed to upload image");
                                                            } finally {
                                                                e.target.disabled = false;
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <input className="border p-2 text-xs w-full" value={editingGym?.socialMedia || ''} onChange={e => setEditingGym({ ...editingGym, socialMedia: e.target.value })} placeholder="Social Media Link (Instagram/Facebook)" />
                                            <textarea className="border p-2 text-xs w-full h-20" value={editingGym?.bio || ''} onChange={e => setEditingGym({ ...editingGym, bio: e.target.value })} placeholder="Detailed Gym Bio / History..." />
                                        </div>

                                        {/* Simple Trainer List in Edit Mode */}
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="font-bold text-xs uppercase mb-2">Trainers</h4>
                                            <div className="space-y-2 mb-4">
                                                {myGym.trainers.map(t => (
                                                    <div key={t.id} className="flex justify-between items-center bg-white p-2 text-xs border">
                                                        <span>{t.name} ({t.specialty})</span>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={async () => {
                                                                setManagingScheduleFor(t);
                                                                setTrainerSchedules(await getTrainerSchedules(t.id));
                                                            }} className="text-blue-500 underline">Schedule</button>
                                                            <button type="button" onClick={async () => {
                                                                if (confirm('Delete trainer?')) {
                                                                    await deleteTrainer(t.id);
                                                                    refreshGyms();
                                                                }
                                                            }} className="text-red-500">Del</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input className="border p-1 text-xs flex-1" placeholder="New Trainer Name" value={newTrainer.name} onChange={e => setNewTrainer({ ...newTrainer, name: e.target.value })} />
                                                <input className="border p-1 text-xs w-24" placeholder="Specialty" value={newTrainer.specialty} onChange={e => setNewTrainer({ ...newTrainer, specialty: e.target.value })} />
                                                <button type="button" onClick={async () => {
                                                    if (newTrainer.name && myGym.id) {
                                                        await createTrainer({ ...newTrainer, gymId: myGym.id, pricePerSession: 500 } as any);
                                                        refreshGyms();
                                                    }
                                                }} className="bg-brand-blue text-white px-2 font-bold text-xs">+</button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 mt-4">
                                            <button type="button" onClick={() => setIsGymFormOpen(false)} className="px-4 py-2 font-bold text-xs uppercase bg-gray-200">Cancel</button>
                                            <button type="submit" className="px-4 py-2 font-bold text-xs uppercase bg-brand-charcoal text-white">Save Changes</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Read Only View when not editing */}
                        {!isGymFormOpen && (
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                    <div>
                                        <span className="text-gray-400 block">Location</span>
                                        {myGym.location}
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">Base Price</span>
                                        ฿{myGym.basePrice}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <span className="font-bold text-xs uppercase block mb-2">Trainers ({myGym.trainers.length})</span>
                                    <div className="flex flex-wrap gap-2">
                                        {myGym.trainers.map(t => (
                                            <span key={t.id} className="bg-gray-100 px-2 py-1 text-[10px] font-mono border border-gray-200">
                                                {t.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </BlockTable>

                </div>

                {/* Right Col: Reports */}
                <div className="space-y-12">
                    <BlockTable title="Booking History (Ledger)" icon={<Activity className="w-4 h-4" />}>
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <input
                                type="date"
                                className="w-full border p-2 text-xs font-mono"
                                value={bookingDateFilter}
                                onChange={e => setBookingDateFilter(e.target.value)}
                            />
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                            {filteredBookings.length === 0 ? <div className="p-8 text-center text-xs text-gray-400 font-mono">No bookings found</div> :
                                filteredBookings.map(b => (
                                    <div key={b.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-xs uppercase">{b.userName}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{b.status}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-mono text-gray-500">
                                            <span>{b.date} • {b.type}</span>
                                            <span className="font-bold text-brand-charcoal">฿{b.totalPrice}</span>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </BlockTable>
                </div>
            </div>

        </div>
    );
};

export default OwnerDashboard;
