import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Shield, Lock, CreditCard, Tag, Sparkles } from 'lucide-react';
import { Gym, User, Booking, Trainer, TrainerSchedule, Course } from '../lib/types';
import { getReferralCode } from '../lib/affiliate';
import { createBooking, getTrainerSchedules, getTrainerBookings, getCourses, validateAffiliateCode, getSystemSetting } from '../services/dataService';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import { PROMPTPAY_NUMBER } from '../lib/constants';

interface BookingPageProps {
    gyms: Gym[];
    user: User | null;
    setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
        {children}
    </span>
);

const BookingPage: React.FC<BookingPageProps> = ({ gyms, user, setBookings }) => {
    const { gymId } = useParams<{ gymId: string }>();
    const navigate = useNavigate();
    const [gym, setGym] = useState<Gym | null>(null);

    // Booking State
    const [step, setStep] = useState<'booking' | 'payment'>('booking');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [type, setType] = useState<'standard' | 'private' | 'course'>('standard');
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Course State
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Affiliate State
    const [referralCode, setReferralCode] = useState<string>('');
    const [referralApplied, setReferralApplied] = useState(false);
    const [codeValid, setCodeValid] = useState<boolean | null>(null);

    const checkAffiliateCode = async () => {
        if (!referralCode) {
            setCodeValid(null);
            return;
        }
        const isValid = await validateAffiliateCode(referralCode);
        setCodeValid(isValid);
    };

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'promptpay'>('card');
    const [dynamicPromptPayNumber, setDynamicPromptPayNumber] = useState(PROMPTPAY_NUMBER);

    // Private Session State
    const [availableSlots, setAvailableSlots] = useState<TrainerSchedule[]>([]);
    const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);

    const getDayName = (dateStr: string) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date(dateStr).getDay()];
    };

    const calculateSessionCount = () => {
        if (!startDate) return 0;
        if (type === 'course') return 1; // Course is a single unit
        if (!endDate) return 1;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (type === 'standard') {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays + 1;
        } else {
            // Private: Weekly Recurrence
            let count = 0;
            let current = new Date(start);
            while (current <= end) {
                count++;
                current.setDate(current.getDate() + 7);
            }
            return count;
        }
    };

    useEffect(() => {
        // Fetch Courses for this Gym
        const loadCourses = async () => {
            if (!gymId) return;
            const allCourses = await getCourses();
            const gymCourses = allCourses.filter(c => c.gymId === gymId && c.isActive);
            setCourses(gymCourses);
        };
        loadCourses();

        // Private availability check
        if (type === 'private' && selectedTrainer && startDate) {
            const fetchSchedule = async () => {
                const schedules = await getTrainerSchedules(selectedTrainer.id);
                // Check bookings for the start date only for now
                const bookings = await getTrainerBookings(selectedTrainer.id, startDate);

                const dayName = getDayName(startDate);
                const relevantSlots = schedules.filter(s => s.dayOfWeek === dayName);

                // Filter out taken slots
                const freeSlots = relevantSlots.filter(s =>
                    !bookings.some(b => b.startTime === s.startTime)
                );

                setAvailableSlots(freeSlots);
                setSelectedTime(null); // Reset selection
            };
            fetchSchedule();
        }
    }, [type, selectedTrainer, startDate, gymId]);

    useEffect(() => {
        const foundGym = gyms.find(g => g.id === gymId);
        if (foundGym) {
            setGym(foundGym);
        } else {
            navigate('/');
        }

        const code = getReferralCode();
        if (code) {
            setReferralCode(code);
            validateAffiliateCode(code).then(isValid => {
                if (isValid) setReferralApplied(true);
                setCodeValid(isValid);
            });
        }
    }, [gymId, gyms, navigate]);

    // Fetch PromptPay Number
    useEffect(() => {
        getSystemSetting('promptpay_number').then(num => {
            if (num) setDynamicPromptPayNumber(num);
        });
    }, []);

    // Auth Guard
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bone">
                <div className="bg-white p-10 border-2 border-brand-charcoal text-center shadow-[8px_8px_0px_0px_#AE3A17]">
                    <Lock className="w-12 h-12 mx-auto mb-4 text-brand-charcoal" />
                    <h2 className="font-black text-2xl uppercase mb-2">Access Denied</h2>
                    <p className="font-mono text-sm mb-6">Please log in to secure a slot.</p>
                    <Link to="/" className="inline-block bg-brand-blue text-white font-bold uppercase py-3 px-6 hover:bg-brand-charcoal transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!gym) return null;

    const calculateTotal = () => {
        if (type === 'course' && selectedCourse) return selectedCourse.price;

        let oneSessionPrice = gym.basePrice;
        if (gym.isFlashSale) oneSessionPrice = oneSessionPrice * (1 - gym.flashSaleDiscount / 100);
        if (type === 'private' && selectedTrainer) oneSessionPrice += selectedTrainer.pricePerSession;

        const count = calculateSessionCount();
        return Math.round(oneSessionPrice * count);
    };

    const handleProceedToPayment = () => {
        if (!startDate) return alert("Please select a start date.");

        if (type === 'standard' || type === 'private') {
            if (endDate && new Date(endDate) < new Date(startDate)) return alert("End date cannot be before start date.");
        }

        if (type === 'private' && !selectedTime) return alert("Please select a time slot.");
        if (type === 'course' && !selectedCourse) return alert("Please select a course.");

        setStep('payment');
    };

    const handleConfirmPayment = async () => {
        setIsProcessing(true);
        try {
            const count = calculateSessionCount();
            const start = new Date(startDate);
            const total = calculateTotal();
            const pricePerSession = type === 'course' ? total : total / count;

            const bookingPromises = [];

            if (type === 'course') {
                // Single Booking Record for Course
                const bookingPayload: Partial<Booking> = {
                    gymId: gym.id,
                    gymName: gym.name,
                    userId: user.id,
                    userName: user.name,
                    date: startDate,
                    type: 'course',
                    courseId: selectedCourse?.id,
                    courseTitle: selectedCourse?.title,
                    totalPrice: total,
                    commissionPaidTo: (referralCode && codeValid) ? referralCode : undefined,
                    commissionAmount: (referralCode && codeValid) ? Math.round(total * ((gym.affiliatePercentage || 0) / 100)) : 0,
                    status: 'confirmed'
                };
                bookingPromises.push(createBooking(bookingPayload));
            } else {
                // Loop for sessions
                const end = endDate ? new Date(endDate) : new Date(startDate);
                let current = new Date(start);
                while (current <= end) {
                    const dateStr = current.toISOString().split('T')[0];

                    const bookingPayload: Partial<Booking> = {
                        gymId: gym.id,
                        gymName: gym.name,
                        userId: user.id,
                        userName: user.name,
                        date: dateStr,
                        type: type,
                        trainerId: selectedTrainer?.id || undefined,
                        trainerName: selectedTrainer?.name,
                        startTime: selectedTime?.start,
                        endTime: selectedTime?.end,
                        totalPrice: Math.round(pricePerSession),
                        commissionPaidTo: (referralCode && codeValid) ? referralCode : undefined,
                        commissionAmount: (referralCode && codeValid) ? Math.round(pricePerSession * ((gym.affiliatePercentage || 0) / 100)) : 0,
                        status: 'confirmed'
                    };
                    bookingPromises.push(createBooking(bookingPayload));

                    if (type === 'standard') {
                        current.setDate(current.getDate() + 1);
                    } else {
                        current.setDate(current.getDate() + 7);
                    }
                }
            }

            await Promise.all(bookingPromises);
            setIsProcessing(false);
            navigate('/dashboard');
        } catch (error) {
            console.error("Booking Error:", error);
            alert("Payment processing failed. Please try again or contact support.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bone animate-reveal">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                <div className="relative h-[300px] lg:h-auto bg-gray-900 border-r-2 border-brand-charcoal order-1 lg:order-none">
                    <img
                        src={gym.images[0]}
                        alt={gym.name}
                        className="w-full h-full object-cover opacity-60 grayscale mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 p-8 lg:p-16 flex flex-col justify-between">
                        <Link to="/" className="inline-flex items-center gap-2 text-white font-mono text-xs font-bold uppercase hover:text-brand-red transition-colors w-fit">
                            <ArrowLeft className="w-4 h-4" /> Return
                        </Link>
                        <div>
                            <div className="inline-block bg-brand-blue text-white font-mono text-xs font-bold px-3 py-1 mb-4 uppercase">
                                {gym.location}
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-white uppercase leading-[0.9] mb-6">
                                {gym.name}
                            </h1>
                            <div className="flex gap-4 text-gray-300 font-mono text-sm">
                                <span>• Authentic Muay Thai</span>
                                <span>• {gym.trainers.length} Trainers</span>
                                <span>• {courses.length} Courses</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white flex flex-col justify-center p-8 lg:p-24 relative order-2 lg:order-none">
                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-10 flex items-center justify-between border-b-2 border-brand-charcoal pb-4">
                            <h2 className="font-black text-2xl uppercase text-brand-charcoal">
                                {step === 'booking' ? 'Secure Booking' : 'Finalize Payment'}
                            </h2>
                            <Shield className="w-6 h-6 text-brand-blue" />
                        </div>

                        {step === 'booking' ? (
                            <div className="space-y-8 mb-12 animate-reveal">

                                {/* Class Type */}
                                <div className="space-y-3">
                                    <label className="font-mono text-xs font-bold text-brand-blue block">01 // SELECT EXPERIENCE</label>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => setType('standard')} className={`flex-1 p-3 border-2 font-mono text-[10px] md:text-xs font-bold uppercase transition-all ${type === 'standard' ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_0px_#3471AE]' : 'border-gray-200 text-gray-400 hover:border-brand-blue'}`}>
                                            Daily
                                        </button>
                                        {gym.trainers.length > 0 && (
                                            <button onClick={() => setType('private')} className={`flex-1 p-3 border-2 font-mono text-[10px] md:text-xs font-bold uppercase transition-all ${type === 'private' ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_0px_#3471AE]' : 'border-gray-200 text-gray-400 hover:border-brand-blue'}`}>
                                                Private
                                            </button>
                                        )}
                                        {courses.length > 0 && (
                                            <button onClick={() => setType('course')} className={`flex-1 p-3 border-2 font-mono text-[10px] md:text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 ${type === 'course' ? 'border-brand-charcoal bg-brand-charcoal text-white shadow-[4px_4px_0px_0px_#3471AE]' : 'border-gray-200 text-gray-400 hover:border-brand-blue'}`}>
                                                {courses.length > 0 && <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>}
                                                Course
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Date Selection */}
                                <div className="space-y-3">
                                    <label className="font-mono text-xs font-bold text-brand-blue block">02 // SELECT DATES</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] font-mono text-gray-400 block mb-1">START DATE</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => {
                                                    setStartDate(e.target.value);
                                                    if (!endDate) setEndDate(e.target.value);
                                                }}
                                                className="w-full bg-brand-bone border-2 border-gray-200 p-4 font-mono text-brand-charcoal text-xs focus:border-brand-blue focus:outline-none transition-colors"
                                            />
                                        </div>
                                        {type !== 'course' && (
                                            <div>
                                                <span className="text-[10px] font-mono text-gray-400 block mb-1">END DATE</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    min={startDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    className="w-full bg-brand-bone border-2 border-gray-200 p-4 font-mono text-brand-charcoal text-xs focus:border-brand-blue focus:outline-none transition-colors"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right font-mono text-xs font-bold text-brand-red">
                                        {type === 'standard' && `DURATION: ${calculateSessionCount()} DAYS`}
                                        {type === 'private' && `SESSIONS: ${calculateSessionCount()} TIMES (WEEKLY)`}
                                        {type === 'course' && `COURSE START: ${startDate || 'PENDING'}`}
                                    </div>
                                </div>

                                {/* Private Trainer Selection */}
                                {type === 'private' && (
                                    <div className="space-y-3 animate-reveal">
                                        <label className="font-mono text-xs font-bold text-brand-blue block">03 // SELECT KRU</label>
                                        <div className="space-y-2">
                                            {gym.trainers.map(t => (
                                                <div
                                                    key={t.id}
                                                    onClick={() => setSelectedTrainer(t)}
                                                    className={`flex items-center gap-4 p-3 border-2 cursor-pointer transition-colors ${selectedTrainer?.id === t.id ? 'border-brand-charcoal bg-brand-bone' : 'border-gray-100 hover:border-brand-blue'}`}
                                                >
                                                    <div className="w-10 h-10 bg-gray-200 overflow-hidden">
                                                        <img src={t.image} alt={t.name} className="w-full h-full object-cover grayscale" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-sm uppercase">{t.name}</div>
                                                        <Mono className="text-[10px] text-gray-500">{t.specialty}</Mono>
                                                    </div>
                                                    <div className="font-mono text-xs font-bold">+฿{t.pricePerSession}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Course Selection */}
                                {type === 'course' && (
                                    <div className="space-y-3 animate-reveal">
                                        <label className="font-mono text-xs font-bold text-brand-blue block">03 // SELECT CURRICULUM</label>
                                        <div className="space-y-2">
                                            {courses.length === 0 ? (
                                                <div className="p-4 border-2 border-dashed border-gray-300 text-center font-mono text-xs text-gray-400">
                                                    NO COURSES AVAILABLE AT THIS BRANCH
                                                </div>
                                            ) : (
                                                courses.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => setSelectedCourse(c)}
                                                        className={`p-4 border-2 cursor-pointer transition-colors group ${selectedCourse?.id === c.id ? 'border-brand-charcoal bg-brand-bone' : 'border-gray-100 hover:border-brand-blue'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="font-black text-sm uppercase">{c.title}</div>
                                                            <div className="bg-brand-blue text-white text-[10px] font-bold px-2 py-1">{c.duration}</div>
                                                        </div>
                                                        <p className="font-mono text-[10px] text-gray-500 mb-2">{c.description?.slice(0, 100)}...</p>
                                                        <div className="font-black text-lg text-brand-red">฿{c.price.toLocaleString()}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Private Time Selection */}
                                {type === 'private' && selectedTrainer && startDate && (
                                    <div className="space-y-3 animate-reveal">
                                        <label className="font-mono text-xs font-bold text-brand-blue block">04 // SELECT TIME SLOT ({getDayName(startDate)})</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {availableSlots.length === 0 ? (
                                                <div className="col-span-full font-mono text-xs text-gray-400 p-4 border border-dashed border-gray-300 text-center">
                                                    NO SLOTS AVAILABLE ON THIS DAY
                                                </div>
                                            ) : (
                                                availableSlots.map(slot => (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => setSelectedTime({ start: slot.startTime, end: slot.endTime })}
                                                        className={`p-3 font-mono text-xs font-bold border-2 transition-colors ${selectedTime?.start === slot.startTime && selectedTime?.end === slot.endTime
                                                            ? 'bg-brand-charcoal text-white border-brand-charcoal'
                                                            : 'bg-white border-gray-200 hover:border-brand-blue text-brand-charcoal'
                                                            }`}
                                                    >
                                                        {slot.startTime} - {slot.endTime}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t-2 border-dashed border-gray-200">
                                    <div className="flex justify-between items-end">
                                        <Mono className="text-gray-500">Projected Total</Mono>
                                        <div className="text-3xl font-black text-gray-400">
                                            ฿{calculateTotal().toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleProceedToPayment}
                                    className="w-full bg-brand-charcoal text-white font-black uppercase py-5 text-lg hover:bg-brand-blue transition-colors flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_#AE3A17]"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        ) : (
                            // --- STEP 2: PAYMENT PAGE ---
                            <div className="space-y-8 mb-12 animate-reveal">
                                <div className="bg-brand-bone p-6 border-2 border-brand-charcoal">
                                    <h3 className="font-black uppercase text-sm mb-4 border-b border-brand-charcoal pb-2">Order Summary</h3>
                                    <div className="space-y-2 font-mono text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Gym</span>
                                            <span className="font-bold">{gym.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Start Date</span>
                                            <span className="font-bold">{startDate}</span>
                                        </div>

                                        {/* Dynamic Details based on Type */}
                                        {type === 'standard' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">End Date</span>
                                                <span className="font-bold">{endDate} ({calculateSessionCount()} Days)</span>
                                            </div>
                                        )}

                                        {type === 'course' && selectedCourse && (
                                            <>
                                                <div className="flex justify-between text-brand-blue">
                                                    <span>Program</span>
                                                    <span className="font-bold">{selectedCourse.title}</span>
                                                </div>
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Duration</span>
                                                    <span>{selectedCourse.duration}</span>
                                                </div>
                                            </>
                                        )}

                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Type</span>
                                            <span className="font-bold uppercase">{type}</span>
                                        </div>
                                        {type === 'private' && selectedTrainer && (
                                            <div className="flex justify-between text-brand-blue">
                                                <span className="">Trainer</span>
                                                <span className="font-bold">{selectedTrainer.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t-2 border-dashed border-brand-charcoal flex justify-between items-end">
                                        <span className="font-black uppercase">Total Due</span>
                                        <span className="text-3xl font-black">฿{calculateTotal().toLocaleString()}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-mono text-xs font-bold text-brand-blue block mb-2">PARTNER CODE (OPTIONAL)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter Code"
                                            value={referralCode || ''}
                                            onChange={(e) => {
                                                setReferralCode(e.target.value);
                                                setCodeValid(null);
                                                setReferralApplied(false);
                                            }}
                                            className={`flex-1 bg-white border-2 p-3 font-mono uppercase focus:outline-none ${codeValid === true ? 'border-green-500 text-green-700' :
                                                codeValid === false ? 'border-red-500 text-red-700' :
                                                    'border-gray-200 focus:border-brand-blue'
                                                }`}
                                        />
                                        <button
                                            onClick={checkAffiliateCode}
                                            disabled={!referralCode}
                                            className={`border-2 px-4 flex items-center justify-center font-bold uppercase text-xs transition-colors ${codeValid === true ? 'bg-green-500 border-green-500 text-white' :
                                                codeValid === false ? 'bg-red-500 border-red-500 text-white' :
                                                    'bg-gray-100 border-gray-200 text-gray-500 hover:bg-brand-charcoal hover:border-brand-charcoal hover:text-white'
                                                }`}
                                        >
                                            {codeValid === true ? 'APPLIED' : codeValid === false ? 'INVALID' : 'CHECK'}
                                        </button>
                                    </div>
                                    <p className="font-mono text-[10px] text-gray-400 mt-2">
                                        *Referral supports your local community.
                                    </p>
                                </div>

                                <div>
                                    <label className="font-mono text-xs font-bold text-brand-blue block mb-2">PAYMENT METHOD</label>

                                    <div className="flex gap-2 mb-4">
                                        <button
                                            onClick={() => setPaymentMethod('card')}
                                            className={`flex-1 p-3 border-2 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-brand-charcoal bg-white text-brand-charcoal' : 'border-gray-200 text-gray-400 bg-gray-50'}`}
                                        >
                                            <CreditCard className="w-4 h-4" /> Credit Card
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('promptpay')}
                                            className={`flex-1 p-3 border-2 font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${paymentMethod === 'promptpay' ? 'border-brand-blue bg-white text-brand-blue' : 'border-gray-200 text-gray-400 bg-gray-50'}`}
                                        >
                                            <span className="text-[10px]">฿</span> PromptPay
                                        </button>
                                    </div>

                                    {paymentMethod === 'card' ? (
                                        <div className="opacity-50 pointer-events-none grayscale border-2 border-gray-200 p-4 flex items-center gap-4 bg-gray-50 animate-reveal">
                                            <CreditCard className="w-6 h-6 text-gray-400" />
                                            <span className="font-mono text-sm text-gray-500">•••• •••• •••• 4242</span>
                                            <span className="font-mono text-xs text-brand-blue ml-auto font-bold">VISA</span>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-brand-blue p-6 bg-white text-center animate-reveal relative overflow-hidden">
                                            <div className="absolute top-0 left-0 bg-brand-blue text-white text-[10px] font-bold px-2 py-1">THAI QR PAYMENT</div>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png" className="h-6 mx-auto mb-4 opacity-80" alt="PromptPay" />
                                            <div className="w-40 h-40 bg-white mx-auto mb-4 p-2 border-2 border-brand-charcoal flex items-center justify-center">
                                                <QRCodeSVG
                                                    value={generatePayload(dynamicPromptPayNumber, { amount: calculateTotal() })}
                                                    size={140}
                                                    level="L"
                                                />
                                            </div>
                                            <p className="font-mono text-sm font-bold text-brand-charcoal mb-1">
                                                Total: ฿{calculateTotal().toLocaleString()}
                                            </p>
                                            <p className="font-mono text-[10px] text-gray-500">
                                                Scan using any Banking App
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setStep('booking')}
                                        disabled={isProcessing}
                                        className="flex-1 border-2 border-brand-charcoal text-brand-charcoal font-bold uppercase py-4 hover:bg-gray-100 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleConfirmPayment}
                                        disabled={isProcessing}
                                        className="flex-[2] bg-brand-red text-white font-black uppercase py-4 hover:bg-brand-charcoal transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_#1A1A1A] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_#1A1A1A]"
                                    >
                                        {isProcessing ? 'Processing...' : 'Pay & Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-4">
                            <Mono className="text-[10px] text-gray-400">Encrypted via Stripe • THAIKICK Guarantee</Mono>
                        </div>

                    </div>
                </div>
            </div>
        </div >
    );
};

export default BookingPage;