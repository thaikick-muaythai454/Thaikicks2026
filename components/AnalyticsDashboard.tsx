
import React, { useState, useEffect } from 'react';
import { Booking } from '../lib/types';
import { Activity, ArrowLeft, TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AnalyticsDashboardProps {
    bookings: Booking[];
}

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
        {children}
    </span>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ bookings }) => {
    // Calculate Metrics
    const validBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const totalRevenue = validBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalBookings = validBookings.length;

    // Trainer Stats
    const trainerStats: Record<string, number> = {};
    validBookings.forEach(b => {
        const name = b.trainerName || 'Unassigned';
        trainerStats[name] = (trainerStats[name] || 0) + b.totalPrice;
    });
    const topTrainers = Object.entries(trainerStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Gym Stats
    const gymStats: Record<string, number> = {};
    validBookings.forEach(b => {
        const name = b.gymName || 'Unknown';
        gymStats[name] = (gymStats[name] || 0) + b.totalPrice;
    });
    const topGyms = Object.entries(gymStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal min-h-screen">
            {/* Header */}
            <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex justify-between items-end">
                <div>
                    <Link to="/admin" className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-brand-charcoal mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Console
                    </Link>
                    <Mono className="text-brand-red">Deep Insights</Mono>
                    <h1 className="text-4xl font-black uppercase text-brand-charcoal mt-2">Business Analytics</h1>
                </div>
                <div className="hidden md:block">
                    <div className="bg-brand-charcoal text-white px-4 py-2 font-mono text-xs font-bold uppercase">
                        Live Data
                    </div>
                </div>
            </div>

            {/* Primary Chart: 7 Day Trend */}
            <div className="mb-12 border-2 border-brand-charcoal p-8 bg-brand-bone relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="font-black uppercase text-xl flex items-center gap-2">
                        <Activity className="w-6 h-6 text-brand-blue" />
                        Revenue Performance (7 Days)
                    </h3>
                </div>

                <div className="h-80 flex items-end justify-between gap-4 relative z-10">
                    {(() => {
                        const last7Days = Array.from({ length: 7 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (6 - i));
                            return d.toISOString().split('T')[0];
                        });

                        const chartData = last7Days.map(date => {
                            const dayTotal = bookings
                                .filter(b => b.date === date && (b.status === 'confirmed' || b.status === 'completed'))
                                .reduce((sum, b) => sum + b.totalPrice, 0);
                            return { date, total: dayTotal };
                        });

                        const maxVal = Math.max(...chartData.map(d => d.total), 1000); // Min scale 1000

                        return chartData.map((d, i) => (
                            <div key={d.date} className="flex-1 flex flex-col justify-end h-full gap-2 group cursor-pointer">
                                <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-8 bg-brand-charcoal text-white font-mono text-xs p-3 shadow-lg pointer-events-none z-20">
                                    <span className="text-brand-red mr-2">●</span>
                                    {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}:
                                    <span className="font-bold ml-2">฿{d.total.toLocaleString()}</span>
                                </div>
                                <div
                                    className="w-full bg-brand-charcoal hover:bg-brand-red transition-all duration-300 relative group-hover:shadow-[0_0_20px_rgba(240,68,56,0.4)]"
                                    style={{ height: `${(d.total / maxVal) * 85}%`, minHeight: '4px' }}
                                >
                                    {d.total > 0 && (
                                        <div className="absolute -top-6 w-full text-center font-mono text-[10px] text-brand-charcoal font-bold opacity-50 group-hover:opacity-100">
                                            {(d.total / 1000).toFixed(1)}k
                                        </div>
                                    )}
                                </div>
                                <div className="text-center font-mono text-[10px] text-gray-400 border-t border-gray-300 pt-2 group-hover:text-brand-charcoal transition-colors">
                                    {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Top Trainers */}
                <div className="border-2 border-brand-charcoal bg-white">
                    <div className="p-4 border-b-2 border-brand-charcoal bg-gray-50 flex justify-between items-center">
                        <h3 className="font-black uppercase text-sm">Top Performing Trainers</h3>
                        <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {topTrainers.map(([name, val], i) => (
                            <div key={name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-lg text-gray-200 w-6">#{i + 1}</span>
                                    <span className="font-bold text-brand-charcoal uppercase text-sm">{name}</span>
                                </div>
                                <span className="font-mono text-xs text-brand-blue">฿{val.toLocaleString()}</span>
                            </div>
                        ))}
                        {topTrainers.length === 0 && <div className="p-8 text-center text-xs font-mono text-gray-400">No data available</div>}
                    </div>
                </div>

                {/* Top Gyms */}
                <div className="border-2 border-brand-charcoal bg-white">
                    <div className="p-4 border-b-2 border-brand-charcoal bg-gray-50 flex justify-between items-center">
                        <h3 className="font-black uppercase text-sm">Top Revenue Locations</h3>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="divide-y divide-gray-100">
                        {topGyms.map(([name, val], i) => (
                            <div key={name} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-lg text-gray-200 w-6">#{i + 1}</span>
                                    <span className="font-bold text-brand-charcoal uppercase text-sm">{name}</span>
                                </div>
                                <span className="font-mono text-xs text-brand-blue">฿{val.toLocaleString()}</span>
                            </div>
                        ))}
                        {topGyms.length === 0 && <div className="p-8 text-center text-xs font-mono text-gray-400">No data available</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
