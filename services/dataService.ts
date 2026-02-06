
import { supabase } from '../lib/supabaseClient';
import { Gym, Booking, User, Trainer, TrainerSchedule, Course } from '../lib/types';

// --- Gym Services ---

export const getGyms = async (): Promise<Gym[]> => {
    const { data, error } = await supabase
        .from('gyms')
        .select(`
      *,
      trainers (*)
    `);

    if (error) {
        console.error('Error fetching gyms:', error);
        return [];
    }

    // Transform data to match our frontend Query/Type structure if needed
    // Note: Supabase returns snake_case by default, you might need mapping if your types are camelCase
    // For now assuming we map it manually or Types match DB columns loosely.
    // A proper mapper would be ideal here.
    return data.map((gym: any) => ({
        id: gym.id,
        name: gym.name,
        category: gym.category || 'gym',
        location: gym.location,
        description: gym.description,
        images: gym.images || [],
        basePrice: gym.base_price,
        ownerId: gym.owner_id,
        trainers: gym.trainers.map((t: any) => ({
            id: t.id,
            name: t.name,
            specialty: t.specialty,
            image: t.image_url,
            pricePerSession: t.price_per_session
        })),
        isFlashSale: gym.is_flash_sale,
        flashSaleDiscount: gym.flash_sale_discount,
        affiliatePercentage: gym.affiliate_percentage
    })) as unknown as Gym[];
};

export const getGymById = async (id: string): Promise<Gym | null> => {
    const { data, error } = await supabase
        .from('gyms')
        .select(`
      *,
      trainers (*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching gym ${id}:`, error);
        return null;
    }

    return {
        id: data.id,
        name: data.name,
        category: data.category || 'gym',
        location: data.location,
        description: data.description,
        images: data.images || [],
        basePrice: data.base_price,
        ownerId: data.owner_id,
        trainers: data.trainers.map((t: any) => ({
            id: t.id,
            name: t.name,
            specialty: t.specialty,
            image: t.image_url,
            pricePerSession: t.price_per_session
        })),
        isFlashSale: data.is_flash_sale,
        flashSaleDiscount: data.flash_sale_discount,
        affiliatePercentage: data.affiliate_percentage
    } as unknown as Gym;
};

export const createGym = async (gym: Partial<Gym>) => {
    // Map Frontend types to DB columns
    const dbGym = {
        name: gym.name,
        category: gym.category || 'gym',
        location: gym.location,
        description: gym.description,
        images: gym.images || [],
        base_price: gym.basePrice ?? 0,
        owner_id: gym.ownerId, // Optional, might be null for admin created
        affiliate_percentage: gym.affiliatePercentage || 0
    };

    const { data, error } = await supabase
        .from('gyms')
        .insert(dbGym)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateGym = async (id: string, gym: Partial<Gym>) => {
    const dbGym: any = {};
    if (gym.name) dbGym.name = gym.name;
    if (gym.category) dbGym.category = gym.category;
    if (gym.location) dbGym.location = gym.location;
    if (gym.description) dbGym.description = gym.description;
    if (gym.images) dbGym.images = gym.images;
    if (gym.basePrice !== undefined) dbGym.base_price = gym.basePrice;
    if (gym.affiliatePercentage !== undefined) dbGym.affiliate_percentage = gym.affiliatePercentage;

    // Safety check just in case
    if (Object.keys(dbGym).length === 0) return;

    const { data, error } = await supabase
        .from('gyms')
        .update(dbGym)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteGym = async (id: string) => {
    // 1. Delete associated Bookings first
    const { error: bookingError } = await supabase
        .from('bookings')
        .delete()
        .eq('gym_id', id);
    if (bookingError) throw bookingError;

    // 2. Delete associated Trainers
    const { error: trainerError } = await supabase
        .from('trainers')
        .delete()
        .eq('gym_id', id);
    if (trainerError) throw trainerError;

    // 3. Delete the Gym
    const { error } = await supabase
        .from('gyms')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Trainer Services ---

export const createTrainer = async (trainer: Partial<Trainer> & { gymId: string }) => {
    const dbTrainer = {
        gym_id: trainer.gymId,
        name: trainer.name,
        specialty: trainer.specialty,
        price_per_session: trainer.pricePerSession,
        image_url: trainer.image,
    };

    const { data, error } = await supabase
        .from('trainers')
        .insert(dbTrainer)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteTrainer = async (id: string) => {
    const { error } = await supabase
        .from('trainers')
        .delete()
        .eq('id', id);

    if (error) throw error;
    if (error) throw error;
};

export const getTrainerSchedules = async (trainerId: string): Promise<TrainerSchedule[]> => {
    const { data, error } = await supabase
        .from('trainer_schedules')
        .select('*')
        .eq('trainer_id', trainerId);

    if (error) {
        console.error('Error fetching schedules:', error);
        return [];
    }

    return data.map((s: any) => ({
        id: s.id,
        trainerId: s.trainer_id,
        dayOfWeek: s.day_of_week,
        startTime: s.start_time,
        endTime: s.end_time
    }));
};

export const createTrainerSchedule = async (schedule: Partial<TrainerSchedule>) => {
    const dbSchedule = {
        trainer_id: schedule.trainerId,
        day_of_week: schedule.dayOfWeek,
        start_time: schedule.startTime,
        end_time: schedule.endTime
    };

    const { data, error } = await supabase
        .from('trainer_schedules')
        .insert(dbSchedule)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteTrainerSchedule = async (id: string) => {
    const { error } = await supabase
        .from('trainer_schedules')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Booking Services ---

export const createBooking = async (booking: Partial<Booking>) => {
    // Convert camelCase to snake_case for DB
    const dbBooking = {
        user_id: booking.userId,
        gym_id: booking.gymId,
        trainer_id: booking.trainerId,
        date: booking.date,
        type: booking.type,
        total_price: booking.totalPrice,
        status: 'confirmed',
        commission_amount: booking.commissionAmount || 0,
        start_time: booking.startTime,
        end_time: booking.endTime,
        course_id: booking.courseId
    };

    const { data, error } = await supabase
        .from('bookings')
        .insert(dbBooking)
        .select()
        .single();

    if (error) {
        throw error;
    }
    return data;
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      gym:gyms (name),
      trainer:trainers (name),
      user:users!bookings_user_id_fkey (name),
      course:courses (title)
    `)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        gymId: b.gym_id,
        gymName: b.gym?.name || 'Unknown Gym',
        userId: b.user_id,
        userName: b.user?.name || 'Unknown User',
        date: b.date,
        type: b.type,
        trainerId: b.trainer_id,
        trainerName: b.trainer?.name,
        totalPrice: b.total_price,
        status: b.status,
        commissionAmount: b.commission_amount,
        startTime: b.start_time,
        endTime: b.end_time,
        courseId: b.course_id,
        courseTitle: b.course?.title
    }));
};

export const getAllBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
      *,
      gym:gyms (name),
      trainer:trainers (name),
      user:users!bookings_user_id_fkey (name),
      course:courses (title)
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all bookings:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        gymId: b.gym_id,
        gymName: b.gym?.name || 'Unknown Gym',
        userId: b.user_id,
        userName: b.user?.name || 'Unknown User',
        date: b.date,
        type: b.type,
        trainerId: b.trainer_id,
        trainerName: b.trainer?.name,
        totalPrice: b.total_price,
        status: b.status,
        commissionAmount: b.commission_amount,
        startTime: b.start_time,
        endTime: b.end_time,
        courseId: b.course_id,
        courseTitle: b.course?.title
    }));
};

export const getTrainerBookings = async (trainerId: string, date: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('date', date)
        .neq('status', 'cancelled');

    if (error) {
        console.error('Error checking availability:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        gymId: b.gym_id,
        gymName: '',
        userId: b.user_id,
        userName: '',
        date: b.date,
        type: b.type,
        trainerId: b.trainer_id,
        trainerName: '',
        totalPrice: b.total_price,
        status: b.status,
        commissionAmount: b.commission_amount,
        startTime: b.start_time,
        endTime: b.end_time,
        courseId: b.course_id,
        courseTitle: b.course?.title
    }));
};

export const getGymBookings = async (gymId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select(`
            *,
            gym:gyms (name),
            trainer:trainers (name),
            user:users!bookings_user_id_fkey (name),
            course:courses (title)
        `)
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching gym bookings:', error);
        return [];
    }

    return data.map((b: any) => ({
        id: b.id,
        gymId: b.gym_id,
        gymName: b.gym?.name || 'Unknown Gym',
        userId: b.user_id,
        userName: b.user?.name || 'Unknown User',
        date: b.date,
        type: b.type,
        trainerId: b.trainer_id,
        trainerName: b.trainer?.name,
        totalPrice: b.total_price,
        status: b.status,
        commissionAmount: b.commission_amount,
        startTime: b.start_time,
        endTime: b.end_time,
        courseId: b.course_id,
        courseTitle: b.course?.title
    }));
};

// --- Affiliate Services ---

export const createAffiliateApplication = async (userId: string, reason: string) => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .insert({
            user_id: userId,
            reason: reason,
            status: 'pending'
        })
        .select()
        .single();

    if (error) throw error;

    await supabase.from('users').update({ affiliate_status: 'pending' }).eq('id', userId);
    return data;
};

export const getAffiliateApplications = async () => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .select('*, user:users (name, email)')
        .eq('status', 'pending')  // FIXED: Only active requests
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return data.map((app: any) => ({
        id: app.id,
        userId: app.user_id,
        userName: app.user?.name || 'Unknown',
        userEmail: app.user?.email,
        reason: app.reason,
        status: app.status
    }));
};

export const updateAffiliateApplicationStatus = async (appId: string, status: 'approved' | 'rejected') => {
    const { data, error } = await supabase
        .from('affiliate_applications')
        .update({ status })
        .eq('id', appId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateUserAffiliateStatus = async (userId: string, isAffiliate: boolean, status: string, code?: string) => {
    const updates: any = {
        is_affiliate: isAffiliate,
        affiliate_status: status
    };
    if (code) updates.affiliate_code = code;

    const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

    if (error) throw error;
};

// --- System Settings ---

export const getSystemSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return null;
    }
    return data.value;
};

export const updateSystemSetting = async (key: string, value: string) => {
    const { error } = await supabase
        .from('system_settings')
        .update({ value })
        .eq('key', key);

    if (error) throw error;
};

export const validateAffiliateCode = async (code: string): Promise<boolean> => {
    if (!code) return false;
    // Use Security Definer RPC to check code without exposing users table
    const { data, error } = await supabase.rpc('check_affiliate_code', { code });

    if (error) {
        console.error('Error validating code:', error);
        return false;
    }
    return !!data;
};

// --- Announcement Services ---

export const getAnnouncements = async () => {
    const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }

    return data.map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        imageUrl: a.image_url,
        isActive: a.is_active,
        createdAt: a.created_at
    }));
};

export const createAnnouncement = async (title: string, content: string, imageUrl?: string) => {
    const dbAnnouncement = {
        title,
        content,
        image_url: imageUrl,
        is_active: true
    };

    const { data, error } = await supabase
        .from('announcements')
        .insert(dbAnnouncement)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- User Services ---
export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }


    return data.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatar: u.avatar_url,
        isAffiliate: u.is_affiliate,
        affiliateEarnings: u.affiliate_earnings,
        affiliateStatus: u.affiliate_status,
        affiliateCode: u.affiliate_code
    }));
};

export const updateUserRole = async (userId: string, role: string) => {
    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

    if (error) throw error;
};


// --- Course Services ---

export const getCourses = async (): Promise<Course[]> => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching courses:', error);
        return [];
    }

    return data.map((c: any) => ({
        id: c.id,
        gymId: c.gym_id,
        title: c.title,
        description: c.description,
        price: c.price,
        duration: c.duration,
        maxStudents: c.max_students,
        designData: c.design_data,
        imageUrl: c.image_url,
        isActive: c.is_active
    }));
};

export const createCourse = async (course: Partial<Course>) => {
    const dbCourse = {
        gym_id: course.gymId,
        title: course.title,
        description: course.description,
        price: course.price,
        duration: course.duration,
        max_students: course.maxStudents,
        design_data: course.designData,
        image_url: course.imageUrl,
        is_active: true
    };

    const { data, error } = await supabase
        .from('courses')
        .insert(dbCourse)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCourse = async (id: string, course: Partial<Course>) => {
    const dbCourse: any = {};
    if (course.gymId) dbCourse.gym_id = course.gymId;
    if (course.title) dbCourse.title = course.title;
    if (course.description) dbCourse.description = course.description;
    if (course.price) dbCourse.price = course.price;
    if (course.duration) dbCourse.duration = course.duration;
    if (course.maxStudents) dbCourse.max_students = course.maxStudents;
    if (course.designData) dbCourse.design_data = course.designData;
    if (course.imageUrl) dbCourse.image_url = course.imageUrl;
    if (course.isActive !== undefined) dbCourse.is_active = course.isActive;

    const { data, error } = await supabase
        .from('courses')
        .update(dbCourse)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCourse = async (id: string) => {
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
