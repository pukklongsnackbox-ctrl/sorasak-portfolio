"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { uploadToCloudinary } from '../../lib/uploadImage';
import Link from 'next/link';

// นำเข้า SVG Icons สไตล์มินิมอล
import { 
  Briefcase, Mail, ExternalLink, User, MapPin, Phone, 
  Code, FileText, Globe, GraduationCap, Edit3, Plus, Trash2, 
  X, Save, Download, CheckCircle2, Languages, FileCheck, Copy,
  Star, Monitor, Building, Upload, Settings, Maximize2
} from 'lucide-react';

// ==========================================
// 💾 ข้อมูลจำลองตั้งต้น (Mock Data) สำหรับหน้า Resume
// ==========================================
const initialResumeData = {
  education: [
    {
      id: 'edu-1',
      th: { year: '2566 - ปัจจุบัน', degree: 'บริหารธุรกิจบัณฑิต สาขาธุรกิจดิจิทัล', school: 'มหาวิทยาลัยนเรศวร', gpa: '3.80' },
      en: { year: '2023 - Present', degree: 'B.B.A. in Digital Business', school: 'Naresuan University', gpa: '3.80' }
    }
  ],
  experience: [
    {
      id: 'exp-1',
      th: { period: '2569 - ปัจจุบัน', role: 'ประธานองค์การนิสิต', company: 'มหาวิทยาลัยนเรศวร', desc: 'บริหารจัดการและขับเคลื่อนนโยบายขององค์การนิสิตระดับมหาวิทยาลัย ดูแลสวัสดิการและจัดกิจกรรมสำหรับนิสิตกว่า 20,000 คน' },
      en: { period: '2026 - Present', role: 'President of Student Union', company: 'Naresuan University', desc: 'Managed and drove university-wide student union policies, overseeing welfare and organizing events for over 20,000 students.' }
    },
    {
      id: 'exp-2',
      th: { period: '2568', role: 'Project Manager (NU MISSION)', company: 'มหาวิทยาลัยนเรศวร', desc: 'ผู้นำทีมจัดงานแข่งขันตอบปัญหาทางวิชาการระดับประเทศ บริหารทีมงาน 80 คน และติดต่อผู้สนับสนุน' },
      en: { period: '2025', role: 'Project Manager (NU MISSION)', company: 'Naresuan University', desc: 'Led the national academic competition event. Managed a team of 80 staff members and coordinated with sponsors.' }
    }
  ],
  showWebResume: true,
  showPdfResume: false,
  showAtsResume: true, 
  pdfResumeUrl: '', 
  pdfResumeUrlEn: '' 
};

export default function ResumePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCmsMode, setIsCmsMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  
  // State สำหรับดู Resume เต็มจอ (Dark Modal Preview)
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  
  // States สำหรับสลับภาษาและโหมด View
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [viewMode, setViewMode] = useState<'web' | 'pdf' | 'ats' | 'none'>('web');
  const [copySuccess, setCopySuccess] = useState(false);

  // States สำหรับดึงข้อมูลจากหน้า About
  const [profile, setProfile] = useState<any>({});
  const [skills, setSkills] = useState<any[]>([]);
  const [softwares, setSoftwares] = useState<any[]>([]);

  // States สำหรับข้อมูล Resume โดยเฉพาะ
  const [resumeData, setResumeData] = useState<any>(initialResumeData);

  // Modals States สำหรับ CMS
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: string | null, data: any | null}>({ isOpen: false, type: null, data: null });
  const [eduForm, setEduForm] = useState<any>({ th: { year: '', degree: '', school: '', gpa: '' }, en: { year: '', degree: '', school: '', gpa: '' } });
  const [expForm, setExpForm] = useState<any>({ th: { period: '', role: '', company: '', desc: '' }, en: { period: '', role: '', company: '', desc: '' } });

  // ==========================================
  // 🔗 Firebase Integration
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setIsAdmin(!!user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aboutSnap = await getDoc(doc(db, "settings", "aboutPageV2"));
        if (aboutSnap.exists()) {
          const data = aboutSnap.data();
          if (data.profile) setProfile(data.profile);
          
          let allSkills: any[] = [];
          if (data.categories) {
            data.categories.forEach((cat:any) => {
              if (cat.skills) allSkills = [...allSkills, ...cat.skills];
            });
          }
          setSkills(allSkills);
          if (data.softwares) setSoftwares(data.softwares);
        }

        const resumeSnap = await getDoc(doc(db, "settings", "resumePageCMS"));
        if (resumeSnap.exists()) {
          let data = resumeSnap.data();
          if (data.showWebResume === undefined) data.showWebResume = true;
          if (data.showPdfResume === undefined) data.showPdfResume = data.usePdfResume || false;
          if (data.showAtsResume === undefined) data.showAtsResume = true;
          setResumeData(data);
        } else {
          await setDoc(doc(db, "settings", "resumePageCMS"), initialResumeData);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const saveResumeToFirebase = async (newData: any) => {
    try {
      await setDoc(doc(db, "settings", "resumePageCMS"), newData, { merge: true });
      setResumeData(newData);
    } catch (error) { console.error(error); alert("บันทึกข้อมูลไม่สำเร็จ"); }
  };

  // ==========================================
  // ⚙️ Smart Conditionals (เงื่อนไขการสลับ View)
  // ==========================================
  const currentPdfUrl = lang === 'en' && resumeData.pdfResumeUrlEn ? resumeData.pdfResumeUrlEn : resumeData.pdfResumeUrl;
  const hasEnPdf = !!resumeData.pdfResumeUrlEn;
  const canShowEnToggle = resumeData.showWebResume || resumeData.showAtsResume || (resumeData.showPdfResume && hasEnPdf);

  useEffect(() => {
    if (viewMode === 'web' && !resumeData.showWebResume) setViewMode(resumeData.showPdfResume ? 'pdf' : (resumeData.showAtsResume ? 'ats' : 'none'));
    else if (viewMode === 'pdf' && !resumeData.showPdfResume) setViewMode(resumeData.showWebResume ? 'web' : (resumeData.showAtsResume ? 'ats' : 'none'));
    else if (viewMode === 'ats' && !resumeData.showAtsResume) setViewMode(resumeData.showWebResume ? 'web' : (resumeData.showPdfResume ? 'pdf' : 'none'));
    else if (viewMode === 'none') {
       if (resumeData.showWebResume) setViewMode('web');
       else if (resumeData.showPdfResume) setViewMode('pdf');
       else if (resumeData.showAtsResume) setViewMode('ats');
    }
  }, [resumeData.showWebResume, resumeData.showPdfResume, resumeData.showAtsResume, viewMode]);

  useEffect(() => {
    if (!canShowEnToggle && lang === 'en') setLang('th');
  }, [canShowEnToggle, lang]);

  // ==========================================
  // 🛠️ CMS Handlers (Education, Experience & PDF)
  // ==========================================
  const closeModal = () => setModalConfig({ isOpen: false, type: null, data: null });

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetLang: 'th'|'en') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    try {
        const url = await uploadToCloudinary(file);
        if (url) {
            const newData = { ...resumeData };
            if (targetLang === 'th') newData.pdfResumeUrl = url;
            else newData.pdfResumeUrlEn = url;
            await saveResumeToFirebase(newData);
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("อัปโหลดไฟล์ไม่สำเร็จ แนะนำให้อัปโหลดลง Google Drive แล้วนำลิงก์มาวางครับ");
    } finally {
        setIsUploadingPdf(false);
    }
  };

  const openEduModal = (edu: any = null) => {
    if (edu) {
      setEduForm({ th: { ...edu.th }, en: { ...edu.en } });
      setModalConfig({ isOpen: true, type: 'edit-edu', data: edu.id });
    } else {
      setEduForm({ th: { year: '', degree: '', school: '', gpa: '' }, en: { year: '', degree: '', school: '', gpa: '' } });
      setModalConfig({ isOpen: true, type: 'add-edu', data: null });
    }
  };

  const saveEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEdu = { id: modalConfig.data || `edu-${Date.now()}`, ...eduForm };
    let newArray = [];
    if (modalConfig.type === 'add-edu') newArray = [...(resumeData.education || []), newEdu];
    else newArray = resumeData.education.map((item:any) => item.id === modalConfig.data ? newEdu : item);
    await saveResumeToFirebase({ ...resumeData, education: newArray });
    closeModal();
  };

  const deleteEdu = async (id: string) => {
    if(!window.confirm("ต้องการลบประวัติการศึกษานี้?")) return;
    await saveResumeToFirebase({ ...resumeData, education: resumeData.education.filter((item:any) => item.id !== id) });
  };

  const openExpModal = (exp: any = null) => {
    if (exp) {
      setExpForm({ th: { ...exp.th }, en: { ...exp.en } });
      setModalConfig({ isOpen: true, type: 'edit-exp', data: exp.id });
    } else {
      setExpForm({ th: { period: '', role: '', company: '', desc: '' }, en: { period: '', role: '', company: '', desc: '' } });
      setModalConfig({ isOpen: true, type: 'add-exp', data: null });
    }
  };

  const saveExp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExp = { id: modalConfig.data || `exp-${Date.now()}`, ...expForm };
    let newArray = [];
    if (modalConfig.type === 'add-exp') newArray = [...(resumeData.experience || []), newExp];
    else newArray = resumeData.experience.map((item:any) => item.id === modalConfig.data ? newExp : item);
    await saveResumeToFirebase({ ...resumeData, experience: newArray });
    closeModal();
  };

  const deleteExp = async (id: string) => {
    if(!window.confirm("ต้องการลบประวัติประสบการณ์นี้?")) return;
    await saveResumeToFirebase({ ...resumeData, experience: resumeData.experience.filter((item:any) => item.id !== id) });
  };

  // ตัวแปลงลิงก์ PDF ให้แสดงผล 2 หน้าคู่กัน / พอดีจอ
  const getEmbeddablePdfUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch && fileIdMatch[1]) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }
    return url.includes('?') ? `${url}&toolbar=0&navpanes=0&scrollbar=0&view=FitH&pagemode=two-up` : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&pagemode=two-up`;
  };

  const generatePlainText = () => {
    let text = `${lang==='en'? profile.nickName : profile.fullName}\n`;
    text += `${profile.email} | ${profile.phone} | ${profile.address}\n\n`;
    text += `SUMMARY:\n${profile.summary}\n\n`;
    text += `EXPERIENCE:\n`;
    resumeData.experience?.forEach((exp:any) => {
      const d = exp[lang];
      text += `- ${d.role} at ${d.company} (${d.period})\n  ${d.desc}\n`;
    });
    text += `\nEDUCATION:\n`;
    resumeData.education?.forEach((edu:any) => {
      const d = edu[lang];
      text += `- ${d.degree}, ${d.school} (${d.year}) GPA: ${d.gpa}\n`;
    });
    text += `\nSKILLS & TOOLS:\n`;
    const skillNames = skills.map(s => s.name).join(', ');
    const toolNames = softwares.map(s => s.name).join(', ');
    text += `Skills: ${skillNames}\nTools: ${toolNames}\n`;
    return text;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatePlainText());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    if (viewMode === 'pdf' && currentPdfUrl) window.open(currentPdfUrl, '_blank');
    else window.print();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-[#fafafa] font-['IBM_Plex_Sans_Thai'] text-[#111827] pb-0 flex flex-col">
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          @page { margin: 1cm; size: A4; }
          .print-container { width: 100% !important; max-w: none !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>

      {/* Navigation */}
     {/* --- Navigation (เมนูสากลสำหรับหน้า About และ Resume) --- */}
         {/* 🌟 --- Navigation (สำหรับหน้า Resume) --- 🌟 */}
            <nav className="fixed top-0 left-0 w-full px-6 py-6 flex justify-between items-center z-50 transition-all duration-300 no-print">
                <div className="max-w-6xl mx-auto w-full flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 rounded-full shadow-sm border border-gray-100">
                    <Link href="/" className="text-xl font-bold tracking-tighter hover:text-gray-900 transition">SORASAK.</Link>
                    <div className="hidden md:flex space-x-6 lg:space-x-8 text-sm font-medium items-center">
                        <Link href="/" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">Home</Link>

                        {/* 🌟 เมนู Works แบบ Dropdown */}
                        <div className="relative group py-2">
                            <button className="flex items-center gap-1 transition-colors text-gray-500 hover:text-gray-900">
                                Works <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-40 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <Link href="/#projects" className="block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors">Projects</Link>
                                <Link href="/#portfolio" className="block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors">Portfolio</Link>
                                <Link href="/#certificates" className="block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors">Awards</Link>
                            </div>
                        </div>

                        <Link href="/about" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">About</Link>
                        
                        {/* จุด Active อยู่ที่หน้า Resume */}
                        <Link href="/resume" className="relative flex justify-center transition-colors text-gray-900 font-bold">
                            Resume
                            <span className="absolute -bottom-2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                        </Link>

                        <Link href="/#contact" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">Contact</Link>
                    </div>
                </div>
            </nav>

      {/* ==========================================
          🌟 Modal ดูเรซูเม่เต็มหน้าจอ (Dark Modal Preview - สำหรับทุกโหมด)
          ========================================== */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-[500] bg-[#333333] flex flex-col items-center p-4 sm:p-8 animate-in fade-in duration-200 overflow-y-auto">
           {/* ปุ่มปิด (X) สไตล์ลอยตัวด้านบนขวาของกล่องเนื้อหา */}
           <div className={`w-full flex justify-center relative mb-4 mt-2 ${viewMode === 'pdf' ? 'max-w-5xl' : 'max-w-[21cm]'}`}>
             <button onClick={() => setIsFullscreenPreview(false)} className="absolute top-0 -right-2 sm:-top-4 sm:-right-16 text-white bg-[#555] hover:bg-[#666] p-2.5 rounded-full transition shadow-lg z-50">
               <X size={24}/>
             </button>
           </div>
           
           <div className={`w-full flex-none pb-10 flex justify-center ${viewMode === 'pdf' ? 'max-w-5xl' : 'max-w-[21cm]'}`}>
              {/* เรนเดอร์โหมด Web ใน Modal */}
              {viewMode === 'web' && (
                <div className="w-full max-w-[21cm] bg-white rounded-md shadow-2xl p-8 sm:p-12 relative min-h-[29.7cm]">
                  <div className="border-b border-gray-100 pb-8 mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Profile" /> : <User size={40} className="w-full h-full text-gray-300 p-4 bg-gray-100" />}
                    </div>
                    <div className="flex-1 mt-2">
                      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-1">
                        {lang === 'th' ? profile.fullName : profile.nickName}
                      </h1>
                      <p className="text-blue-600 font-bold text-sm mb-4">{lang === 'th' ? profile.jobTitle || 'นิสิตและนักสร้างสรรค์ดิจิทัล' : 'Management Student & Digital Creator'}</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] sm:text-xs text-gray-500 font-medium">
                        {profile.email && <span className="flex items-center gap-1.5"><Mail size={12}/> {profile.email}</span>}
                        {profile.phone && <span className="flex items-center gap-1.5"><Phone size={12}/> {profile.phone}</span>}
                        {profile.address && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.address}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
                    <div className="lg:col-span-4 space-y-10">
                      <section>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5"><GraduationCap size={18} className="text-blue-500"/> {lang === 'th' ? 'การศึกษา' : 'Education'}</h3>
                        <div className="border-l-2 border-gray-100 ml-2.5 pl-4 space-y-6">
                          {resumeData.education?.map((edu:any) => {
                            const data = edu[lang];
                            return (
                              <div key={edu.id} className="relative">
                                <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[23px] top-1"></div>
                                <p className="text-[11px] font-bold text-blue-600 mb-1">{data.year}</p>
                                <h4 className="text-xs font-bold text-gray-900 mb-1">{data.degree}</h4>
                                <p className="text-[11px] text-gray-500 mb-2">{data.school}</p>
                                {data.gpa && <span className="text-[9px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 shadow-sm">GPA: {data.gpa}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                      <section>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5"><Star size={18} className="text-amber-500"/> {lang === 'th' ? 'ทักษะความสามารถ' : 'Skills'}</h3>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 10).map((skill:any, idx:number) => (<span key={idx} className="bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-medium px-3 py-1.5 rounded-md">{skill.name}</span>))}
                        </div>
                      </section>
                      <section>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5"><Monitor size={18} className="text-purple-500"/> {lang === 'th' ? 'โปรแกรมที่ถนัด' : 'Software'}</h3>
                        <div className="flex flex-wrap gap-2">
                          {softwares.map((sw:any, idx:number) => (<span key={idx} className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-medium px-3 py-1.5 rounded-md">{sw.name}</span>))}
                        </div>
                      </section>
                    </div>
                    <div className="lg:col-span-8 space-y-10">
                      <section>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4"><User size={18} className="text-emerald-500"/> {lang === 'th' ? 'บทสรุปผู้บริหาร' : 'Professional Summary'}</h3>
                        <div className="bg-gray-50/50 p-5 rounded-2xl text-sm text-gray-600 leading-relaxed border border-gray-100">{profile.summary}</div>
                      </section>
                      <section>
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6"><Briefcase size={18} className="text-orange-500"/> {lang === 'th' ? 'ประสบการณ์และกิจกรรม' : 'Experience'}</h3>
                        <div className="space-y-8">
                          {resumeData.experience?.map((exp:any) => {
                            const data = exp[lang];
                            return (
                              <div key={exp.id} className="relative border-l-2 border-gray-100 ml-2.5 pl-5 pb-2">
                                <div className="absolute w-3 h-3 bg-white border-2 border-orange-500 rounded-full -left-[7px] top-1"></div>
                                <div className="flex justify-between items-baseline mb-1 pr-10">
                                  <h4 className="text-sm font-bold text-gray-900">{data.role}</h4>
                                  <span className="text-[10px] font-bold text-orange-500 shrink-0">{data.period}</span>
                                </div>
                                <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1"><Building size={12}/> {data.company}</p>
                                <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{data.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}

              {/* เรนเดอร์โหมด ATS ใน Modal */}
              {viewMode === 'ats' && (
                <div className="w-full max-w-[21cm] bg-white rounded-md shadow-2xl p-8 sm:p-12 font-sans text-black relative min-h-[29.7cm]">
                  <h1 className="text-3xl font-bold mb-1 uppercase">{lang === 'en' ? profile.nickName : profile.fullName}</h1>
                  <p className="text-sm mb-4 border-b border-black pb-4">{profile.email} • {profile.phone} • {profile.address}</p>
                  <h2 className="text-lg font-bold mb-2 uppercase">{lang === 'en' ? 'Professional Summary' : 'สรุปประวัติ'}</h2>
                  <p className="text-sm mb-6 leading-relaxed">{profile.summary}</p>
                  <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Experience' : 'ประสบการณ์ทำงาน'}</h2>
                  <div className="mb-6 space-y-4 text-sm">
                    {resumeData.experience?.map((exp:any) => (
                      <div key={exp.id}>
                        <div className="flex justify-between font-bold"><span>{exp[lang].role}</span><span>{exp[lang].period}</span></div>
                        <div className="italic mb-1">{exp[lang].company}</div>
                        <ul className="list-disc ml-5 space-y-1"><li>{exp[lang].desc}</li></ul>
                      </div>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Education' : 'ประวัติการศึกษา'}</h2>
                  <div className="mb-6 space-y-3 text-sm">
                    {resumeData.education?.map((edu:any) => (
                      <div key={edu.id} className="flex justify-between">
                        <div><span className="font-bold">{edu[lang].degree}</span><br/>{edu[lang].school}</div>
                        <div className="text-right">{edu[lang].year}<br/>GPA: {edu[lang].gpa}</div>
                      </div>
                    ))}
                  </div>
                  <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Skills & Tools' : 'ทักษะและเครื่องมือ'}</h2>
                  <p className="text-sm mb-1"><strong>Skills:</strong> {skills.map(s => s.name).join(', ')}</p>
                  <p className="text-sm"><strong>Tools:</strong> {softwares.map(s => s.name).join(', ')}</p>
                </div>
              )}

              {/* เรนเดอร์โหมด PDF ใน Modal */}
              {viewMode === 'pdf' && currentPdfUrl && (
                <iframe src={getEmbeddablePdfUrl(currentPdfUrl)} className="w-full h-[85vh] bg-white rounded-md shadow-2xl" title="PDF Fullscreen" />
              )}
           </div>
        </div>
      )}

      <main className="flex-1 animate-in fade-in duration-500 pb-20 pt-32">
        
        {/* Action Bar (Top Controls) */}
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 mb-8 no-print">
          <div className="bg-white rounded-[1.5rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4">
            
            {/* ซ้าย: Language & CMS Toggles */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {canShowEnToggle && (
                <button onClick={() => setLang(lang === 'th' ? 'en' : 'th')} className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition">
                  <Languages size={18} className="text-blue-600"/> {lang === 'th' ? 'EN' : 'TH'}
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setIsCmsMode(!isCmsMode)} className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm border ${isCmsMode ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'}`}>
                    {isCmsMode ? <><Save size={16}/> ปิดโหมดแก้ไข</> : <><Edit3 size={16}/> CMS</>}
                </button>
              )}
            </div>

            {/* กลาง: Tab แยกสำหรับสลับดูเรซูเม่แต่ละโหมด */}
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 w-full lg:w-auto overflow-x-auto hide-scrollbar">
               {resumeData.showWebResume && (
                 <button onClick={() => setViewMode('web')} className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'web' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
                    เว็บเรซูเม่
                 </button>
               )}
               {resumeData.showPdfResume && (
                 <button onClick={() => setViewMode('pdf')} className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'pdf' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
                    ไฟล์เรซูเม่ (PDF)
                 </button>
               )}
               {resumeData.showAtsResume && (
                 <button onClick={() => setViewMode('ats')} className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'ats' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}>
                    ATS / Copy Text
                 </button>
               )}
            </div>

            {/* ขวา: Actions */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              {(viewMode === 'web' || viewMode === 'ats') && (
                <button onClick={handleCopyText} className="flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition">
                  {copySuccess ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16}/>} 
                  <span className="hidden sm:inline">{copySuccess ? 'Copied' : 'Copy Text'}</span>
                </button>
              )}
              {viewMode !== 'none' && (
                <button onClick={handleDownload} className="w-full lg:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md transition">
                  <Download size={16}/> {lang === 'th' ? 'ดาวน์โหลด' : 'Download'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            🌟 กล่องตั้งค่า CMS (เลือกโชว์กี่โหมดก็ได้)
            ========================================== */}
        {isCmsMode && (
          <div className="max-w-[1000px] mx-auto bg-white border-2 border-dashed border-blue-200 rounded-[2rem] p-6 sm:p-8 mb-8 no-print shadow-sm animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-blue-900 mb-5 flex items-center gap-2">
              <Settings size={20} className="text-blue-600"/> การแสดงผลเรซูเม่ (เลือกติ๊กเปิด/ปิดได้เลย)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              
              <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${resumeData.showWebResume ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`} onClick={() => saveResumeToFirebase({...resumeData, showWebResume: !resumeData.showWebResume})}>
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-1">
                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${resumeData.showWebResume ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-400 bg-white'}`}>
                      {resumeData.showWebResume && <CheckCircle2 size={16} strokeWidth={3} />}
                   </div> 🌐 เว็บเรซูเม่ (Web)
                </div>
                <p className="text-[11px] text-gray-500 ml-7 leading-relaxed">หน้าเรซูเม่สวยงามที่สร้างจากข้อมูลที่กรอกในระบบ CMS</p>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${resumeData.showAtsResume ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`} onClick={() => saveResumeToFirebase({...resumeData, showAtsResume: !resumeData.showAtsResume})}>
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-1">
                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${resumeData.showAtsResume ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-400 bg-white'}`}>
                      {resumeData.showAtsResume && <CheckCircle2 size={16} strokeWidth={3} />}
                   </div> 🤖 โหมด ATS
                </div>
                <p className="text-[11px] text-gray-500 ml-7 leading-relaxed">โชว์หน้าข้อความ 1 คอลัมน์ สำหรับบอทบริษัท หรือก๊อปปี้ไปสมัครงาน</p>
              </div>

              <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${resumeData.showPdfResume ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`} onClick={() => saveResumeToFirebase({...resumeData, showPdfResume: !resumeData.showPdfResume})}>
                <div className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                   <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${resumeData.showPdfResume ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-400 bg-white'}`}>
                      {resumeData.showPdfResume && <CheckCircle2 size={16} strokeWidth={3} />}
                   </div> 📄 ไฟล์ PDF (Upload)
                </div>
                
                {resumeData.showPdfResume && (
                  <div className="ml-7 space-y-3" onClick={(e) => e.stopPropagation()}>
                     <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                       <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">🇹🇭 PDF ไทย</label>
                       <input type="text" placeholder="วางลิงก์ Google Drive..." className="text-[11px] border border-gray-200 p-2 rounded-md w-full focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.pdfResumeUrl || ''} onChange={(e) => saveResumeToFirebase({...resumeData, pdfResumeUrl: e.target.value})} />
                     </div>
                     <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                       <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">🇬🇧 PDF อังกฤษ</label>
                       <input type="text" placeholder="วางลิงก์ Google Drive..." className="text-[11px] border border-gray-200 p-2 rounded-md w-full focus:ring-1 focus:ring-blue-500 outline-none" value={resumeData.pdfResumeUrlEn || ''} onChange={(e) => saveResumeToFirebase({...resumeData, pdfResumeUrlEn: e.target.value})} />
                     </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            🌟 ไม่มีข้อมูลโชว์เลย (Fallback)
            ========================================== */}
        {viewMode === 'none' && (
          <div className="max-w-[1000px] mx-auto text-center py-20 text-gray-400 bg-white sm:rounded-[2rem] border border-gray-200 shadow-sm animate-in fade-in">
             <FileText size={48} className="mx-auto mb-4 opacity-20"/>
             <p className="font-bold">ไม่ได้เปิดการแสดงผลเรซูเม่ไว้</p>
             {isAdmin && <p className="text-sm mt-2">โปรดเปิดโหมด CMS เพื่อตั้งค่าการแสดงผลครับ</p>}
          </div>
        )}

        {/* ==========================================
            🌟 1. โหมด ATS
            ========================================== */}
        {viewMode === 'ats' && (
          <div className="relative group max-w-[21cm] mx-auto mb-12">
            {!isCmsMode && (
              <div 
                className="absolute inset-0 z-20 cursor-pointer bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center sm:rounded-[2rem]"
                onClick={() => setIsFullscreenPreview(true)}
              >
                <div className="bg-white/95 backdrop-blur text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 transform scale-95 group-hover:scale-100 border border-gray-100">
                  <Maximize2 size={18} className="text-blue-600" /> {lang === 'th' ? 'คลิกที่ภาพเพื่อดูแบบเต็มหน้าจอ' : 'Click to view Fullscreen'}
                </div>
              </div>
            )}
            <div className="bg-white p-8 sm:p-12 font-sans text-black shadow-sm border border-gray-200 print-container relative min-h-[29.7cm] sm:rounded-[2rem] animate-in fade-in duration-500">
              <h1 className="text-3xl font-bold mb-1 uppercase">{lang === 'en' ? profile.nickName : profile.fullName}</h1>
              <p className="text-sm mb-4 border-b border-black pb-4">{profile.email} • {profile.phone} • {profile.address}</p>
              
              <h2 className="text-lg font-bold mb-2 uppercase">{lang === 'en' ? 'Professional Summary' : 'สรุปประวัติ'}</h2>
              <p className="text-sm mb-6 leading-relaxed">{profile.summary}</p>

              <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Experience' : 'ประสบการณ์ทำงาน'}</h2>
              <div className="mb-6 space-y-4 text-sm">
                {resumeData.experience?.map((exp:any) => (
                  <div key={exp.id}>
                    <div className="flex justify-between font-bold">
                      <span>{exp[lang].role}</span>
                      <span>{exp[lang].period}</span>
                    </div>
                    <div className="italic mb-1">{exp[lang].company}</div>
                    <ul className="list-disc ml-5 space-y-1"><li>{exp[lang].desc}</li></ul>
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Education' : 'ประวัติการศึกษา'}</h2>
              <div className="mb-6 space-y-3 text-sm">
                {resumeData.education?.map((edu:any) => (
                  <div key={edu.id} className="flex justify-between">
                    <div><span className="font-bold">{edu[lang].degree}</span><br/>{edu[lang].school}</div>
                    <div className="text-right">{edu[lang].year}<br/>GPA: {edu[lang].gpa}</div>
                  </div>
                ))}
              </div>

              <h2 className="text-lg font-bold mb-2 border-b border-black pb-1 uppercase">{lang === 'en' ? 'Skills & Tools' : 'ทักษะและเครื่องมือ'}</h2>
              <p className="text-sm mb-1"><strong>Skills:</strong> {skills.map(s => s.name).join(', ')}</p>
              <p className="text-sm"><strong>Tools:</strong> {softwares.map(s => s.name).join(', ')}</p>
            </div>
          </div>
        )}

        {/* ==========================================
            🌟 2. โหมด PDF (อัปโหลด)
            ========================================== */}
        {viewMode === 'pdf' && (
          <div className="relative group max-w-[90vw] lg:max-w-[21cm] mx-auto mb-12">
             {currentPdfUrl ? (
                <>
                  {!isCmsMode && (
                    <div 
                      className="absolute inset-0 z-20 cursor-pointer bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center rounded-2xl sm:rounded-[2rem]"
                      onClick={() => setIsFullscreenPreview(true)}
                    >
                      <div className="bg-white/95 backdrop-blur text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 transform scale-95 group-hover:scale-100 border border-gray-100">
                        <Maximize2 size={18} className="text-blue-600" /> {lang === 'th' ? 'คลิกที่ภาพเพื่อดูแบบเต็มหน้าจอ' : 'Click to view Fullscreen'}
                      </div>
                    </div>
                  )}
                  <div className="relative w-full rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-gray-200 bg-gray-50/50">
                    <iframe src={getEmbeddablePdfUrl(currentPdfUrl)} className="w-full h-[150vh] pointer-events-none" title="PDF Resume" />
                  </div>
                  
                  {/* ปุ่มเปิดหน้าต่างใหม่สวยๆ แยกออกมาด้านล่างเผื่อคนดูในมือถือ */}
                  <div className="mt-8 flex justify-center no-print">
                    <a href={currentPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-all hover:-translate-y-1">
                      <ExternalLink size={18} /> {lang === 'th' ? 'เปิดไฟล์แยกในหน้าต่างใหม่ (Pop-out)' : 'Open in new window (Pop-out)'}
                    </a>
                  </div>
                </>
             ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400 bg-white rounded-3xl border border-dashed border-gray-300">
                  <FileText size={48} className="mb-2 opacity-20"/>
                  <p className="font-bold text-sm">ยังไม่ได้ระบุไฟล์ PDF สำหรับภาษานี้</p>
                  {isCmsMode && <p className="text-xs mt-1">กรุณาวางลิงก์ Google Drive ในกล่องตั้งค่า CMS ด้านบนครับ</p>}
                </div>
             )}
          </div>
        )}

        {/* ==========================================
            🌟 3. โหมด Web (ดึงดีไซน์เดิมกลับมาเป๊ะๆ 100%)
            ========================================== */}
        {viewMode === 'web' && (
          <div className="relative group max-w-[21cm] mx-auto mb-12">
            {!isCmsMode && (
              <div 
                className="absolute inset-0 z-20 cursor-pointer bg-black/0 group-hover:bg-black/5 transition-all flex items-center justify-center sm:rounded-[2rem]"
                onClick={() => setIsFullscreenPreview(true)}
              >
                <div className="bg-white/95 backdrop-blur text-gray-900 px-6 py-3 rounded-full font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 transform scale-95 group-hover:scale-100 border border-gray-100">
                  <Maximize2 size={18} className="text-blue-600" /> {lang === 'th' ? 'คลิกที่ภาพเพื่อดูแบบเต็มหน้าจอ' : 'Click to view Fullscreen'}
                </div>
              </div>
            )}
            <div className="bg-white sm:rounded-[2rem] shadow-sm border border-gray-100 p-8 sm:p-12 print-container relative min-h-[29.7cm] animate-in fade-in duration-500">
              
              {/* Header (Avatar & Info) */}
              <div className="border-b border-gray-100 pb-8 mb-8 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left relative">
                {isCmsMode && (
                  <Link href="/about" className="absolute top-0 right-0 md:top-0 md:right-0 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 no-print hover:bg-blue-100 transition shadow-sm border border-blue-100 z-30">
                    <ExternalLink size={12}/> แก้ไขประวัติ
                  </Link>
                )}
                
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0 mt-6 md:mt-0">
                  {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Profile" /> : <User size={40} className="w-full h-full text-gray-300 p-4 bg-gray-100" />}
                </div>
                <div className="flex-1 mt-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-1 pr-0 md:pr-32">
                    {lang === 'th' ? profile.fullName : profile.nickName}
                  </h1>
                  <p className="text-blue-600 font-bold text-sm mb-4">{lang === 'th' ? profile.jobTitle || 'นิสิตและนักสร้างสรรค์ดิจิทัล' : 'Management Student & Digital Creator'}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[11px] sm:text-xs text-gray-500 font-medium">
                    {profile.email && <span className="flex items-center gap-1.5"><Mail size={12}/> {profile.email}</span>}
                    {profile.phone && <span className="flex items-center gap-1.5"><Phone size={12}/> {profile.phone}</span>}
                    {profile.address && <span className="flex items-center gap-1.5"><MapPin size={12}/> {profile.address}</span>}
                  </div>
                </div>
              </div>

              {/* 2 Columns Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10 relative z-10">
                
                {/* ซ้าย: Edu, Skills, Tools (4/12) */}
                <div className="lg:col-span-4 space-y-10">
                  
                  {/* Education */}
                  <section>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap size={18} className="text-blue-500"/> {lang === 'th' ? 'การศึกษา' : 'Education'}
                      </h3>
                      {isCmsMode && <button onClick={() => openEduModal()} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold no-print hover:bg-blue-100 transition">+ เพิ่ม</button>}
                    </div>

                    <div className="border-l-2 border-gray-100 ml-2.5 pl-4 space-y-6">
                      {resumeData.education?.map((edu:any) => {
                        const data = edu[lang];
                        return (
                          <div key={edu.id} className="relative group">
                            <div className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full -left-[23px] top-1"></div>
                            
                            {isCmsMode && (
                              <div className="absolute -top-3 -right-2 flex gap-1 bg-white shadow-sm border border-gray-200 rounded-lg no-print z-10">
                                <button onClick={() => openEduModal(edu)} className="p-1 text-gray-500 hover:text-blue-600"><Edit3 size={10}/></button>
                                <button onClick={() => deleteEdu(edu.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={10}/></button>
                              </div>
                            )}
                            
                            <p className="text-[11px] font-bold text-blue-600 mb-1">{data.year}</p>
                            <h4 className="text-xs font-bold text-gray-900 mb-1">{data.degree}</h4>
                            <p className="text-[11px] text-gray-500 mb-2">{data.school}</p>
                            {data.gpa && <span className="text-[9px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 shadow-sm">GPA: {data.gpa}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Skills (คืนปุ่มแก้ไขมาแล้ว) */}
                  <section>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Star size={18} className="text-amber-500"/> {lang === 'th' ? 'ทักษะความสามารถ' : 'Skills'}
                      </h3>
                      {isCmsMode && (
                        <Link href="/about" className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold no-print hover:bg-blue-100 transition border border-blue-100 flex items-center gap-1">
                          <ExternalLink size={10}/> แก้ไข
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.slice(0, 10).map((skill:any, idx:number) => (
                        <span key={idx} className="bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-medium px-3 py-1.5 rounded-md">{skill.name}</span>
                      ))}
                      {skills.length === 0 && <p className="text-[10px] text-gray-400 italic">ดึงข้อมูลอัตโนมัติจากหน้า About</p>}
                    </div>
                  </section>

                  {/* Tools (คืนปุ่มแก้ไขมาแล้ว) */}
                  <section>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Monitor size={18} className="text-purple-500"/> {lang === 'th' ? 'โปรแกรมที่ถนัด' : 'Software & Tools'}
                      </h3>
                      {isCmsMode && (
                        <Link href="/about" className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold no-print hover:bg-blue-100 transition border border-blue-100 flex items-center gap-1">
                          <ExternalLink size={10}/> แก้ไข
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {softwares.map((sw:any, idx:number) => (
                        <span key={idx} className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-medium px-3 py-1.5 rounded-md">{sw.name}</span>
                      ))}
                      {softwares.length === 0 && <p className="text-[10px] text-gray-400 italic">ดึงข้อมูลอัตโนมัติจากหน้า About</p>}
                    </div>
                  </section>

                </div>

                {/* ขวา: Summary, Experience (8/12) */}
                <div className="lg:col-span-8 space-y-10">
                  
                  {/* Summary */}
                  <section>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <User size={18} className="text-emerald-500"/> {lang === 'th' ? 'บทสรุปผู้บริหาร' : 'Professional Summary'}
                      </h3>
                      {isCmsMode && (
                        <Link href="/about" className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold no-print hover:bg-blue-100 transition border border-blue-100 flex items-center gap-1">
                          <ExternalLink size={10}/> แก้ไข
                        </Link>
                      )}
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-2xl text-sm text-gray-600 leading-relaxed border border-gray-100">
                      {profile.summary || (lang === 'th' ? "ดึงข้อมูลคำโปรยอัตโนมัติจากหน้า About" : "Auto-synced summary from About page.")}
                    </div>
                  </section>

                  {/* Experience */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase size={18} className="text-orange-500"/> {lang === 'th' ? 'ประสบการณ์และกิจกรรม' : 'Experience & Activities'}
                      </h3>
                      {isCmsMode && <button onClick={() => openExpModal()} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold no-print hover:bg-blue-100 transition">+ เพิ่ม</button>}
                    </div>

                    <div className="space-y-8">
                      {resumeData.experience?.map((exp:any) => {
                        const data = exp[lang];
                        return (
                          <div key={exp.id} className="relative group border-l-2 border-gray-100 ml-2.5 pl-5 pb-2">
                            <div className="absolute w-3 h-3 bg-white border-2 border-orange-500 rounded-full -left-[7px] top-1"></div>
                            
                            {isCmsMode && (
                              <div className="absolute -top-3 -right-2 flex gap-1 bg-white shadow-sm border border-gray-200 rounded-lg no-print z-10">
                                <button onClick={() => openExpModal(exp)} className="p-1 text-gray-500 hover:text-blue-600"><Edit3 size={10}/></button>
                                <button onClick={() => deleteExp(exp.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={10}/></button>
                              </div>
                            )}

                            <div className="flex justify-between items-baseline mb-1 pr-10">
                              <h4 className="text-sm font-bold text-gray-900">{data.role}</h4>
                              <span className="text-[10px] font-bold text-orange-500 shrink-0">{data.period}</span>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1"><Building size={12}/> {data.company}</p>
                            <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line">{data.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          🌟 CMS Modals (Education & Experience Dual-Entry)
          ========================================== */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="sticky top-0 flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Languages className="text-blue-500"/> 
                {modalConfig.type?.includes('edu') ? 'จัดการประวัติการศึกษา' : 'จัดการประสบการณ์'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full"><X size={20}/></button>
            </div>

            <div className="p-6 bg-gray-50">
              
              {/* Form Education */}
              {modalConfig.type?.includes('edu') && (
                <form onSubmit={saveEdu} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* TH Panel */}
                    <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
                      <div className="inline-block bg-blue-50 text-blue-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider mb-2">🇹🇭 ภาษาไทย</div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">ปีการศึกษา</label><input required type="text" placeholder="2566 - ปัจจุบัน" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-blue-500" value={eduForm.th.year} onChange={e=>setEduForm({...eduForm, th: {...eduForm.th, year: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">วุฒิ / สาขา</label><input required type="text" placeholder="บริหารธุรกิจบัณฑิต" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-blue-500" value={eduForm.th.degree} onChange={e=>setEduForm({...eduForm, th: {...eduForm.th, degree: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">สถาบัน</label><input required type="text" placeholder="มหาวิทยาลัยนเรศวร" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-blue-500" value={eduForm.th.school} onChange={e=>setEduForm({...eduForm, th: {...eduForm.th, school: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">เกรดเฉลี่ย (ถ้ามี)</label><input type="text" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-blue-500" value={eduForm.th.gpa} onChange={e=>setEduForm({...eduForm, th: {...eduForm.th, gpa: e.target.value}})} /></div>
                    </div>
                    {/* EN Panel */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <div className="inline-block bg-gray-100 text-gray-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider mb-2">🇬🇧 English</div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Year</label><input required type="text" placeholder="2023 - Present" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={eduForm.en.year} onChange={e=>setEduForm({...eduForm, en: {...eduForm.en, year: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Degree</label><input required type="text" placeholder="B.B.A." className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={eduForm.en.degree} onChange={e=>setEduForm({...eduForm, en: {...eduForm.en, degree: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">School</label><input required type="text" placeholder="Naresuan University" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={eduForm.en.school} onChange={e=>setEduForm({...eduForm, en: {...eduForm.en, school: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">GPA (Optional)</label><input type="text" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={eduForm.en.gpa} onChange={e=>setEduForm({...eduForm, en: {...eduForm.en, gpa: e.target.value}})} /></div>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md">บันทึกประวัติการศึกษา</button>
                </form>
              )}

              {/* Form Experience */}
              {modalConfig.type?.includes('exp') && (
                <form onSubmit={saveExp} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* TH Panel */}
                    <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm space-y-4">
                      <div className="inline-block bg-orange-50 text-orange-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider mb-2">🇹🇭 ภาษาไทย</div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">ระยะเวลา</label><input required type="text" placeholder="2568 - ปัจจุบัน" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-orange-500" value={expForm.th.period} onChange={e=>setExpForm({...expForm, th: {...expForm.th, period: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">ตำแหน่ง</label><input required type="text" placeholder="ประธาน..." className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-orange-500" value={expForm.th.role} onChange={e=>setExpForm({...expForm, th: {...expForm.th, role: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">บริษัท / องค์กร</label><input required type="text" placeholder="มหาวิทยาลัย..." className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-orange-500" value={expForm.th.company} onChange={e=>setExpForm({...expForm, th: {...expForm.th, company: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดงาน</label><textarea required rows={4} className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-orange-500" value={expForm.th.desc} onChange={e=>setExpForm({...expForm, th: {...expForm.th, desc: e.target.value}})} /></div>
                    </div>
                    {/* EN Panel */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                      <div className="inline-block bg-gray-100 text-gray-700 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider mb-2">🇬🇧 English</div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Period</label><input required type="text" placeholder="2025 - Present" className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={expForm.en.period} onChange={e=>setExpForm({...expForm, en: {...expForm.en, period: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Role</label><input required type="text" placeholder="President..." className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={expForm.en.role} onChange={e=>setExpForm({...expForm, en: {...expForm.en, role: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Company / Org</label><input required type="text" placeholder="Naresuan..." className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={expForm.en.company} onChange={e=>setExpForm({...expForm, en: {...expForm.en, company: e.target.value}})} /></div>
                      <div><label className="block text-xs font-bold text-gray-500 mb-1">Description</label><textarea required rows={4} className="w-full text-sm border p-2.5 rounded-lg outline-none focus:border-gray-500" value={expForm.en.desc} onChange={e=>setExpForm({...expForm, en: {...expForm.en, desc: e.target.value}})} /></div>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-md">บันทึกประสบการณ์</button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}