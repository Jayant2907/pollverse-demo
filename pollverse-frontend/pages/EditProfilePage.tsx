import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ChevronLeftIcon, CameraIcon } from '../components/Icons';

interface EditProfilePageProps {
    onBack: () => void;
    currentUser: User;
    onUpdateUser: (user: User) => void;
}

const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack, currentUser, onUpdateUser }) => {
    const [username, setUsername] = useState(currentUser.username);
    const [avatar, setAvatar] = useState(currentUser.avatar);
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
                    setAvatar(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = () => {
        onUpdateUser({ ...currentUser, username, avatar });
        onBack();
    };

    return (
        <div className="h-full w-full bg-white dark:bg-black text-gray-800 dark:text-gray-200 flex flex-col animate-fade-in">
            <header className="flex-shrink-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 justify-between">
                <button onClick={onBack} className="text-blue-600 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeftIcon /></button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h1>
                <button onClick={handleSave} className="font-semibold text-blue-600">Save</button>
            </header>
            <div className="p-6 space-y-6">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <img src={avatar} alt={username} className="w-32 h-32 rounded-full border-4 border-white dark:border-black shadow-lg object-cover" />
                        <button onClick={handleAvatarClick} className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                           <CameraIcon />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">Username</label>
                    <input 
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};

export default EditProfilePage;