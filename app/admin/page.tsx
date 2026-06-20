"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../../lib/uploadImage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('profile');

    const [siteData, setSiteData] = useState({
        heroTitle: "Bridging Business Strategy, \nTechnology, and Leadership.", heroDesc: "สวัสดีครับ ผมมด...",
        footerTitle: "Let's build something great together.", footerDesc: "ติดต่อผมได้เลยครับ", contactEmail: "email@example.com", heroImageUrls: [] as string[]
    });
    const [heroImageFiles, setHeroImageFiles] = useState<File[]>([]);
    const [isSavingSiteData, setIsSavingSiteData] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: "", jobTitle: "", phone: "", email: "", linkedin: "", summary: "", imageUrl: "",
        experiences: [] as any[], educations: [] as any[], skills: [] as any[], projectsText: "", languagesText: ""
    });
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [title, setTitle] = useState(''); 
    const [category, setCategory] = useState('Event Management & Leadership');
    const [projectDate, setProjectDate] = useState(''); // เพิ่ม State วันที่กิจกรรม
    const [description, setDescription] = useState(''); 
    const [tags, setTags] = useState('');
    const [files, setFiles] = useState<File[]>([]); 
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [projects, setProjects] = useState<any[]>([]); 
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [isUploadingProject, setIsUploadingProject] = useState(false);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) { setIsAuthenticated(true); fetchSiteData(); fetchProfileData(); fetchProjects(); } 
            else { router.push('/login'); }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);

    const fetchSiteData = async () => {
        const docSnap = await getDoc(doc(db, "settings", "homepage"));
        if (docSnap.exists()) setSiteData({ ...docSnap.data() as any, heroImageUrls: docSnap.data().heroImageUrls || [] });
    };

    const fetchProfileData = async () => {
        const docSnap = await getDoc(doc(db, "settings", "userProfile"));
        if (docSnap.exists()) {
            const data = docSnap.data() as any;
            setProfileData({ ...data, experiences: data.experiences || [], educations: data.educations || [], skills: data.skills || [] });
        }
    };
    
    const fetchProjects = async () => {
        const q = query(collection(db, "projects"), orderBy("orderIndex", "desc"));
        const snapshot = await getDocs(q); setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    const handleLogout = async () => { await signOut(auth); router.push('/login'); };

    const addExperience = () => setProfileData(prev => ({ ...prev, experiences: [...prev.experiences, { id: Date.now(), role: "", company: "", period: "", description: "" }] }));
    const updateExperience = (id: number, field: string, value: string) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp) }));
    const removeExperience = (id: number) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.filter(exp => exp.id !== id) }));

    const addEducation = () => setProfileData(prev => ({ ...prev, educations: [...prev.educations, { id: Date.now(), faculty: "", major: "", university: "", year: "" }] }));
    const updateEducation = (id: number, field: string, value: string) => setProfileData(prev => ({ ...prev, educations: prev.educations.map(edu => edu.id === id ? { ...edu, [field]: value } : edu) }));
    const removeEducation = (id: number) => setProfileData(prev => ({ ...prev, educations: prev.educations.filter(edu => edu.id !== id) }));

    const addSkill = () => setProfileData(prev => ({ ...prev, skills: [...prev.skills, { id: Date.now(), name: "", type: "Hard Skill" }] }));
    const updateSkill = (id: number, field: string, value: string) => setProfileData(prev => ({ ...prev, skills: prev.skills.map(skill => skill.id === id ? { ...skill, [field]: value } : skill) }));
    const removeSkill = (id: number) => setProfileData(prev => ({ ...prev, skills: prev.skills.filter(skill => skill.id !== id) }));

    const handleSaveSiteData = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSavingSiteData(true);
        try {
            let finalHeroImageUrls = [...(siteData.heroImageUrls || [])];
            if (heroImageFiles.length > 0) {
                finalHeroImageUrls = [];
                for (let i = 0; i < heroImageFiles.length; i++) {
                    const url = await uploadToCloudinary(heroImageFiles[i]);
                    if (url) finalHeroImageUrls.push(url);
                }
            }
            const updatedData = { ...siteData, heroImageUrls: finalHeroImageUrls };
            await setDoc(doc(db, "settings", "homepage"), updatedData, { merge: true });
            setSiteData(updatedData); setHeroImageFiles([]); alert("บันทึกหน้าหลักสำเร็จ!");
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsSavingSiteData(false); }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSavingProfile(true);
        try {
            let finalImageUrl = profileData.imageUrl;
            if (profileImageFile) {
                const url = await uploadToCloudinary(profileImageFile);
                if (url) finalImageUrl = url;
            }
            const updatedData = { ...profileData, imageUrl: finalImageUrl };
            await setDoc(doc(db, "settings", "userProfile"), updatedData, { merge: true });
            setProfileData(updatedData); setProfileImageFile(null); alert("บันทึกประวัติและเรซูเม่สำเร็จ!");
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsSavingProfile(false); }
    };

    const handleSubmitProject = async (e: React.FormEvent) => {
        e.preventDefault(); setIsUploadingProject(true);
        try {
            let finalImageUrls = [...existingImageUrls];
            if (files.length > 0) {
                finalImageUrls = [];
                for (let i = 0; i < files.length; i++) {
                    const url = await uploadToCloudinary(files[i]);
                    if (url) finalImageUrls.push(url);
                }
            }
            // เพิ่ม date ลงใน Database
            const projectData = { title, category, date: projectDate, description, tags: tags.split(',').map(tag => tag.trim()), imageUrls: finalImageUrls };
            if (editingProjectId) { await updateDoc(doc(db, "projects", editingProjectId), projectData); alert("อัปเดตผลงานสำเร็จ!"); } 
            else { await addDoc(collection(db, "projects"), { ...projectData, createdAt: new Date(), orderIndex: Date.now() }); alert("เพิ่มผลงานสำเร็จ!"); }
            cancelEditProject(); fetchProjects();
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsUploadingProject(false); }
    };

    const handleEditProject = (p: any) => { 
        setTitle(p.title); setCategory(p.category); setProjectDate(p.date || ''); setDescription(p.description); setTags(p.tags ? p.tags.join(', ') : ''); setExistingImageUrls(p.imageUrls || (p.imageUrl ? [p.imageUrl] : [])); setEditingProjectId(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };
    const handleDeleteProject = async (id: string) => { if (window.confirm("แน่ใจหรือไม่?")) { await deleteDoc(doc(db, "projects", id)); fetchProjects(); } };
    const cancelEditProject = () => { setTitle(''); setProjectDate(''); setDescription(''); setTags(''); setFiles([]); setExistingImageUrls([]); setEditingProjectId(null); };

    if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">กำลังโหลดระบบหลังบ้าน...</div>;
    if (!isAuthenticated) return null;

    // --- สไตล์มินิมอลโมเดิร์นที่ใช้งานง่าย ---
    const inputClass = "w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-900/5 transition-all duration-300";
    const labelClass = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";
    const cardClass = "bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-fade-in";

    return (
        <div className="min-h-screen bg-[#fafafa] font-['IBM_Plex_Sans_Thai'] text-[#111827] pb-32">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold text-xs">S.</div><h1 className="text-xl font-bold tracking-tight">Workspace</h1></div>
                    <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 px-5 py-2.5 rounded-full transition">Sign out</button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 pt-12">
                <div className="flex flex-wrap gap-2 mb-12 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm w-fit">
                    {[
                        { id: 'site', label: 'หน้าแรก', icon: '✨' },
                        { id: 'profile', label: 'ประวัติ & เรซูเม่', icon: '👤' },
                        { id: 'projects', label: 'ผลงาน', icon: '📂' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
                            <span>{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'site' && (
                    <form onSubmit={handleSaveSiteData} className={cardClass}>
                        <h2 className="text-2xl font-bold mb-8">ตั้งค่าหน้าหลัก (Homepage)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div><label className={labelClass}>หัวข้อหลัก</label><textarea value={siteData.heroTitle} onChange={e=>setSiteData({...siteData, heroTitle: e.target.value})} className={`${inputClass} h-24`}></textarea></div>
                                <div><label className={labelClass}>ข้อความแนะนำตัว</label><textarea value={siteData.heroDesc} onChange={e=>setSiteData({...siteData, heroDesc: e.target.value})} className={`${inputClass} h-32`}></textarea></div>
                                <div><label className={labelClass}>รูปภาพพื้นหลังปก (อัปโหลดหลายรูปได้)</label><input type="file" accept="image/*" multiple onChange={(e) => setHeroImageFiles(Array.from(e.target.files || []))} className={inputClass} /></div>
                            </div>
                            <div className="space-y-4">
                                <div><label className={labelClass}>หัวข้อส่วนท้าย</label><input type="text" value={siteData.footerTitle} onChange={e=>setSiteData({...siteData, footerTitle: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>ข้อความชวนคุย</label><textarea value={siteData.footerDesc} onChange={e=>setSiteData({...siteData, footerDesc: e.target.value})} className={`${inputClass} h-32`}></textarea></div>
                                <div><label className={labelClass}>อีเมลสำหรับติดต่อ</label><input type="email" value={siteData.contactEmail} onChange={e=>setSiteData({...siteData, contactEmail: e.target.value})} className={inputClass} /></div>
                            </div>
                        </div>
                        <button type="submit" disabled={isSavingSiteData} className="w-full text-white bg-gray-900 hover:bg-gray-800 font-semibold py-4 rounded-full mt-8 transition">{isSavingSiteData ? "กำลังบันทึก..." : "บันทึกหน้าหลัก"}</button>
                    </form>
                )}

                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className={`${cardClass} space-y-8`}>
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold">👤 ประวัติส่วนตัว & ข้อมูลเรซูเม่</h2>
                            <p className="text-sm text-gray-500 mt-1">เว้นว่างช่องไหนไว้ ระบบจะไม่นำไปแสดงผลที่หน้าเว็บโดยอัตโนมัติ</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                                {profileData.imageUrl && !profileImageFile ? <img src={profileData.imageUrl} className="w-24 h-24 rounded-full object-cover shadow-sm" /> : <div className="w-24 h-24 rounded-full bg-white border flex items-center justify-center text-gray-300 text-2xl">📷</div>}
                                <div className="w-full">
                                    <label className={labelClass}>รูปถ่ายโปรไฟล์ (สำหรับหน้า About)</label>
                                    <input type="file" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} className={inputClass} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className={labelClass}>ชื่อ-นามสกุล</label><input type="text" value={profileData.fullName} onChange={e=>setProfileData({...profileData, fullName: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>ตำแหน่ง (Job Title สำหรับเรซูเม่)</label><input type="text" value={profileData.jobTitle} onChange={e=>setProfileData({...profileData, jobTitle: e.target.value})} className={inputClass} placeholder="เช่น PROJECT MANAGER" /></div>
                                <div><label className={labelClass}>เบอร์โทร</label><input type="text" value={profileData.phone} onChange={e=>setProfileData({...profileData, phone: e.target.value})} className={inputClass} /></div>
                                <div><label className={labelClass}>อีเมลทางการ</label><input type="email" value={profileData.email} onChange={e=>setProfileData({...profileData, email: e.target.value})} className={inputClass} /></div>
                                <div className="md:col-span-2"><label className={labelClass}>ลิงก์ LinkedIn / Website</label><input type="text" value={profileData.linkedin} onChange={e=>setProfileData({...profileData, linkedin: e.target.value})} className={inputClass} /></div>
                            </div>
                            <div><label className={labelClass}>บทสรุปตัวตน (Professional Summary)</label><textarea value={profileData.summary} onChange={e=>setProfileData({...profileData, summary: e.target.value})} className={`${inputClass} h-32`}></textarea></div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">💼 ประวัติการทำงาน</h3><button type="button" onClick={addExperience} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-full font-bold hover:bg-gray-800 transition">+ เพิ่ม</button></div>
                            {profileData.experiences.map((exp) => (
                                <div key={exp.id} className="border border-gray-100 p-6 rounded-[2rem] mb-4 relative bg-gray-50/50">
                                    <button type="button" onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 font-bold bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center">✕</button>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div><label className={labelClass}>ตำแหน่ง</label><input type="text" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} className={inputClass} /></div>
                                        <div><label className={labelClass}>ชื่อองค์กร/บริษัท</label><input type="text" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} className={inputClass} /></div>
                                        <div><label className={labelClass}>ช่วงเวลา</label><input type="text" value={exp.period} onChange={(e) => updateExperience(exp.id, 'period', e.target.value)} className={inputClass} /></div>
                                    </div>
                                    <div><label className={labelClass}>รายละเอียดและผลงาน (ขึ้นบรรทัดใหม่ = Bullet ในเรซูเม่)</label><textarea value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} className={`${inputClass} h-24`}></textarea></div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">🎓 ประวัติการศึกษา</h3><button type="button" onClick={addEducation} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-full font-bold hover:bg-gray-800 transition">+ เพิ่ม</button></div>
                            {profileData.educations.map((edu) => (
                                <div key={edu.id} className="border border-gray-100 p-6 rounded-[2rem] mb-4 relative bg-gray-50/50">
                                    <button type="button" onClick={() => removeEducation(edu.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 font-bold bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center">✕</button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelClass}>คณะ/วุฒิการศึกษา</label><input type="text" value={edu.faculty} onChange={(e) => updateEducation(edu.id, 'faculty', e.target.value)} className={inputClass} /></div>
                                        <div><label className={labelClass}>สาขาวิชา</label><input type="text" value={edu.major} onChange={(e) => updateEducation(edu.id, 'major', e.target.value)} className={inputClass} /></div>
                                        <div><label className={labelClass}>มหาวิทยาลัย</label><input type="text" value={edu.university} onChange={(e) => updateEducation(edu.id, 'university', e.target.value)} className={inputClass} /></div>
                                        <div><label className={labelClass}>ปีที่จบการศึกษา</label><input type="text" value={edu.year} onChange={(e) => updateEducation(edu.id, 'year', e.target.value)} className={inputClass} /></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">💡 ทักษะเด่น</h3><button type="button" onClick={addSkill} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-full font-bold hover:bg-gray-800 transition">+ เพิ่ม</button></div>
                            <datalist id="popularSkills"><option value="Digital Marketing"/><option value="Project Management"/><option value="Data Analytics"/><option value="Leadership"/></datalist>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profileData.skills.map((skill) => (
                                    <div key={skill.id} className="border border-gray-100 p-6 rounded-[2rem] relative bg-gray-50/50 flex gap-4 items-center">
                                        <button type="button" onClick={() => removeSkill(skill.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 font-bold bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center">✕</button>
                                        <div className="flex-1 pr-8"><label className={labelClass}>ชื่อทักษะ</label><input type="text" list="popularSkills" value={skill.name} onChange={(e) => updateSkill(skill.id, 'name', e.target.value)} className={inputClass} /></div>
                                        <div className="w-1/3"><label className={labelClass}>ประเภท</label><select value={skill.type} onChange={(e) => updateSkill(skill.id, 'type', e.target.value)} className={inputClass}><option value="Hard Skill">Hard Skill</option><option value="Soft Skill">Soft Skill</option></select></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 space-y-6">
                            <h3 className="font-bold">📄 ข้อมูลเพิ่มเติมสำหรับเรซูเม่ (ATS)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className={labelClass}>ภาษา (Languages)</label><textarea value={profileData.languagesText} onChange={e=>setProfileData({...profileData, languagesText: e.target.value})} className={`${inputClass} h-32`}></textarea></div>
                                <div><label className={labelClass}>โครงการที่โดดเด่น (พิมพ์เป็น Text)</label><textarea value={profileData.projectsText} onChange={e=>setProfileData({...profileData, projectsText: e.target.value})} className={`${inputClass} h-32`}></textarea></div>
                            </div>
                        </div>
                        <button type="submit" disabled={isSavingProfile} className="w-full text-white bg-blue-600 hover:bg-blue-700 font-semibold py-4 rounded-full mt-6 transition shadow-md">{isSavingProfile ? "กำลังบันทึก..." : "บันทึกข้อมูล (ใช้ร่วมกันทั้ง About & Resume)"}</button>
                    </form>
                )}

                {/* แท็บ: จัดการผลงาน (เพิ่มวันที่จัดกิจกรรม) */}
                {activeTab === 'projects' && (
                    <div className="space-y-10">
                        <form onSubmit={handleSubmitProject} className={cardClass}>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6"><div><h2 className="text-xl font-bold">{editingProjectId ? "✏️ แก้ไขผลงาน" : "➕ เพิ่มผลงานใหม่"}</h2></div>{editingProjectId && <button type="button" onClick={cancelEditProject} className="text-xs bg-gray-100 px-4 py-2 rounded-full font-bold">ยกเลิกแก้ไข</button>}</div>
                            <div className="space-y-6">
                                <div><label className={labelClass}>ชื่อผลงาน</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className={labelClass}>หมวดหมู่</label><select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}><option value="องค์การนิสิต (Student Organization)">องค์การนิสิต</option><option value="กิจกรรมคณะและสาขา">กิจกรรมคณะและสาขา</option><option value="โปรเจกต์วิชาการ">โปรเจกต์วิชาการ</option></select></div>
                                    <div><label className={labelClass}>วันที่จัดกิจกรรม (ไม่บังคับ)</label><input type="text" placeholder="เช่น 20 พ.ย. 2025" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} className={inputClass} /></div>
                                </div>
                                <div><label className={labelClass}>รายละเอียด</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} h-32`}></textarea></div>
                                <div><label className={labelClass}>ทักษะที่ใช้ (คั่นด้วย ,)</label><input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} /></div>
                                <div><label className={labelClass}>อัปโหลดรูปภาพ</label><input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className={inputClass} /></div>
                            </div>
                            <button type="submit" disabled={isUploadingProject} className="w-full bg-gray-900 text-white font-semibold py-4 rounded-full mt-6 transition">{isUploadingProject ? "กำลังบันทึก..." : "บันทึกผลงาน"}</button>
                        </form>
                        <div className="space-y-4">
                            {projects.map((p) => (
                                <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition">
                                    <div className="flex items-center space-x-6">
                                        <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl border overflow-hidden">{p.imageUrls?.[0] ? <img src={p.imageUrls[0]} className="w-full h-full object-cover" /> : <div className="text-[10px] text-gray-400 flex items-center justify-center h-full">No Img</div>}</div>
                                        <div><h3 className="font-bold">{p.title}</h3><p className="text-xs text-gray-500">{p.category} {p.date && `| ${p.date}`}</p></div>
                                    </div>
                                    <div className="space-x-2"><button onClick={() => handleEditProject(p)} className="text-sm bg-gray-50 font-bold px-4 py-2 rounded-full">แก้ไข</button><button onClick={() => handleDeleteProject(p.id)} className="text-sm bg-red-50 text-red-600 font-bold px-4 py-2 rounded-full">ลบ</button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}