
import { supabase } from '../lib/supabaseClient';
import { User } from '../lib/types';

// Map Supabase User to our App User Type
const mapUser = (sbUser: any, profile: any): User => {
    let role = profile?.role || 'customer';
    if (role === 'owner') role = 'gymowner';

    return {
        id: sbUser.id,
        name: profile?.name || sbUser.email?.split('@')[0] || 'Unknown Fighter',
        email: sbUser.email || '',
        role: role as any,
        avatar: profile?.avatar_url || 'https://via.placeholder.com/150',
        isAffiliate: profile?.is_affiliate || false,
        affiliateCode: profile?.affiliate_code,
        affiliateEarnings: profile?.affiliate_earnings || 0,
        affiliateStatus: profile?.affiliate_status || 'none',
        ownedGymName: profile?.owned_gym_name
    };
};

export const signUp = async (email: string, password: string, name: string) => {
    // 1. Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name } // Pass metadata to be saved automatically or accessible in triggers
        }
    });

    if (error) throw error;

    // Note: We have a trigger 'on_auth_user_created' in our schema 
    // that automatically creates the public.users record.
    // So we don't need to manually insert into public.users here.

    return data;
};

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
};

export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        }
    });

    if (error) throw error;
    return data;
};

export const signInWithFacebook = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                prompt: 'consent',
            },
        }
    });

    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
    // 1. Get Session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // 2. Fetch Profile from public.users
    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.warn('Profile not found for auth user:', session.user.id);
        // Return basic user info from Auth if profile missing (fallback)
        return mapUser(session.user, null);
    }

    return mapUser(session.user, profile);
};

export const resetPasswordForEmail = async (email: string) => {
    // Redirect to the same page but with a hash to detect recovery
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
    });
    if (error) throw error;
};

export const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
};

export const requestDataDeletion = async (userId: string) => {
    // 1. Log the deletion request
    // For now, we'll mark the user as 'DELETED' in public.users 
    // and the admin can handle the full Auth deletion from Supabase Dashboard.
    const { error } = await supabase
        .from('users')
        .update({
            name: 'DELETED USER',
            affiliate_status: 'none',
            role: 'customer'
        })
        .eq('id', userId);

    if (error) throw error;

    // 2. Sign the user out
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
};
