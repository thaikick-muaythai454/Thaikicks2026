import { supabase } from '../lib/supabaseClient';

export interface TicketEvent {
    id: string;
    title: string;
    description: string;
    cover_image: string;
    event_date: string;
    location: string;
    is_active: boolean;
}

export interface TicketType {
    id: string;
    event_id: string;
    name: string;
    description: string;
    price: number;
    total_quantity: number;
    available_quantity: number;
}

// Ensure returned events include all (even inactive if admin, but here we just fetch all for admin, and active for public)
export const getEvents = async (admin: boolean = false): Promise<TicketEvent[]> => {
    let query = supabase.from('events').select('*').order('event_date', { ascending: true });

    if (!admin) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }
    return data || [];
};

export const getTicketTypes = async (eventId: string): Promise<TicketType[]> => {
    const { data, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: false });

    if (error) {
        console.error('Error fetching ticket types:', error);
        return [];
    }
    return data || [];
};

export const createTicketCheckoutSession = async (ticketTypeId: string, eventId: string, quantity: number = 1) => {
    const { data, error } = await supabase.functions.invoke('create-ticket-checkout', {
        body: { ticketTypeId, eventId, quantity }
    });

    if (error) throw error;
    return data;
};

// Admin Endpoints
export const createEvent = async (event: Omit<TicketEvent, 'id'>) => {
    const { data, error } = await supabase.from('events').insert(event).select().single();
    if (error) throw error;
    return data;
};

export const updateEvent = async (id: string, updates: Partial<TicketEvent>) => {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
};

export const createTicketType = async (ticketType: Omit<TicketType, 'id'>) => {
    // ensuring available = total when creating
    if (!ticketType.available_quantity) ticketType.available_quantity = ticketType.total_quantity;

    const { data, error } = await supabase.from('ticket_types').insert(ticketType).select().single();
    if (error) throw error;
    return data;
};

export const updateTicketType = async (id: string, updates: Partial<TicketType>) => {
    const { data, error } = await supabase.from('ticket_types').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteTicketType = async (id: string) => {
    const { error } = await supabase.from('ticket_types').delete().eq('id', id);
    if (error) throw error;
};
