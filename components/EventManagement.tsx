import React, { useState, useEffect } from 'react';
import { TicketEvent, TicketType, getEvents, getTicketTypes, createEvent, updateEvent, deleteEvent, createTicketType, updateTicketType, deleteTicketType } from '../services/ticketService';
import { Calendar, Edit, Trash2, Plus, Users, MapPin } from 'lucide-react';

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

const EventManagement: React.FC = () => {
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [editingEvent, setEditingEvent] = useState<Partial<TicketEvent> | null>(null);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);

    // Ticket Management
    const [managingTicketsFor, setManagingTicketsFor] = useState<TicketEvent | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [newTicket, setNewTicket] = useState<Partial<TicketType>>({ name: '', description: '', price: 0, total_quantity: 100 });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        // Admin request
        const data = await getEvents(true);
        setEvents(data);
    };

    const loadTicketsForEvent = async (event: TicketEvent) => {
        setManagingTicketsFor(event);
        const types = await getTicketTypes(event.id);
        setTicketTypes(types);
    };

    const handleSaveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent?.title || !editingEvent?.event_date) return alert("Title and date are required");

        try {
            if (editingEvent.id) {
                await updateEvent(editingEvent.id, editingEvent);
            } else {
                await createEvent({
                    title: editingEvent.title,
                    description: editingEvent.description || '',
                    cover_image: editingEvent.cover_image || '',
                    event_date: editingEvent.event_date,
                    location: editingEvent.location || '',
                    is_active: editingEvent.is_active !== false
                });
            }
            setIsEventFormOpen(false);
            setEditingEvent(null);
            await loadEvents();
        } catch (err: any) {
            console.error(err);
            alert("Failed to save event. " + err.message);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm("Delete this event? All tickets will also be removed!")) return;
        try {
            await deleteEvent(id);
            await loadEvents();
            if (managingTicketsFor?.id === id) setManagingTicketsFor(null);
        } catch (err) {
            console.error(err);
            alert("Failed to delete event");
        }
    };

    const handleAddTicketType = async () => {
        if (!managingTicketsFor) return;
        if (!newTicket.name || typeof newTicket.price !== 'number' || typeof newTicket.total_quantity !== 'number') {
            return alert("Fill all required ticket fields");
        }

        try {
            await createTicketType({
                event_id: managingTicketsFor.id,
                name: newTicket.name,
                description: newTicket.description || '',
                price: newTicket.price,
                total_quantity: newTicket.total_quantity,
                available_quantity: newTicket.total_quantity
            });
            setNewTicket({ name: '', description: '', price: 0, total_quantity: 100 });
            const types = await getTicketTypes(managingTicketsFor.id);
            setTicketTypes(types);
        } catch (err: any) {
            console.error(err);
            alert("Failed to add ticket type. " + err.message);
        }
    };

    const handleDeleteTicketType = async (id: string) => {
        if (!managingTicketsFor) return;
        if (!confirm("Delete this ticket type?")) return;
        try {
            await deleteTicketType(id);
            const types = await getTicketTypes(managingTicketsFor.id);
            setTicketTypes(types);
        } catch (err: any) {
            console.error(err);
            alert("Failed to delete ticket. " + err.message);
        }
    };


    return (
        <BlockTable title="Fight Event & Tickets Console" icon={<Calendar className="w-4 h-4" />}>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <span className="font-mono text-xs text-brand-blue font-bold uppercase">Manage Fight Events</span>
                <button
                    onClick={() => {
                        // set default date to today
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                        setEditingEvent({ event_date: now.toISOString().slice(0, 16), is_active: true });
                        setIsEventFormOpen(true);
                    }}
                    className="bg-brand-charcoal text-white px-3 py-1 font-mono text-xs font-bold uppercase flex items-center gap-2 hover:bg-brand-blue"
                >
                    <Plus className="w-3 h-3" /> New Event
                </button>
            </div>

            {isEventFormOpen && (
                <div className="p-6 bg-brand-bone border-b-2 border-brand-charcoal animate-reveal pb-6">
                    <form onSubmit={handleSaveEvent} className="space-y-4">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-300 pb-2">
                            <h4 className="font-black uppercase text-sm">{editingEvent?.id ? 'Edit Event' : 'Create Event'}</h4>
                            <button type="button" onClick={() => setIsEventFormOpen(false)} className="text-xs font-mono underline hover:text-brand-red">Close</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Event Title</label>
                                <input className="w-full border p-2 font-mono text-xs" value={editingEvent?.title || ''} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} placeholder="e.g. THAI KICK: THE AWAKENING" required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Date & Time</label>
                                <input type="datetime-local" className="w-full border p-2 font-mono text-xs"
                                    value={editingEvent?.event_date ? new Date(editingEvent.event_date).toISOString().slice(0, 16) : ''}
                                    onChange={e => setEditingEvent({ ...editingEvent, event_date: new Date(e.target.value).toISOString() })} required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Location</label>
                                <input className="w-full border p-2 font-mono text-xs" value={editingEvent?.location || ''} onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} placeholder="Lumpinee Stadium" required />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold mb-1">Status</label>
                                <select className="w-full border p-2 font-mono text-xs" value={editingEvent?.is_active ? 'active' : 'inactive'} onChange={e => setEditingEvent({ ...editingEvent, is_active: e.target.value === 'active' })} required>
                                    <option value="active">Active (Visible)</option>
                                    <option value="inactive">Inactive (Hidden)</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold mb-1">Cover Image URL</label>
                            <input className="w-full border p-2 font-mono text-xs" value={editingEvent?.cover_image || ''} onChange={e => setEditingEvent({ ...editingEvent, cover_image: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold mb-1">Description</label>
                            <textarea className="w-full border p-2 font-mono text-xs h-16" value={editingEvent?.description || ''} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-brand-charcoal">
                            <button type="button" onClick={() => setIsEventFormOpen(false)} className="px-4 py-2 font-mono text-xs font-bold uppercase hover:bg-gray-200">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase hover:bg-green-600">Save Event</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ticket Manager Overlay (Replaces event list if managing tickets) */}
            {managingTicketsFor ? (
                <div className="p-6 bg-white animate-reveal">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-brand-charcoal">
                        <div>
                            <Mono className="text-brand-blue block">Ticket Management</Mono>
                            <h4 className="font-black uppercase text-xl text-brand-charcoal">{managingTicketsFor.title}</h4>
                        </div>
                        <button onClick={() => setManagingTicketsFor(null)} className="text-xs font-mono font-bold uppercase bg-gray-100 px-4 py-2 hover:bg-gray-200">
                            &larr; Back to Events
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Tiers List */}
                        <div>
                            <h5 className="font-bold text-xs uppercase mb-4 text-gray-500">Current Ticket Tiers</h5>
                            <div className="space-y-4">
                                {ticketTypes.length === 0 && <div className="text-xs text-gray-400 font-mono italic">No tickets added yet.</div>}

                                {ticketTypes.map(t => (
                                    <div key={t.id} className="border border-gray-200 p-4 bg-gray-50 flex justify-between group">
                                        <div>
                                            <div className="font-black uppercase text-base">{t.name}</div>
                                            <div className="font-mono text-xs text-gray-500 mt-1 max-w-[200px] truncate">{t.description}</div>
                                            <div className="font-mono text-[10px] font-bold mt-2 uppercase text-brand-blue">
                                                {t.available_quantity} / {t.total_quantity} LEFT
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-between items-end">
                                            <div className="font-mono text-lg font-black text-brand-charcoal">฿{t.price}</div>
                                            <button onClick={() => handleDeleteTicketType(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Add Ticket Tier */}
                        <div className="bg-brand-bone p-6 border-l-4 border-brand-charcoal h-min">
                            <h5 className="font-black text-sm uppercase mb-4 shadow-[4px_4px_0px_0px_#1A1A1A] bg-white inline-block px-4 py-2 border-2 border-brand-charcoal">
                                + Add Ticket Tier
                            </h5>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1">Tier Name (e.g. RINGSIDE VIP)</label>
                                    <input className="w-full border p-2 font-mono text-xs" value={newTicket.name} onChange={e => setNewTicket({ ...newTicket, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold mb-1">Description / Perks</label>
                                    <input className="w-full border p-2 font-mono text-xs" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold mb-1">Price (THB)</label>
                                        <input type="number" className="w-full border p-2 font-mono text-xs" value={newTicket.price} onChange={e => setNewTicket({ ...newTicket, price: Number(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold mb-1">Total Quantity</label>
                                        <input type="number" className="w-full border p-2 font-mono text-xs" value={newTicket.total_quantity} onChange={e => setNewTicket({ ...newTicket, total_quantity: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <button onClick={handleAddTicketType} className="w-full uppercase font-black text-xs py-3 bg-brand-charcoal text-white hover:bg-brand-red transition-colors border-2 border-brand-charcoal">
                                    Create Ticket Tier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                    {events.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-mono text-xs">No events found. Create one above.</div>
                    ) : (
                        events.map(e => (
                            <div key={e.id} className="p-4 flex justify-between items-center hover:bg-gray-50 group transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* Event Thumbnail */}
                                    <div className="w-16 h-16 bg-brand-charcoal flex-shrink-0 relative overflow-hidden hidden md:block border border-gray-300">
                                        {e.cover_image ? (
                                            <img src={e.cover_image} alt={e.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white"><Calendar size={20} /></div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-black text-sm lg:text-base uppercase text-brand-charcoal">{e.title}</div>
                                            {!e.is_active && <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 text-[10px] uppercase">Inactive</span>}
                                        </div>
                                        <div className="font-mono text-xs text-gray-500 uppercase flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(e.event_date).toLocaleString()}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => loadTicketsForEvent(e)} className="font-mono text-[10px] font-bold uppercase bg-brand-blue text-white px-3 py-2 hover:bg-brand-charcoal flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Tickets
                                    </button>
                                    <button onClick={() => { setEditingEvent(e); setIsEventFormOpen(true); }} className="font-mono text-[10px] font-bold uppercase border border-gray-300 text-gray-600 px-3 py-2 hover:bg-gray-100 flex items-center gap-2">
                                        <Edit className="w-3 h-3" /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteEvent(e.id)} className="font-mono text-[10px] font-bold uppercase border border-red-200 text-red-500 px-3 py-2 hover:bg-red-50 flex items-center gap-2">
                                        <Trash2 className="w-3 h-3" /> Del
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </BlockTable>
    );
};

export default EventManagement;
