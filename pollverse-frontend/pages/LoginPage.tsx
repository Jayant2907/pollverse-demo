import React, { useState, useEffect, useRef } from 'react';
import { AppLogo, ChevronLeftIcon } from '../components/Icons';

interface LoginPageProps {
    onLoginSuccess: () => void;
    onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
    const [step, setStep] = useState<'enter_mobile' | 'enter_otp'>('enter_mobile');
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);

    // Force focus when step changes
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);

    const handleSendOtp = () => {
        if (mobile.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        setError('');
        console.log("OTP Sent (mock): 123456"); 
        setStep('enter_otp');
    };

    const handleVerifyOtp = () => {
        if (otp === '123456') { 
            setError('');
            onLoginSuccess();
        } else {
            setError('Invalid OTP. Please try again.');
        }
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in p-6 justify-center text-center">
            <button onClick={onBack} className="absolute top-4 left-4 text-blue-600 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <ChevronLeftIcon />
            </button>
            <div className="w-full max-w-sm mx-auto">
                <div className="flex justify-center"><AppLogo /></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">Welcome to PollVerse</h1>
                
                {step === 'enter_mobile' ? (
                    <div key="step-mobile">
                        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Enter your mobile number to continue.</p>
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="font-semibold text-gray-500 pl-2">+91</span>
                            <input
                                ref={inputRef}
                                type="tel"
                                autoFocus
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="98765 43210"
                                className="w-full bg-transparent p-2 text-lg font-semibold focus:outline-none"
                                maxLength={10}
                            />
                        </div>
                        <button onClick={handleSendOtp} className="w-full mt-6 p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                            Send OTP
                        </button>
                    </div>
                ) : (
                    <div key="step-otp">
                        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">Enter the 6-digit OTP sent to +91 {mobile}.</p>
                        <input
                            ref={inputRef}
                            type="text"
                            autoFocus
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="_ _ _ _ _ _"
                            className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-lg p-3 text-center text-2xl tracking-[1em] font-semibold focus:ring-blue-500 focus:border-blue-500"
                            maxLength={6}
                        />
                        <button onClick={handleVerifyOtp} className="w-full mt-6 p-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                            Verify & Sign In
                        </button>
                        <button onClick={() => setStep('enter_mobile')} className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline">
                            Change Number
                        </button>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            </div>
        </div>
    );
};

export default LoginPage;