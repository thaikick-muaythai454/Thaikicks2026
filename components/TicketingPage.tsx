import React, { useState, useEffect } from 'react';
import { getEvents, getTicketTypes, TicketEvent, TicketType, createTicketCheckoutSession } from '../services/ticketService';
import { useNavigate } from 'react-router-dom';
import { User } from '../lib/types';
import { Calendar, MapPin, Tag } from 'lucide-react';

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
        {children}
    </span>
);

const TicketingPage: React.FC<{ user: User | null }> = ({ user }) => {
    const [events, setEvents] = useState<TicketEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<TicketEvent | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        getEvents().then(data => {
            setEvents(data);
            if (data.length > 0) {
                handleSelectEvent(data[0]);
            } else {
                setLoading(false);
            }
        });
    }, []);

    const handleSelectEvent = async (event: TicketEvent) => {
        setSelectedEvent(event);
        setLoading(true);
        const types = await getTicketTypes(event.id);
        setTicketTypes(types);
        setLoading(false);
    };

    const handleBuyTicket = async (ticket: TicketType) => {
        if (!user) {
            alert("PLEASE LOGIN TO PURCHASE TICKETS");
            return;
        }

        try {
            setCheckoutLoading(true);
            // Stripe logic is implemented via Edge Function or handled correctly
            // For now, simulating checkout redirect
            alert(`Simulation Mode: Redirecting to Stripe Checkout for ${ticket.name} (฿${ticket.price.toLocaleString()})`);
            setCheckoutLoading(false);
        } catch (err) {
            console.error(err);
            alert("Checkout failed");
            setCheckoutLoading(false);
        }
    };

    if (loading && !selectedEvent) {
        return <div className="min-h-[50vh] flex items-center justify-center font-mono text-brand-blue uppercase">Loading Fights...</div>;
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-16">
            <div className="mb-16">
                <Mono className="text-brand-red block mb-2">Live Action</Mono>
                <h1 className="text-[clamp(4rem,8vw,8rem)] font-black text-brand-charcoal leading-[0.8] tracking-widest uppercase">
                    FIGHT<br />TICKETS
                </h1>
            </div>

            {events.length === 0 ? (
                <div className="border border-brand-charcoal p-12 text-center">
                    <Mono className="text-brand-charcoal opacity-50">No upcoming events currently scheduled.</Mono>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-24 items-start">

                    {/* Main Event Area (Massive Typographic Focus + Extreme Asymmetry) */}
                    <div className="relative border-2 border-brand-charcoal overflow-hidden group shadow-[12px_12px_0px_0px_#1A1A1A]">
                        <img
                            src={selectedEvent?.cover_image}
                            alt={selectedEvent?.title}
                            className="w-full h-auto min-h-[500px] object-cover contrast-125 grayscale hover:grayscale-0 transition-all duration-700 max-h-[80vh]"
                        />
                        {/* Absolute Text Overlay for Tension */}
                        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-12 bg-gradient-to-t from-brand-charcoal/90 via-transparent to-transparent text-white">
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-brand-bone leading-none mb-6">
                                {selectedEvent?.title}
                            </h2>
                            <div className="flex flex-col gap-4 font-mono text-xs uppercase max-w-sm bg-brand-charcoal/80 p-6 border-l-4 border-brand-red backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-4 h-4 text-brand-red" />
                                    {new Date(selectedEvent?.event_date || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-brand-red" />
                                    <span className="truncate">{selectedEvent?.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Selection (Layered Depth) */}
                    <div className="flex flex-col gap-4 relative md:mt-24">
                        <h3 className="text-3xl font-black uppercase border-b-4 border-brand-charcoal pb-4 mb-4 text-brand-charcoal sticky top-24 z-10">Select Tier</h3>

                        <div className="relative">
                            {ticketTypes.map((ticket, i) => (
                                <div
                                    key={ticket.id}
                                    className="group relative bg-white border-2 border-brand-charcoal p-6 transition-all duration-300 hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0px_0px_#AE3A17] cursor-pointer mb-6"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="text-xl md:text-2xl font-black uppercase text-brand-charcoal tracking-wide leading-none">{ticket.name}</h4>
                                            {ticket.name.includes('VIP') && <span className="font-mono text-[10px] bg-brand-charcoal text-white px-3 py-1 mt-3 inline-block font-bold">PREMIUM</span>}
                                        </div>
                                        <div className="text-right whitespace-nowrap pl-4">
                                            <div className="font-mono text-2xl font-black text-brand-charcoal">฿{ticket.price.toLocaleString()}</div>
                                            <div className="font-mono text-[10px] text-gray-400 mt-1 uppercase font-bold">{ticket.available_quantity} LEFT</div>
                                        </div>
                                    </div>

                                    <p className="font-mono text-xs text-gray-500 mb-8 max-w-[280px] leading-relaxed uppercase border-l-2 border-gray-200 pl-4">
                                        {ticket.description}
                                    </p>

                                    <button
                                        onClick={() => handleBuyTicket(ticket)}
                                        disabled={ticket.available_quantity <= 0 || checkoutLoading}
                                        className={`w-full py-5 px-6 font-black uppercase text-sm tracking-widest transition-all flex justify-between items-center group-hover:px-8 ${ticket.available_quantity <= 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                                                : 'bg-brand-red text-white hover:bg-brand-charcoal border-2 border-transparent hover:border-brand-charcoal'
                                            }`}
                                    >
                                        <span>{ticket.available_quantity <= 0 ? 'SOLD OUT' : 'SECURE TICKET'}</span>
                                        <span className="font-mono">↗</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 font-mono text-[10px] text-gray-400 uppercase leading-relaxed text-justify">
                            * ALL SALES ARE FINAL. TICKETS WILL BE SENT TO YOUR REGISTERED EMAIL IMMEDIATELY UPON SUCCESSFUL PAYMENT via Stripe. E-TICKET QR CODE IS REQUIRED FOR ENTRY. NO SEAT SELECTION REQUIRED.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketingPage;
