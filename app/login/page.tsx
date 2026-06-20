"use client";
import React, { useState } from 'react';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/admin'); // ล็อกอินสำเร็จให้เด้งไปหน้าแอดมิน
        } catch (err: any) {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] font-['IBM_Plex_Sans_Thai']">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tighter mb-2">SORASAK.</h1>
                    <p className="text-gray-500 text-sm">เข้าสู่ระบบเพื่อจัดการพอร์ตโฟลิโอ</p>
                </div>

                {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">อีเมล</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                               className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-gray-900 transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">รหัสผ่าน</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                               className="w-full border border-gray-200 rounded-lg p-3 outline-none focus:border-gray-900 transition" />
                    </div>
                    
                    <button type="submit" disabled={isLoading} 
                            className={`w-full text-white font-medium py-3 rounded-lg transition mt-4 ${isLoading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-gray-800'}`}>
                        {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>
            </div>
        </div>
    );
}