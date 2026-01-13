import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, CameraIcon, SaveIcon } from '../components/Icons';

interface EditProfilePageProps {
    onBack: () => void;
    currentUser: User;
    onUpdateUser: (user: User) => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack, currentUser, onUpdateUser }) => {
    const [formData, setFormData] = useState({
        username: currentUser.username || '',
        avatar: currentUser.avatar || '',
        phoneNumber: currentUser.phoneNumber || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        profession: currentUser.profession || '',
        interests: currentUser.interests || [],
        socialLinks: currentUser.socialLinks || { twitter: '', instagram: '', linkedin: '', github: '' }
    });

    const [newInterest, setNewInterest] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        onUpdateUser({ ...currentUser, ...formData });
        onBack();
    };

    const addInterest = () => {
        if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, newInterest.trim()]
            }));
            setNewInterest('');
        }
    };

    const removeInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interest)
        }));
    };

    return (
        <div className="h-full w-full bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in overflow-hidden">
            <header className="flex-shrink-0 flex items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 justify-between z-10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ChevronLeftIcon />
                </button>
                <h1 className="text-lg font-bold">Edit Profile</h1>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-1"
                >
                    <SaveIcon />
                    <span>Save</span>
                </button>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-6 pb-20">
                {/* Avatar Section */}
                <div className="flex flex-col items-center py-4">
                    <div className="relative">
                        <img
                            src={formData.avatar}
                            alt={formData.username}
                            className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-xl object-cover"
                        />
                        <button
                            onClick={handleAvatarClick}
                            className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg border-2 border-white dark:border-gray-900 transition-transform active:scale-90"
                        >
                            <CameraIcon />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                    <p className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Picture</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Basic Information</h3>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Username</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                placeholder="+1 234 567 890"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm min-h-[100px]"
                                placeholder="Tell the world about yourself..."
                            />
                        </div>
                    </div>

                    {/* Professional & Location */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Professional & Social</h3>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Profession</label>
                            <input
                                type="text"
                                value={formData.profession}
                                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                placeholder="Developer, Student, Designer..."
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                placeholder="San Francisco, CA"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Website</label>
                            <input
                                type="url"
                                value={formData.website}
                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                placeholder="https://example.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Interests Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Interests (Help us personalize your feed)</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.interests.map(interest => (
                            <span
                                key={interest}
                                className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-scale-in"
                            >
                                {interest}
                                <button onClick={() => removeInterest(interest)} className="hover:text-red-500">×</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newInterest}
                            onChange={(e) => setNewInterest(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                            className="flex-grow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add an interest (e.g. Technology)"
                        />
                        <button
                            onClick={addInterest}
                            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Social Links */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Social Profiles</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 text-xl">🐦</span>
                            <input
                                type="text"
                                value={formData.socialLinks.twitter}
                                onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: e.target.value } }))}
                                className="flex-grow bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                                placeholder="Twitter handle"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-8 text-xl">📸</span>
                            <input
                                type="text"
                                value={formData.socialLinks.instagram}
                                onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))}
                                className="flex-grow bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                                placeholder="Instagram username"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-8 text-xl">💼</span>
                            <input
                                type="text"
                                value={formData.socialLinks.linkedin}
                                onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))}
                                className="flex-grow bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                                placeholder="LinkedIn profile"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-8 text-xl">🐙</span>
                            <input
                                type="text"
                                value={formData.socialLinks.github}
                                onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, github: e.target.value } }))}
                                className="flex-grow bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-2 text-sm outline-none"
                                placeholder="GitHub username"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;