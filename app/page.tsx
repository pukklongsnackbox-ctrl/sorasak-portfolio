"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { uploadToCloudinary } from '../lib/uploadImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { 
    Briefcase, Mail, ExternalLink, User, MapPin, Phone, 
    Code, FileText, Globe, GraduationCap, Edit3, Plus, Trash2, 
    X, Save, Download, CheckCircle2, Languages, FileCheck, Copy,
    Star, Monitor, Building, Upload, Settings, Maximize2,
    Award, List, ListOrdered, ChevronDown, ChevronUp, FolderOpen, 
    Wrench, MousePointerClick, Palette, Loader, Image as LucideImage, 
    AlertTriangle, Send, PlusCircle, TrendingUp, AlignLeft, AlignCenter, AlignRight,
    Lock, ArrowUp, ArrowDown, Eye, EyeOff, Layout, ArrowRight, GripHorizontal, Calendar
} from 'lucide-react';

// 🌟 Helper Function สำหรับลบ HTML Tags และโค้ดขยะ ตอนพรีวิวในการ์ดเล็ก
const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

// 🌟 Component เครื่องมือจัดรูปแบบข้อความ (Rich Text Editor) สำหรับ Admin
const MiniEditor = ({ value, onChange, minHeight = "120px" }: { value: string, onChange: (v: string) => void, minHeight?: string }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    return (
        <div className="flex flex-col w-full shadow-sm">
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1.5 rounded-t-xl border border-gray-200 border-b-0">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false, ''); }} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-gray-50 font-bold text-gray-700 shadow-sm text-sm">B</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false, ''); }} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-gray-50 italic text-gray-700 shadow-sm text-sm">I</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false, ''); }} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-gray-50 underline text-gray-700 shadow-sm text-sm">U</button>
                <div className="w-px bg-gray-300 mx-1 my-1"></div>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false, ''); }} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-gray-50 text-gray-700 shadow-sm"><List size={12}/></button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList', false, ''); }} className="w-7 h-7 flex items-center justify-center bg-white rounded hover:bg-gray-50 text-gray-700 shadow-sm"><ListOrdered size={12}/></button>
            </div>
            <div 
                ref={editorRef}
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                className="w-full bg-gray-50 border border-gray-200 rounded-b-xl p-3 outline-none focus:bg-white focus:border-blue-500 text-sm overflow-y-auto rich-text-content"
                style={{ minHeight }}
            />
        </div>
    );
};

export default function PortfolioPage() {
    const pathname = usePathname() || '/';
    const [activeHash, setActiveHash] = useState('');

    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedShowcase, setSelectedShowcase] = useState<any | null>(null); 
    const [selectedCert, setSelectedCert] = useState<any | null>(null);         
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0); 

    const [certificates, setCertificates] = useState<any[]>([]);
    const [showAllCerts, setShowAllCerts] = useState(false);

    const [showcases, setShowcases] = useState<any[]>([]);
    const [showAllShowcases, setShowAllShowcases] = useState(false);

    const [sectionsConfig, setSectionsConfig] = useState<any>({
        projects: { visible: true, order: 1, limit: 10, sortMode: 'manual' },
        portfolio: { visible: true, order: 2 },
        certificates: { visible: true, order: 3 }
    });

    const [siteData, setSiteData] = useState({
        heroSubTitle: undefined as any,
        heroTitle: "Bridging Business Strategy, \nTechnology, and Leadership.",
        heroDesc: "สวัสดีครับ ผมมด...",
        footerTitle: "Let's build something great together.",
        footerDesc: "ติดต่อผมได้เลยครับ",
        contactEmail: "email@example.com",
        heroImageUrls: [] as string[]
    });
    
    const [profileData, setProfileData] = useState<any>({}); 
    const [siteStyles, setSiteStyles] = useState<any>({}); 

    const [aboutData, setAboutData] = useState<{profile: any, categories: any[], softwares: any[]}>({ profile: {}, categories: [], softwares: [] });
    const [importSource, setImportSource] = useState("");

    const [isAdmin, setIsAdmin] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const [activeField, setActiveField] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editColor, setEditColor] = useState("");
    const [editFontSize, setEditFontSize] = useState("");
    const [editFontFamily, setEditFontFamily] = useState("");
    
    const [editBgColor, setEditBgColor] = useState("");
    const [editBgOpacity, setEditBgOpacity] = useState("100");
    const [editBorderRadius, setEditBorderRadius] = useState("");
    const [editBorderColor, setEditBorderColor] = useState("");
    const [editBorderWidth, setEditBorderWidth] = useState("");
    const [editShadow, setEditShadow] = useState("");
    const [editPadding, setEditPadding] = useState("");

    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editPhone, setEditPhone] = useState("");
    const [editEmail, setEditEmail] = useState("");

    // State Projects
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [pTitle, setPTitle] = useState(''); const [pCategory, setPCategory] = useState('Event Management & Leadership');
    const [pDateMode, setPDateMode] = useState('single'); const [pStartDate, setPStartDate] = useState(''); const [pEndDate, setPEndDate] = useState('');
    const [pDesc, setPDesc] = useState('');
    const [pImpact, setPImpact] = useState(''); const [pTags, setPTags] = useState('');
    const [pFiles, setPFiles] = useState<File[]>([]); const [pExistingImages, setPExistingImages] = useState<string[]>([]);
    const [pLinks, setPLinks] = useState<{label: string, url: string}[]>([]);
    const [pIsPublished, setPIsPublished] = useState(true);

    // State Certificates
    const [showCertModal, setShowCertModal] = useState(false);
    const [editingCert, setEditingCert] = useState<any>(null);
    const [cTitle, setCTitle] = useState('');
    const [cIssuer, setCIssuer] = useState('');
    const [cYear, setCYear] = useState('');
    const [cDesc, setCDesc] = useState('');
    const [cFiles, setCFiles] = useState<File[]>([]);
    const [cExistingImages, setCExistingImages] = useState<string[]>([]);
    const [cLinks, setCLinks] = useState<{label: string, url: string}[]>([]);

    // State Showcases
    const [showShowcaseModal, setShowShowcaseModal] = useState(false);
    const [editingShowcase, setEditingShowcase] = useState<any>(null);
    const [sTitle, setSTitle] = useState('');
    const [sDesc, setSDesc] = useState('');
    const [sFiles, setSFiles] = useState<File[]>([]);
    const [sExistingImages, setSExistingImages] = useState<string[]>([]);
    const [sLinks, setSLinks] = useState<{label: string, url: string}[]>([]);

    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    // Lightbox Data
    const [lightboxData, setLightboxData] = useState<{urls: string[], index: number} | null>(null);
    const [isWorksOpen, setIsWorksOpen] = useState(false);

    // Drag and Drop Timers
    const dragTimer = useRef<NodeJS.Timeout | null>(null);
    
    const [draggedProjectIdx, setDraggedProjectIdx] = useState<number | null>(null);
    const [dragOverProjectIdx, setDragOverProjectIdx] = useState<number | null>(null);

    const [draggedShowcaseIdx, setDraggedShowcaseIdx] = useState<number | null>(null);
    const [dragOverShowcaseIdx, setDragOverShowcaseIdx] = useState<number | null>(null);
    
    const [draggedCertIdx, setDraggedCertIdx] = useState<number | null>(null);
    const [dragOverCertIdx, setDragOverCertIdx] = useState<number | null>(null);

    useEffect(() => {
        const preventScroll = (e: TouchEvent) => {
            if (draggedProjectIdx !== null || draggedShowcaseIdx !== null || draggedCertIdx !== null) {
                e.preventDefault();
            }
        };
        document.addEventListener('touchmove', preventScroll, { passive: false });
        return () => {
            document.removeEventListener('touchmove', preventScroll);
        };
    }, [draggedProjectIdx, draggedShowcaseIdx, draggedCertIdx]);

    useEffect(() => {
        if (draggedProjectIdx !== null || draggedShowcaseIdx !== null || draggedCertIdx !== null) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }
    }, [draggedProjectIdx, draggedShowcaseIdx, draggedCertIdx]);

    useEffect(() => {
        if (pathname !== '/') {
            setActiveHash('');
            return;
        }
        const handleScroll = () => {
            const sections = ['projects', 'portfolio', 'certificates', 'contact'];
            let current = '';
            if (window.scrollY < 100) {
                setActiveHash('');
                return;
            }
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
                        current = section;
                    }
                }
            }
            setActiveHash(current);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll(); 
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pathname]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => setIsAdmin(!!user));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const siteDoc = await getDoc(doc(db, "settings", "homepage"));
                if (siteDoc.exists()) {
                    const data = siteDoc.data() as any;
                    setSiteData(prev => ({ ...prev, ...data, heroImageUrls: data.heroImageUrls || (data.heroImageUrl ? [data.heroImageUrl] : []) }));
                    setSiteStyles(data.siteStyles || {});
                    
                    if (data.sectionsConfig) {
                        setSectionsConfig({
                            projects: { visible: true, order: 1, limit: 10, sortMode: 'manual', ...data.sectionsConfig.projects },
                            portfolio: { visible: true, order: 2, ...data.sectionsConfig.portfolio },
                            certificates: { visible: true, order: 3, ...data.sectionsConfig.certificates }
                        });
                    }
                }

                const aboutDoc = await getDoc(doc(db, "settings", "aboutPageV2"));
                if (aboutDoc.exists()) {
                    const aboutConfig = aboutDoc.data() as any;
                    setAboutData({
                        profile: aboutConfig.profile || {},
                        categories: aboutConfig.categories || [],
                        softwares: aboutConfig.softwares || []
                    });
                }

                const profileDoc = await getDoc(doc(db, "settings", "userProfile"));
                if (profileDoc.exists()) setProfileData(profileDoc.data());

                const q = query(collection(db, "projects"));
                const querySnapshot = await getDocs(q);
                const loadedProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), imageUrls: doc.data().imageUrls || [] }));
                loadedProjects.sort((a: any, b: any) => (b.orderIndex || 0) - (a.orderIndex || 0));
                setProjects(loadedProjects);

                const certQ = query(collection(db, "certificates"));
                const certSnap = await getDocs(certQ);
                const loadedCerts = certSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                loadedCerts.sort((a: any, b: any) => {
                    const orderA = a.orderIndex !== undefined ? a.orderIndex : parseInt(a.year || '0') * 1000000;
                    const orderB = b.orderIndex !== undefined ? b.orderIndex : parseInt(b.year || '0') * 1000000;
                    return orderB - orderA;
                });
                setCertificates(loadedCerts);

                const showcaseQ = query(collection(db, "showcases"));
                const showcaseSnap = await getDocs(showcaseQ);
                const loadedShowcases = showcaseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                loadedShowcases.sort((a: any, b: any) => {
                    const orderA = a.orderIndex !== undefined ? a.orderIndex : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
                    const orderB = b.orderIndex !== undefined ? b.orderIndex : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
                    return orderB - orderA;
                });
                setShowcases(loadedShowcases);

            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let interval: any;
        if (siteData.heroImageUrls?.length > 1 && !isSidebarOpen) {
            interval = setInterval(() => setCurrentHeroIndex(prev => (prev + 1) % siteData.heroImageUrls.length), 5000); 
        }
        return () => clearInterval(interval);
    }, [siteData.heroImageUrls, isSidebarOpen]);

    useEffect(() => {
        let interval: any;
        if (selectedProject && selectedProject.imageUrls?.length > 1) {
            interval = setInterval(() => setCurrentImageIndex(prev => (prev + 1) % selectedProject.imageUrls.length), 3000); 
        }
        return () => clearInterval(interval);
    }, [selectedProject]);

    const nextImage = () => {
        if (selectedProject) setCurrentImageIndex((prev) => (prev + 1) % selectedProject.imageUrls.length);
        else if (selectedShowcase) {
            const allImages = selectedShowcase.imageUrls?.length > 0 ? selectedShowcase.imageUrls : (selectedShowcase.imageUrl ? [selectedShowcase.imageUrl] : []);
            setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
        }
    };
    const prevImage = () => {
        if (selectedProject) setCurrentImageIndex((prev) => (prev - 1 + selectedProject.imageUrls.length) % selectedProject.imageUrls.length);
        else if (selectedShowcase) {
            const allImages = selectedShowcase.imageUrls?.length > 0 ? selectedShowcase.imageUrls : (selectedShowcase.imageUrl ? [selectedShowcase.imageUrl] : []);
            setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
        }
    };

    const getSectionConfig = (key: string) => {
        const defaults: any = {
            projects: { visible: true, order: 1, limit: 10, sortMode: 'manual' },
            portfolio: { visible: true, order: 2 },
            certificates: { visible: true, order: 3 }
        };
        return { ...defaults[key], ...(sectionsConfig?.[key] || {}) };
    };

    const handleSecretLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        setIsSaving(true);
        try {
            await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            setShowLoginModal(false);
            setLoginEmail(""); setLoginPassword("");
            setIsSidebarOpen(true); 
        } catch (error: any) {
            setLoginError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        let html = e.clipboardData.getData('text/html');
        if (html) {
            html = html.replace(/<[^>]*>?/gm, (match) => {
                return match.replace(/ (class|style|id|dir)="[^"]*"/gi, '').replace(/ (class|style|id|dir)='[^']*'/gi, '');
            });
            html = html.replace(/<\/?(span|font|div|table|tbody|tr|td)[^>]*>/gi, '');
            document.execCommand('insertHTML', false, html);
        } else {
            const text = e.clipboardData.getData('text/plain');
            const formattedText = text.replace(/\n/g, '<br>');
            document.execCommand('insertHTML', false, formattedText);
        }
    };

    const handleTextEdit = async (field: string, value: string) => {
        if (!isAdmin) return;
        if ((siteData as any)[field] === value) return;
        try {
            await setDoc(doc(db, "settings", "homepage"), { [field]: value }, { merge: true });
            setSiteData(prev => ({ ...prev, [field]: value }));
        } catch (error) { console.error("Update failed", error); }
    };

    const saveSectionsConfig = async (newConfig: any) => {
        setSectionsConfig(newConfig);
        await setDoc(doc(db, "settings", "homepage"), { sectionsConfig: newConfig }, { merge: true });
    };

    const moveSection = (id: string, dir: number) => {
        const arr = ['projects', 'portfolio', 'certificates'].sort((a, b) => getSectionConfig(a).order - getSectionConfig(b).order);
        const idx = arr.indexOf(id);
        if (idx + dir < 0 || idx + dir >= arr.length) return;
        const swapId = arr[idx + dir];
        
        const currentIdConfig = getSectionConfig(id);
        const currentSwapConfig = getSectionConfig(swapId);
        
        const newConfig = { 
            ...sectionsConfig,
            [id]: { ...currentIdConfig, order: currentSwapConfig.order },
            [swapId]: { ...currentSwapConfig, order: currentIdConfig.order }
        };
        saveSectionsConfig(newConfig);
    };

    const openEditor = (e: React.MouseEvent, fieldKey: string, label: string) => {
        e.stopPropagation(); 
        if (activeField === fieldKey && isSidebarOpen) return;
        setActiveField(fieldKey); setEditLabel(label);
        setEditColor(siteStyles[fieldKey]?.color || "");
        setEditFontSize(siteStyles[fieldKey]?.fontSize || "");
        setEditFontFamily(siteStyles[fieldKey]?.fontFamily || "");
        setEditBgColor(siteStyles[fieldKey]?.bgColor || "");
        setEditBgOpacity(siteStyles[fieldKey]?.bgOpacity || "100");
        setEditBorderRadius(siteStyles[fieldKey]?.borderRadius || "");
        setEditBorderColor(siteStyles[fieldKey]?.borderColor || "");
        setEditBorderWidth(siteStyles[fieldKey]?.borderWidth || "");
        setEditShadow(siteStyles[fieldKey]?.shadow || "");
        setEditPadding(siteStyles[fieldKey]?.padding || "");
        setIsSidebarOpen(true);
    };

    const saveStyles = async () => {
        if (!activeField) return;
        setIsSaving(true);
        try {
            const updatedStyles = { 
                ...siteStyles, 
                [activeField]: { 
                    color: editColor, fontSize: editFontSize, fontFamily: editFontFamily,
                    bgColor: editBgColor, bgOpacity: editBgOpacity, borderRadius: editBorderRadius,
                    borderColor: editBorderColor, borderWidth: editBorderWidth, shadow: editShadow, padding: editPadding
                } 
            };
            await setDoc(doc(db, "settings", "homepage"), { siteStyles: updatedStyles }, { merge: true });
            setSiteStyles(updatedStyles);
            alert("บันทึกสไตล์การตกแต่งสำเร็จ!");
        } catch (err) { console.error(err); alert("เกิดข้อผิดพลาดในการบันทึก"); } finally { setIsSaving(false); }
    };

    const handleHeroImageUpload = async (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setIsSaving(true);
        try {
            let urls = [];
            for (let file of files as File[]) {
                const url = await uploadToCloudinary(file);
                if (url) urls.push(url);
            }
            await setDoc(doc(db, "settings", "homepage"), { heroImageUrls: urls }, { merge: true });
            setSiteData(prev => ({ ...prev, heroImageUrls: urls }));
            alert('เปลี่ยนรูปปกสำเร็จ!');
        } catch (err) { console.error(err); } finally { setIsSaving(false); }
    };

    const formatDateStr = (dateStr: string) => {
        if(!dateStr) return '';
        if(dateStr.includes('-') && dateStr.length === 10) {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        }
        return dateStr;
    };

    const openProjectEditor = (project: any = null) => {
        if (project) {
            setEditingProject(project); setPTitle(project.title); setPCategory(project.category); 
            setPDateMode(project.dateMode || 'single'); setPStartDate(project.startDate || project.date || ''); setPEndDate(project.endDate || '');
            setPDesc(project.description); setPImpact(project.impact || ''); setPTags(project.tags ? project.tags.join(', ') : '');
            setPExistingImages(project.imageUrls || []); setPLinks(project.links || []); setPIsPublished(project.isPublished !== false);
        } else {
            setEditingProject(null); setPTitle(''); setPCategory('องค์การนิสิต (Student Organization)'); 
            setPDateMode('single'); setPStartDate(''); setPEndDate('');
            setPDesc(''); setPImpact(''); setPTags(''); setPExistingImages([]); setPLinks([]); setPIsPublished(true);
        }
        setPFiles([]); setShowProjectModal(true);
    };

    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            let finalImageUrls = [...pExistingImages]; 
            if (pFiles.length > 0) {
                for (let file of pFiles) {
                    const url = await uploadToCloudinary(file);
                    if (url) finalImageUrls.push(url);
                }
            }
            let finalDateStr = formatDateStr(pStartDate);
            if (pDateMode === 'range' && pEndDate) {
                finalDateStr = `${formatDateStr(pStartDate)} - ${formatDateStr(pEndDate)}`;
            }

            let newOrderIndex = Date.now();
            if (!editingProject && projects.length > 0) {
                newOrderIndex = Math.min(...projects.map(p => p.orderIndex || 0)) - 1000;
            }

            const data = { 
                title: pTitle, category: pCategory, 
                dateMode: pDateMode, startDate: pStartDate, endDate: pEndDate, date: finalDateStr, 
                description: pDesc, impact: pImpact, tags: pTags.split(',').map(t => t.trim()), 
                imageUrls: finalImageUrls, links: pLinks, isPublished: pIsPublished,
                orderIndex: editingProject ? editingProject.orderIndex : newOrderIndex
            };

            if (editingProject) {
                await updateDoc(doc(db, "projects", editingProject.id), data);
                setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...data } : p));
            } else {
                const docRef = await addDoc(collection(db, "projects"), { ...data, createdAt: new Date() });
                setProjects([...projects, { id: docRef.id, ...data }].sort((a,b)=>(b.orderIndex||0)-(a.orderIndex||0)));
            }
            setShowProjectModal(false); alert("บันทึกผลงานสำเร็จ!");
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsSaving(false); }
    };

    const handleDeleteProject = async (id: string) => {
        if (window.confirm("ต้องการลบผลงานนี้ใช่หรือไม่?")) {
            await deleteDoc(doc(db, "projects", id));
            setProjects(projects.filter(p => p.id !== id));
            setShowProjectModal(false);
        }
    };

    const moveProject = async (index: number, direction: number) => {
        const newProjects = [...projects];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newProjects.length) return;
        [newProjects[index], newProjects[targetIndex]] = [newProjects[targetIndex], newProjects[index]];
        const now = Date.now();
        await Promise.all(newProjects.map((p, i) => updateDoc(doc(db, "projects", p.id), { orderIndex: now - i * 1000 })));
        setProjects(newProjects);
    };

    const openCertEditor = (cert: any = null) => {
        if (cert) {
            setEditingCert(cert); setCTitle(cert.title); setCIssuer(cert.issuer); setCYear(cert.year); setCDesc(cert.desc || ''); 
            setCExistingImages(cert.imageUrls || (cert.imageUrl ? [cert.imageUrl] : []));
            setCLinks(cert.links || []);
        } else {
            setEditingCert(null); setCTitle(''); setCIssuer(''); setCYear(''); setCDesc(''); setCExistingImages([]); setCLinks([]);
        }
        setCFiles([]); setShowCertModal(true);
    };

    const handleSaveCert = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            let finalImageUrls = [...cExistingImages];
            if (cFiles.length > 0) {
                const uploaded = await Promise.all(cFiles.map(f => uploadToCloudinary(f)));
                finalImageUrls = [...finalImageUrls, ...uploaded.filter(Boolean) as string[]];
            }
            const finalImageUrl = finalImageUrls[0] || '';

            let newOrderIndex = Date.now();
            if (!editingCert && certificates.length > 0) {
                newOrderIndex = Math.min(...certificates.map(c => c.orderIndex !== undefined ? c.orderIndex : parseInt(c.year || '0') * 1000000)) - 1000;
            }

            const data = { title: cTitle, issuer: cIssuer, year: cYear, desc: cDesc, imageUrl: finalImageUrl, imageUrls: finalImageUrls, links: cLinks, orderIndex: editingCert ? editingCert.orderIndex : newOrderIndex };
            if (editingCert) {
                await updateDoc(doc(db, "certificates", editingCert.id), data);
                let updatedCerts = certificates.map(c => c.id === editingCert.id ? { ...c, ...data } : c);
                updatedCerts.sort((a, b) => (b.orderIndex !== undefined ? b.orderIndex : parseInt(b.year || '0')*1000000) - (a.orderIndex !== undefined ? a.orderIndex : parseInt(a.year || '0')*1000000));
                setCertificates(updatedCerts);
            } else {
                const docRef = await addDoc(collection(db, "certificates"), { ...data, createdAt: new Date() }); 
                let newCerts = [...certificates, { id: docRef.id, ...data }];
                newCerts.sort((a, b) => (b.orderIndex !== undefined ? b.orderIndex : parseInt(b.year || '0')*1000000) - (a.orderIndex !== undefined ? a.orderIndex : parseInt(a.year || '0')*1000000));
                setCertificates(newCerts);
            }
            setShowCertModal(false); alert("บันทึกเกียรติบัตรสำเร็จ!");
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsSaving(false); }
    };

    const handleDeleteCert = async (id: string) => {
        if (window.confirm("ต้องการลบเกียรติบัตรนี้ใช่หรือไม่?")) {
            await deleteDoc(doc(db, "certificates", id));
            setCertificates(certificates.filter(c => c.id !== id));
            setShowCertModal(false);
        }
    };

    const availableImportOptions = React.useMemo(() => {
        const options: any[] = [];
        aboutData.categories.forEach(cat => {
            cat.skills?.forEach((skill: any) => {
                skill.portfolios?.forEach((port: any) => {
                    options.push({ label: `[ทักษะ: ${skill.name}] ${port.title}`, data: port });
                });
            });
        });
        aboutData.softwares.forEach(sw => {
            sw.portfolios?.forEach((port: any) => {
                options.push({ label: `[โปรแกรม: ${sw.name}] ${port.title}`, data: port });
            });
        });
        return options;
    }, [aboutData]);

    const handleImportSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const idx = e.target.value;
        setImportSource(idx);
        if (idx === "") return;
        const selected = availableImportOptions[parseInt(idx)].data;
        setSTitle(selected.title || "");
        setSDesc(selected.desc || "");
        if (selected.imageUrls && selected.imageUrls.length > 0) {
            setSExistingImages(selected.imageUrls); 
        }
    };

    const openShowcaseEditor = (showcase: any = null) => {
        setImportSource(""); 
        if (showcase) {
            setEditingShowcase(showcase); setSTitle(showcase.title); setSDesc(showcase.desc || ''); 
            setSExistingImages(showcase.imageUrls || (showcase.imageUrl ? [showcase.imageUrl] : []));
            setSLinks(showcase.links || []);
        } else {
            setEditingShowcase(null); setSTitle(''); setSDesc(''); setSExistingImages([]); setSLinks([]);
        }
        setSFiles([]); setShowShowcaseModal(true);
    };

    const handleSaveShowcase = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSaving(true);
        try {
            let finalImageUrls = [...sExistingImages];
            if (sFiles.length > 0) {
                const uploaded = await Promise.all(sFiles.map(f => uploadToCloudinary(f)));
                finalImageUrls = [...finalImageUrls, ...uploaded.filter(Boolean) as string[]];
            }
            const finalImageUrl = finalImageUrls[0] || '';
            
            let newOrderIndex = Date.now();
            if (!editingShowcase && showcases.length > 0) {
                newOrderIndex = Math.min(...showcases.map(s => s.orderIndex !== undefined ? s.orderIndex : (s.createdAt?.toMillis ? s.createdAt.toMillis() : 0))) - 1000;
            }

            const data = { title: sTitle, desc: sDesc, imageUrl: finalImageUrl, imageUrls: finalImageUrls, links: sLinks, orderIndex: editingShowcase ? editingShowcase.orderIndex : newOrderIndex };
            if (editingShowcase) {
                await updateDoc(doc(db, "showcases", editingShowcase.id), data);
                const updatedShowcases = showcases.map(s => s.id === editingShowcase.id ? { ...s, ...data } : s);
                updatedShowcases.sort((a,b) => (b.orderIndex||0) - (a.orderIndex||0));
                setShowcases(updatedShowcases);
            } else {
                const docRef = await addDoc(collection(db, "showcases"), { ...data, createdAt: new Date() });
                setShowcases([...showcases, { id: docRef.id, ...data }].sort((a,b) => (b.orderIndex||0) - (a.orderIndex||0)));
            }
            setShowShowcaseModal(false); alert("บันทึกผลงานสำเร็จ!");
        } catch (error) { console.error(error); alert("เกิดข้อผิดพลาด"); } finally { setIsSaving(false); }
    };

    const handleDeleteShowcase = async (id: string) => {
        if (window.confirm("ต้องการลบผลงานชิ้นนี้ใช่หรือไม่?")) {
            await deleteDoc(doc(db, "showcases", id));
            setShowcases(showcases.filter(s => s.id !== id));
            setShowShowcaseModal(false);
        }
    };

    // ==========================================
    // 🌟 ระบบลากและวาง (Drag and Drop Handlers)
    // ==========================================
    const onDragStartProject = (e: React.DragEvent, index: number) => {
        if (!isAdmin || getSectionConfig('projects').sortMode === 'date') return;
        setDraggedProjectIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragEnterProject = (e: React.DragEvent, index: number) => {
        if (!isAdmin || draggedProjectIdx === null || getSectionConfig('projects').sortMode === 'date') return;
        if (draggedProjectIdx !== index) {
            const items = [...projects];
            const draggedItem = items[draggedProjectIdx];
            items.splice(draggedProjectIdx, 1);
            items.splice(index, 0, draggedItem);
            setProjects(items);
            setDraggedProjectIdx(index);
        }
    };
    const onDragEndProject = async () => {
        if (!isAdmin || getSectionConfig('projects').sortMode === 'date') return;
        setDraggedProjectIdx(null);
        setDragOverProjectIdx(null);
        const now = Date.now();
        await Promise.all(projects.map((item, idx) => updateDoc(doc(db, "projects", item.id), { orderIndex: now - idx * 1000 })));
    };

    const onDragStartShowcase = (e: React.DragEvent, index: number) => {
        if (!isAdmin) return;
        setDraggedShowcaseIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragEnterShowcase = (e: React.DragEvent, index: number) => {
        if (!isAdmin || draggedShowcaseIdx === null) return;
        if (draggedShowcaseIdx !== index) {
            const items = [...showcases];
            const draggedItem = items[draggedShowcaseIdx];
            items.splice(draggedShowcaseIdx, 1);
            items.splice(index, 0, draggedItem);
            setShowcases(items);
            setDraggedShowcaseIdx(index);
        }
    };
    const onDragEndShowcase = async () => {
        if (!isAdmin) return;
        setDraggedShowcaseIdx(null);
        setDragOverShowcaseIdx(null);
        const now = Date.now();
        await Promise.all(showcases.map((item, idx) => updateDoc(doc(db, "showcases", item.id), { orderIndex: now - idx * 1000 })));
    };

    const onDragStartCert = (e: React.DragEvent, index: number) => {
        if (!isAdmin) return;
        setDraggedCertIdx(index);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragEnterCert = (e: React.DragEvent, index: number) => {
        if (!isAdmin || draggedCertIdx === null) return;
        if (draggedCertIdx !== index) {
            const items = [...certificates];
            const draggedItem = items[draggedCertIdx];
            items.splice(draggedCertIdx, 1);
            items.splice(index, 0, draggedItem);
            setCertificates(items);
            setDraggedCertIdx(index);
        }
    };
    const onDragEndCert = async () => {
        if (!isAdmin) return;
        setDraggedCertIdx(null);
        setDragOverCertIdx(null);
        const now = Date.now();
        await Promise.all(certificates.map((item, idx) => updateDoc(doc(db, "certificates", item.id), { orderIndex: now - idx * 1000 })));
    };

    const isDateSort = getSectionConfig('projects').sortMode === 'date';
    let sortedProjects = [...(isAdmin ? projects : projects.filter(p => p.isPublished !== false))];
    if (isDateSort) {
        sortedProjects.sort((a, b) => {
            const dateA = new Date(a.startDate || a.date || 0).getTime();
            const dateB = new Date(b.startDate || b.date || 0).getTime();
            return dateB - dateA;
        });
    }
    const bigProjects = sortedProjects.slice(0, getSectionConfig('projects').limit || 10);
    const smallProjects = sortedProjects.slice(getSectionConfig('projects').limit || 10);

    const sortedSectionKeys = ['projects', 'portfolio', 'certificates'].sort((a, b) => {
        return getSectionConfig(a).order - getSectionConfig(b).order;
    });

    const getStyle = (key: string, defaultClasses: string) => {
        const isEditing = isAdmin && activeField === key;
        const styleObj = isEditing ? {
            color: editColor !== "" ? editColor : siteStyles[key]?.color,
            fontSize: editFontSize !== "" ? editFontSize : siteStyles[key]?.fontSize,
            fontFamily: editFontFamily !== "" ? editFontFamily : siteStyles[key]?.fontFamily,
            bgColor: editBgColor !== "" ? editBgColor : siteStyles[key]?.bgColor,
            bgOpacity: editBgOpacity !== "" ? editBgOpacity : siteStyles[key]?.bgOpacity,
            borderRadius: editBorderRadius !== "" ? editBorderRadius : siteStyles[key]?.borderRadius,
            borderColor: editBorderColor !== "" ? editBorderColor : siteStyles[key]?.borderColor,
            borderWidth: editBorderWidth !== "" ? editBorderWidth : siteStyles[key]?.borderWidth,
            shadow: editShadow !== "" ? editShadow : siteStyles[key]?.shadow,
            padding: editPadding !== "" ? editPadding : siteStyles[key]?.padding,
        } : (siteStyles[key] || {});
        
        let finalBgColor = styleObj.bgColor;
        if (styleObj.bgColor && styleObj.bgOpacity) {
            const hex = styleObj.bgColor.replace('#', '');
            if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                finalBgColor = `rgba(${r}, ${g}, ${b}, ${parseInt(styleObj.bgOpacity) / 100})`;
            }
        }

        let shadowClass = "";
        if (styleObj.shadow === "sm") shadowClass = "shadow-sm";
        else if (styleObj.shadow === "md") shadowClass = "shadow-md";
        else if (styleObj.shadow === "lg") shadowClass = "shadow-lg";
        else if (styleObj.shadow === "xl") shadowClass = "shadow-xl";
        else if (styleObj.shadow === "2xl") shadowClass = "shadow-2xl";
        else if (styleObj.shadow === "none") shadowClass = "shadow-none";

        return {
            className: `${defaultClasses} ${shadowClass} ${isAdmin ? 'hover:outline-dashed hover:outline-2 hover:outline-blue-400 hover:bg-blue-50/50 rounded-lg transition-all cursor-text relative group/edit' : ''}`,
            style: { 
                color: styleObj.color || undefined, 
                fontSize: styleObj.fontSize ? `${styleObj.fontSize}px` : undefined, 
                fontFamily: styleObj.fontFamily || undefined,
                backgroundColor: finalBgColor || undefined,
                borderRadius: styleObj.borderRadius ? `${styleObj.borderRadius}px` : undefined,
                borderColor: styleObj.borderColor || undefined,
                borderWidth: styleObj.borderWidth ? `${styleObj.borderWidth}px` : undefined,
                borderStyle: styleObj.borderWidth && styleObj.borderWidth !== "0" ? "solid" : undefined,
                padding: styleObj.padding ? `${styleObj.padding}px` : undefined,
            }
        };
    };

    return (
        <div className={`min-h-screen scroll-smooth font-['IBM_Plex_Sans_Thai'] text-[#111827] bg-[#fafafa] ${(selectedProject || selectedShowcase || selectedCert || lightboxData) ? 'overflow-hidden' : ''}`}>
            
            {/* 🌟 สไตล์รองรับ Rich Text Editor ในหน้าต่างโชว์ผลงาน */}
            <style dangerouslySetInnerHTML={{__html: `
                .rich-text-content p { margin-bottom: 1rem; line-height: 1.7; }
                .rich-text-content ul, .rich-text-content ol { margin-bottom: 1rem; line-height: 1.7; padding-left: 1.5rem !important; }
                .rich-text-content ul { list-style-type: disc !important; }
                .rich-text-content ol { list-style-type: decimal !important; }
                .rich-text-content li { margin-bottom: 0.5rem; }
                .rich-text-content b, .rich-text-content strong { font-weight: bold !important; color: #111827; }
                .rich-text-content i, .rich-text-content em { font-style: italic !important; }
                .rich-text-content u { text-decoration: underline !important; }
            `}} />

            {/* Lightbox ดูรูปขนาดใหญ่เต็มจอ (Slider) */}
            {lightboxData && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 sm:p-8" onClick={() => setLightboxData(null)}>
                    <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full backdrop-blur transition-all z-50"><X size={28}/></button>
                    
                    {lightboxData.urls.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setLightboxData({...lightboxData, index: (lightboxData.index - 1 + lightboxData.urls.length) % lightboxData.urls.length}); }} className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 p-3 sm:p-4 rounded-full backdrop-blur transition-all z-50">❮</button>
                            <button onClick={(e) => { e.stopPropagation(); setLightboxData({...lightboxData, index: (lightboxData.index + 1) % lightboxData.urls.length}); }} className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 p-3 sm:p-4 rounded-full backdrop-blur transition-all z-50">❯</button>
                        </>
                    )}

                    <img src={lightboxData.urls[lightboxData.index]} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
                    
                    {lightboxData.urls.length > 1 && (
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-50">
                            {lightboxData.urls.map((_, idx) => (
                                <div key={idx} onClick={(e) => { e.stopPropagation(); setLightboxData({...lightboxData, index: idx}); }} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer shadow-md ${idx === lightboxData.index ? 'bg-white w-6' : 'bg-white/50'}`} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal ล็อกอินลับ */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl flex items-center gap-2 text-gray-900"><Lock size={20} className="text-gray-400"/> Admin Login</h3>
                            <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full"><X size={16}/></button>
                        </div>
                        <form onSubmit={handleSecretLogin} className="space-y-4">
                            {loginError && <p className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-lg">{loginError}</p>}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                <input type="email" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Password</label>
                                <input type="password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-md mt-4">{isSaving ? 'Logging in...' : 'Sign In'}</button>
                        </form>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className={`fixed top-0 right-0 h-full w-[350px] bg-white shadow-2xl z-[110] transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2"><Wrench size={20}/> Visual Builder</h2>
                        <button onClick={() => { setIsSidebarOpen(false); setActiveField(null); }} className="text-gray-400 hover:text-red-500 font-bold text-xl transition">✕</button>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto">
                        {!activeField && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4 mb-8">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> จัดเรียงเนื้อหาหน้าหลัก</h3>
                                <div className="space-y-2">
                                    {sortedSectionKeys.map((key, index) => {
                                        const nameTH = key === 'projects' ? 'กิจกรรม (Projects)' : key === 'portfolio' ? 'ผลงาน (Portfolio)' : 'เกียรทีบัตร (Awards)';
                                        const current = getSectionConfig(key);
                                        return (
                                            <div key={key} className={`flex items-center justify-between bg-white p-3 rounded-xl border ${current.visible !== false ? 'border-gray-200 shadow-sm' : 'border-dashed border-gray-300 opacity-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => saveSectionsConfig({...sectionsConfig, [key]: {...current, visible: !current.visible}})} className="text-gray-400 hover:text-blue-600 transition" title="ซ่อน/โชว์">
                                                        {current.visible !== false ? <Eye size={16}/> : <EyeOff size={16}/>}
                                                    </button>
                                                    <span className="text-xs font-bold text-gray-700">{nameTH}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => moveSection(key, -1)} disabled={index === 0} className="text-gray-400 hover:text-gray-900 disabled:opacity-30"><ArrowUp size={14}/></button>
                                                    <button onClick={() => moveSection(key, 1)} disabled={index === sortedSectionKeys.length - 1} className="text-gray-400 hover:text-gray-900 disabled:opacity-30"><ArrowDown size={14}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="pt-3 border-t border-gray-200 mt-2">
                                    <label className="block text-xs font-bold text-gray-600 mb-2">แสดงผลกิจกรรมไซส์ใหญ่สูงสุด (รายการ)</label>
                                    <input type="number" min="1" value={getSectionConfig('projects').limit || 10} onChange={(e) => saveSectionsConfig({...sectionsConfig, projects: {...getSectionConfig('projects'), limit: Number(e.target.value) || 10}})} className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        )}

                        {!activeField ? (
                            <div className="text-center text-gray-400 mt-10">
                                <div className="flex justify-center mb-4 opacity-50"><MousePointerClick size={48}/></div>
                                <p className="text-sm font-medium leading-relaxed">
                                    พิมพ์แก้ไขข้อความบนหน้าเว็บได้เลย!<br/><br/>
                                    คลิกที่ข้อความ หากต้องการ<br/>ปรับรูปแบบ กล่อง พื้นหลัง หรือสี
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">กำลังตกแต่ง</span>
                                    <span className="text-sm font-bold text-gray-700">{editLabel}</span>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-5">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Edit3 size={14}/> จัดรูปแบบข้อความ</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 font-bold text-gray-800 shadow-sm">B</button>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 italic text-gray-800 shadow-sm">I</button>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 underline text-gray-800 shadow-sm">U</button>
                                        <div className="w-px bg-gray-300 mx-1"></div>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList', false, ''); }} title="List" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-800 shadow-sm"><List size={14}/></button>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList', false, ''); }} title="Number List" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-800 shadow-sm"><ListOrdered size={14}/></button>
                                        <div className="w-px bg-gray-300 mx-1"></div>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyLeft', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-800 shadow-sm"><AlignLeft size={14}/></button>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyCenter', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-800 shadow-sm"><AlignCenter size={14}/></button>
                                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('justifyRight', false, ''); }} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-800 shadow-sm"><AlignRight size={14}/></button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-3">*คลุมดำข้อความบนหน้าจอ แล้วกดเครื่องมือจัดรูปแบบได้เลย</p>
                                </div>

                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-5">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Palette size={14}/> ตัวอักษร (Text)</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">สีข้อความ (Color)</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={editColor || "#111827"} onChange={e => setEditColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                                            <input type="text" value={editColor} onChange={e => setEditColor(e.target.value)} placeholder="เช่น #111827" className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2">ขนาด (Size - px)</label>
                                            <input type="number" value={editFontSize} onChange={e => setEditFontSize(e.target.value)} placeholder="เดิม" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2">ฟอนต์ (Font)</label>
                                            <select value={editFontFamily} onChange={e => setEditFontFamily(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none">
                                                <option value="">เริ่มต้น</option>
                                                <option value="'IBM Plex Sans Thai', sans-serif">IBM Plex</option>
                                                <option value="'Prompt', sans-serif">Prompt</option>
                                                <option value="'Sarabun', sans-serif">Sarabun</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-5 mt-5">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Layout size={14}/> กรอบและพื้นหลัง (Box Model)</h3>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-2">สีพื้นหลัง (Background Color)</label>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="color" value={editBgColor || "#ffffff"} onChange={e => setEditBgColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                                            <input type="text" value={editBgColor} onChange={e => setEditBgColor(e.target.value)} placeholder="ไม่มีสี (โปร่งใส)" className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] text-gray-500 w-16">ความทึบ:</label>
                                            <input type="range" min="0" max="100" value={editBgOpacity} onChange={e => setEditBgOpacity(e.target.value)} className="flex-1" />
                                            <span className="text-[10px] font-bold w-6">{editBgOpacity}%</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2">ความโค้งมน (Radius - px)</label>
                                            <input type="number" value={editBorderRadius} onChange={e => setEditBorderRadius(e.target.value)} placeholder="เช่น 16" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-2">ระยะขอบใน (Padding - px)</label>
                                            <input type="number" value={editPadding} onChange={e => setEditPadding(e.target.value)} placeholder="เช่น 24" className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-200">
                                        <label className="block text-xs font-bold text-gray-600 mb-2 mt-2">เส้นขอบ (Border)</label>
                                        <div className="flex items-center gap-3">
                                            <input type="color" value={editBorderColor || "#e5e7eb"} onChange={e => setEditBorderColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 shadow-sm" />
                                            <input type="number" value={editBorderWidth} onChange={e => setEditBorderWidth(e.target.value)} placeholder="ความหนา (px)" className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-200">
                                        <label className="block text-xs font-bold text-gray-600 mb-2 mt-2">เงา (Shadow)</label>
                                        <select value={editShadow} onChange={e => setEditShadow(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none">
                                            <option value="">ค่าเริ่มต้น</option>
                                            <option value="none">ไม่มีเงา (None)</option>
                                            <option value="sm">เงาน้อย (Small)</option>
                                            <option value="md">เงากลาง (Medium)</option>
                                            <option value="lg">เงาใหญ่ (Large)</option>
                                            <option value="xl">เงาใหญ่มาก (X-Large)</option>
                                            <option value="2xl">เงากระจาย (2X-Large)</option>
                                        </select>
                                    </div>
                                </div>

                                <button onClick={saveStyles} disabled={isSaving} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                    {isSaving ? <><Loader size={18} className="animate-spin"/> กำลังบันทึก...</> : <><Save size={18}/> บันทึกสไตล์</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="fixed w-full px-6 py-6 flex justify-between items-center z-50 transition-all duration-300 no-print">
                <div className="max-w-6xl mx-auto w-full flex justify-between items-center bg-white/80 backdrop-blur-md px-6 py-4 rounded-full shadow-sm border border-gray-100">
                    <Link href="/" className="text-xl font-bold tracking-tighter hover:text-gray-900 transition">SORASAK.</Link>
                    <div className="hidden md:flex space-x-6 lg:space-x-8 text-sm font-medium items-center">
                        <Link href="/" className={`relative flex justify-center transition-colors ${pathname === '/' && !activeHash ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
                            Home
                            {pathname === '/' && !activeHash && <span className="absolute -bottom-2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>}
                        </Link>

                        <div className="relative py-2">
                            <button
                                onClick={() => setIsWorksOpen(!isWorksOpen)}
                                className={`flex items-center gap-1 transition-colors ${pathname === '/' && ['projects', 'portfolio', 'certificates'].includes(activeHash) ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Works <ChevronDown size={14} className={`transition-transform duration-200 ${isWorksOpen ? 'rotate-180' : ''}`}/>
                                {pathname === '/' && ['projects', 'portfolio', 'certificates'].includes(activeHash) && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>}
                            </button>
                            {isWorksOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsWorksOpen(false)}/>
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-40 bg-white border border-gray-100 shadow-xl rounded-2xl p-2 z-20">
                                        {getSectionConfig('projects').visible !== false && <Link href="/#projects" onClick={() => setIsWorksOpen(false)} className={`block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors ${activeHash === 'projects' ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}>Projects</Link>}
                                        {getSectionConfig('portfolio').visible !== false && <Link href="/#portfolio" onClick={() => setIsWorksOpen(false)} className={`block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors ${activeHash === 'portfolio' ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}>Portfolio</Link>}
                                        {getSectionConfig('certificates').visible !== false && <Link href="/#certificates" onClick={() => setIsWorksOpen(false)} className={`block px-4 py-2.5 text-xs font-medium rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors ${activeHash === 'certificates' ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}>Awards</Link>}
                                    </div>
                                </>
                            )}
                        </div>

                        <Link href="/about" className={`relative flex justify-center transition-colors ${pathname === '/about' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
                            About
                            {pathname === '/about' && <span className="absolute -bottom-2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>}
                        </Link>
                        
                        <Link href="/resume" className={`relative flex justify-center transition-colors ${pathname === '/resume' ? 'text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900'}`}>
                            Resume
                            {pathname === '/resume' && <span className="absolute -bottom-2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>}
                        </Link>

                        <Link href="/#contact" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">
                            Contact
                        </Link>

                        {isAdmin && (
                            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-gray-900 text-white px-3 py-1.5 rounded-full text-[10px] font-bold animate-pulse tracking-widest border border-gray-800 flex items-center gap-1 hover:bg-gray-800 transition">
                                <Settings size={12}/> PANEL
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <header id="about" className="relative min-h-screen flex items-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[#f0f0f0]">
                    {siteData.heroImageUrls && siteData.heroImageUrls.length > 0 && siteData.heroImageUrls.map((url, idx) => (
                        <img key={idx} src={url} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`} />
                    ))}
                </div>
                
                {isAdmin && (
                    <div className="absolute top-32 right-6 z-[200]">
                        <label className="bg-white shadow-2xl text-gray-900 px-6 py-3 rounded-full cursor-pointer hover:bg-gray-50 font-bold text-sm flex items-center gap-2 transition border border-gray-200 hover:scale-105">
                            <LucideImage size={18}/> เปลี่ยนรูปพื้นหลัง
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                        </label>
                    </div>
                )}

                <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#fafafa] via-[#fafafa]/90 to-transparent md:bg-gradient-to-r md:from-[#fafafa] md:via-[#fafafa]/80 md:to-transparent"></div>
                
                <div className="relative z-20 max-w-6xl mx-auto px-6 w-full pt-20 pb-20 lg:pt-32">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="w-full md:w-1/2 lg:w-3/5">
                            <h2 {...getStyle('heroSubTitle', 'text-xl md:text-3xl font-bold text-blue-600 mb-4 inline-block')} 
                                contentEditable={isAdmin} suppressContentEditableWarning 
                                onPaste={handlePaste}
                                onBlur={(e) => handleTextEdit('heroSubTitle', e.currentTarget.innerHTML)}
                                onClick={(e) => isAdmin && openEditor(e, 'heroSubTitle', 'หัวข้อย่อย / ชื่อ')}
                                dangerouslySetInnerHTML={{ __html: siteData.heroSubTitle !== undefined ? siteData.heroSubTitle : (aboutData.profile?.fullName || 'สรศักดิ์ แย้มศรี') }}>
                            </h2>
                            <h1 {...getStyle('heroTitle', 'text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900 drop-shadow-sm')} 
                                contentEditable={isAdmin} suppressContentEditableWarning 
                                onPaste={handlePaste}
                                onBlur={(e) => handleTextEdit('heroTitle', e.currentTarget.innerHTML)}
                                onClick={(e) => isAdmin && openEditor(e, 'heroTitle', 'หัวข้อหลัก')}
                                dangerouslySetInnerHTML={{ __html: siteData.heroTitle || '' }}>
                            </h1>
                            <p {...getStyle('heroDesc', 'text-lg md:text-xl text-gray-700 font-light leading-relaxed mb-4 drop-shadow-sm')} 
                               contentEditable={isAdmin} suppressContentEditableWarning 
                               onPaste={handlePaste}
                               onBlur={(e) => handleTextEdit('heroDesc', e.currentTarget.innerHTML)}
                               onClick={(e) => isAdmin && openEditor(e, 'heroDesc', 'ข้อความแนะนำตัว')}
                               dangerouslySetInnerHTML={{ __html: siteData.heroDesc || '' }}>
                            </p>
                            
                            <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-10 max-w-lg font-light">
                                {aboutData.profile?.summary || 'นิสิตคณะบริหารธุรกิจที่มีความสามารถโดดเด่นด้านความเป็นผู้นำและการบริหารจัดการ...'}
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <a href={`#${sortedSectionKeys.find(key => getSectionConfig(key).visible !== false) || 'contact'}`} className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-gray-800 transition shadow-lg hover:shadow-xl">ดูผลงานของผม ↓</a>
                                <Link href="/about" className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors px-6 py-4 rounded-full bg-white/50 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm">
                                    อ่านประวัติเพิ่มเติม <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 lg:w-2/5 flex justify-center md:justify-end mt-12 md:mt-0">
                            <div className="w-64 h-64 md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px] rounded-full border-[8px] border-white shadow-2xl overflow-hidden bg-gray-100 flex items-center justify-center relative z-10 transform transition-transform duration-700 hover:-translate-y-2">
                                {aboutData.profile?.avatarUrl ? (
                                    <img src={aboutData.profile.avatarUrl} alt="Profile" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
                                ) : (
                                    <User size={100} className="text-gray-300" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ==========================================
                🌟 ส่วนการเรนเดอร์เนื้อหาหลัก
                ========================================== */}
            {sortedSectionKeys.map(key => {
                if (getSectionConfig(key).visible === false && !isAdmin) return null;

                // --- 1. Projects Section (กิจกรรมหลัก) ---
                if (key === 'projects') {
                    return (
                        <section key="projects" id="projects" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20 relative">
                            {isAdmin && getSectionConfig('projects').visible === false && <div className="absolute top-10 left-6 z-30 bg-red-100 text-red-700 px-3 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase flex items-center gap-1"><EyeOff size={12}/> ซ่อนการแสดงผล (Hidden)</div>}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                                    <Briefcase className="text-gray-900"/> Selected Projects
                                </h2>
                                {isAdmin && (
                                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                        <div className="flex bg-gray-50 rounded-full border border-gray-200 overflow-hidden w-full md:w-auto">
                                            <button onClick={() => saveSectionsConfig({...sectionsConfig, projects: {...getSectionConfig('projects'), sortMode: 'manual'}})} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold transition-colors ${!isDateSort ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>เรียงเอง (Manual)</button>
                                            <button onClick={() => saveSectionsConfig({...sectionsConfig, projects: {...getSectionConfig('projects'), sortMode: 'date'}})} className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold transition-colors ${isDateSort ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>ล่าสุด (Date)</button>
                                        </div>
                                        {!isDateSort && <span className="hidden md:flex bg-gray-50 text-gray-500 px-3 py-2 rounded-full text-xs font-medium border border-gray-200 items-center gap-2"><GripHorizontal size={14}/> กดค้างเพื่อลากจัดเรียง</span>}
                                        <button onClick={() => openProjectEditor()} className="flex-1 md:flex-none bg-gray-100 text-gray-800 px-4 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-200 shadow-sm">
                                            <Plus size={16}/> เพิ่มกิจกรรม
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-32">
                                {sortedProjects.length === 0 ? ( <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-[2rem] border border-gray-100 border-dashed">ยังไม่มีข้อมูลกิจกรรม</div>) : (
                                    bigProjects.map((project:any, index:number) => {
                                        const isEven = index % 2 === 0;
                                        const globalIndex = projects.indexOf(project);
                                        
                                        return (
                                            <div 
                                                key={project.id} 
                                                className={`relative group/project transition-all duration-300 dnd-project
                                                    ${isAdmin && !isDateSort ? 'cursor-move select-none [-webkit-touch-callout:none]' : ''}
                                                    ${draggedProjectIdx === globalIndex ? 'opacity-40 scale-[0.98]' : ''}
                                                `}
                                                draggable={isAdmin && !isDateSort}
                                                onDragStart={(e) => onDragStartProject(e, globalIndex)}
                                                onDragEnter={(e) => onDragEnterProject(e, globalIndex)}
                                                onDragEnd={onDragEndProject}
                                                onDragOver={(e) => e.preventDefault()}
                                                onContextMenu={(e) => { if(isAdmin && !isDateSort) e.preventDefault(); }}
                                                
                                                onTouchStart={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    dragTimer.current = setTimeout(() => {
                                                        setDraggedProjectIdx(globalIndex);
                                                    }, 500);
                                                }}
                                                onTouchMove={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    if(draggedProjectIdx === null) {
                                                        if(dragTimer.current) clearTimeout(dragTimer.current);
                                                        return;
                                                    }
                                                    const touch = e.touches[0];
                                                    const touchY = touch.clientY;
                                                    const threshold = 100;
                                                    if (touchY < threshold) window.scrollBy(0, -15);
                                                    else if (window.innerHeight - touchY < threshold) window.scrollBy(0, 15);

                                                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                                                    const item = el?.closest('.dnd-project');
                                                    if (item) {
                                                        const idx = parseInt(item.getAttribute('data-index') || '-1', 10);
                                                        if (idx !== -1 && idx !== draggedProjectIdx) {
                                                            const items = [...projects];
                                                            const draggedItem = items[draggedProjectIdx];
                                                            items.splice(draggedProjectIdx, 1);
                                                            items.splice(idx, 0, draggedItem);
                                                            setProjects(items);
                                                            setDraggedProjectIdx(idx);
                                                        }
                                                    }
                                                }}
                                                onTouchEnd={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    if(dragTimer.current) clearTimeout(dragTimer.current);
                                                    if(draggedProjectIdx !== null) onDragEndProject();
                                                }}
                                                data-index={globalIndex}
                                            >
                                                {isAdmin && project.isPublished === false && <div className="absolute -top-6 left-0 z-30 bg-orange-100 text-orange-700 px-3 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12}/> ซ่อนอยู่ (Draft)</div>}
                                                {isAdmin && !isDateSort && (
                                                    <div className="absolute -top-6 right-0 z-30 flex gap-1">
                                                        <button onClick={() => moveProject(globalIndex, -1)} disabled={globalIndex === 0} className="bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg text-xs font-bold disabled:opacity-30 shadow-sm">↑</button>
                                                        <button onClick={() => moveProject(globalIndex, 1)} disabled={globalIndex === projects.length - 1} className="bg-white border border-gray-200 text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg text-xs font-bold disabled:opacity-30 shadow-sm">↓</button>
                                                    </div>
                                                )}

                                                <div className={`grid grid-cols-1 md:grid-cols-12 gap-12 items-center ${isAdmin && !isDateSort ? 'pointer-events-none' : 'cursor-pointer'}`}>
                                                    <div className={`md:col-span-7 h-96 rounded-2xl bg-gray-100 flex items-center justify-center relative overflow-hidden shadow-md border border-gray-100 group/img ${isEven ? 'order-1' : 'order-1 md:order-2'}`}>
                                                        {project.imageUrls?.[0] ? <img src={project.imageUrls[0]} className="w-full h-full object-cover group-hover/project:scale-105 transition duration-700 pointer-events-auto" onClick={(e) => { e.stopPropagation(); setLightboxData({urls: project.imageUrls, index: 0}); }} /> : <div className="text-gray-300">ไม่มีรูปภาพ</div>}
                                                        {project.imageUrls?.length > 1 && <div className="absolute top-6 right-6 z-10 bg-white/90 text-gray-900 text-xs px-3 py-1.5 rounded-full font-medium shadow-sm backdrop-blur-md">+{project.imageUrls.length - 1} รูป</div>}
                                                        
                                                        {isAdmin && (
                                                            <div className="absolute top-6 left-6 z-10 flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200 pointer-events-auto">
                                                                <button onClick={(e) => { e.stopPropagation(); openProjectEditor(project); }} className="p-2 text-gray-600 hover:text-blue-600 touch-manipulation active:scale-95"><Edit3 size={14}/></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-2 text-red-400 hover:text-red-600 touch-manipulation active:scale-95"><Trash2 size={14}/></button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div onClick={(e) => { e.stopPropagation(); setSelectedProject(project); setCurrentImageIndex(0); }} className={`md:col-span-5 pointer-events-auto ${isEven ? 'order-2' : 'order-2 md:order-1'}`}>
                                                        <p className="text-sm font-semibold text-gray-400 mb-3 tracking-widest uppercase flex items-center gap-2">
                                                            {(index + 1).toString().padStart(2, '0')} — {project.category} 
                                                            {project.date && <span className="flex items-center gap-1"><Calendar size={12}/> {project.date}</span>}
                                                        </p>
                                                        <h3 className="text-4xl font-bold mb-6 tracking-tight group-hover/project:text-gray-600 transition">{project.title}</h3>
                                                        {project.description && <p className="text-gray-500 font-light leading-relaxed mb-8 whitespace-pre-line line-clamp-3">{stripHtml(project.description)}</p>}
                                                        <span className="text-sm font-medium border-b border-gray-900 pb-1 group-hover/project:text-gray-500 group-hover/project:border-gray-500 transition">ดูรายละเอียดเพิ่มเติม →</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {smallProjects.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20 pt-16 border-t border-gray-100">
                                    {smallProjects.map((project:any) => {
                                        const globalIndex = projects.indexOf(project);
                                        return (
                                            <div 
                                                key={project.id} 
                                                className={`bg-white border rounded-[1.5rem] p-4 shadow-sm transition-all relative group flex flex-col dnd-project
                                                    ${isAdmin && !isDateSort ? 'cursor-move select-none [-webkit-touch-callout:none] hover:shadow-md' : 'cursor-pointer hover:shadow-lg'}
                                                    ${draggedProjectIdx === globalIndex ? 'opacity-40 scale-[0.98]' : 'border-gray-100'}
                                                `}
                                                draggable={isAdmin && !isDateSort}
                                                onDragStart={(e) => onDragStartProject(e, globalIndex)}
                                                onDragEnter={(e) => onDragEnterProject(e, globalIndex)}
                                                onDragEnd={onDragEndProject}
                                                onDragOver={(e) => e.preventDefault()}
                                                onContextMenu={(e) => { if(isAdmin && !isDateSort) e.preventDefault(); }}
                                                
                                                onTouchStart={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    dragTimer.current = setTimeout(() => {
                                                        setDraggedProjectIdx(globalIndex);
                                                    }, 500);
                                                }}
                                                onTouchMove={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    if(draggedProjectIdx === null) {
                                                        if(dragTimer.current) clearTimeout(dragTimer.current);
                                                        return;
                                                    }
                                                    const touch = e.touches[0];
                                                    const touchY = touch.clientY;
                                                    const threshold = 100;
                                                    if (touchY < threshold) window.scrollBy(0, -15);
                                                    else if (window.innerHeight - touchY < threshold) window.scrollBy(0, 15);

                                                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                                                    const item = el?.closest('.dnd-project');
                                                    if (item) {
                                                        const idx = parseInt(item.getAttribute('data-index') || '-1', 10);
                                                        if (idx !== -1 && idx !== draggedProjectIdx) {
                                                            const items = [...projects];
                                                            const draggedItem = items[draggedProjectIdx];
                                                            items.splice(draggedProjectIdx, 1);
                                                            items.splice(idx, 0, draggedItem);
                                                            setProjects(items);
                                                            setDraggedProjectIdx(idx);
                                                        }
                                                    }
                                                }}
                                                onTouchEnd={(e) => {
                                                    if(!isAdmin || isDateSort) return;
                                                    if(dragTimer.current) clearTimeout(dragTimer.current);
                                                    if(draggedProjectIdx !== null) onDragEndProject();
                                                }}
                                                data-index={globalIndex}
                                                onClick={() => { if(!isAdmin) { setSelectedProject(project); setCurrentImageIndex(0); } else { setSelectedProject(project); setCurrentImageIndex(0); } }}
                                            >
                                                {isAdmin && project.isPublished === false && <div className="absolute top-2 left-2 z-20 bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold shadow-sm uppercase">Draft</div>}
                                                
                                                {/* 🌟 แสดงปุ่มเสมอสำหรับแอดมิน เพื่อให้กดบน iPad ง่ายๆ */}
                                                {isAdmin && (
                                                    <div className="absolute top-6 right-6 z-10 transition flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200">
                                                        <button onClick={(e) => { e.stopPropagation(); openProjectEditor(project); }} className="p-2 text-gray-600 hover:text-blue-600 touch-manipulation active:scale-95"><Edit3 size={14}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-2 text-red-400 hover:text-red-600 touch-manipulation active:scale-95"><Trash2 size={14}/></button>
                                                    </div>
                                                )}

                                                <div className="bg-gray-50 rounded-[1rem] aspect-[4/3] flex items-center justify-center mb-5 overflow-hidden border border-gray-100 relative group-hover:border-gray-200 transition pointer-events-none">
                                                    {project.imageUrls?.[0] ? (
                                                        <>
                                                            <img src={project.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={project.title} />
                                                            {!isAdmin && (
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24}/>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="text-gray-300 flex flex-col items-center"><LucideImage size={32} className="mb-2"/><span className="text-xs">ไม่มีรูปภาพ</span></div>
                                                    )}
                                                    {project.imageUrls?.length > 1 && <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">+{project.imageUrls.length - 1}</div>}
                                                </div>
                                                <div className="flex-grow flex flex-col justify-between pointer-events-none">
                                                    <h4 className="font-bold text-gray-900 mb-2 text-base leading-snug line-clamp-2">{project.title}</h4>
                                                    {project.category && <p className="text-[11px] text-gray-400 font-bold mb-2 uppercase tracking-wide">{project.category}</p>}
                                                    {project.description && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{stripHtml(project.description)}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    );
                }

                // --- 2. Portfolio Section (ผลงานหน้าหลัก) ---
                if (key === 'portfolio') {
                    const displayShowcases = isAdmin || showAllShowcases ? showcases : showcases.slice(0, 3);
                    
                    return (
                        <section key="portfolio" id="portfolio" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100 scroll-mt-20 relative">
                            {isAdmin && getSectionConfig('portfolio').visible === false && <div className="absolute top-10 left-6 z-30 bg-red-100 text-red-700 px-3 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase flex items-center gap-1"><EyeOff size={12}/> ซ่อนการแสดงผล (Hidden)</div>}
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                                    <FolderOpen className="text-gray-900"/> My Portfolio
                                </h2>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <span className="hidden md:flex bg-gray-50 text-gray-500 px-3 py-2 rounded-full text-xs font-medium border border-gray-200 items-center gap-2"><GripHorizontal size={14}/> กดค้างแล้วลากเพื่อจัดเรียง</span>
                                        <button onClick={() => openShowcaseEditor()} className="flex-1 md:flex-none bg-gray-100 text-gray-800 px-4 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-200 shadow-sm">
                                            <Plus size={16}/> เพิ่มผลงาน
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayShowcases.map((showcase, index) => (
                                    <div 
                                        key={showcase.id} 
                                        className={`bg-white border rounded-[1.5rem] p-4 shadow-sm transition-all relative group flex flex-col dnd-showcase
                                            ${isAdmin ? 'cursor-move select-none [-webkit-touch-callout:none] hover:shadow-md' : 'cursor-pointer hover:shadow-lg'}
                                            ${draggedShowcaseIdx === index ? 'opacity-40 scale-[0.98]' : 'border-gray-100'}
                                        `}
                                        draggable={isAdmin}
                                        onDragStart={(e) => onDragStartShowcase(e, index)}
                                        onDragEnter={(e) => onDragEnterShowcase(e, index)}
                                        onDragEnd={onDragEndShowcase}
                                        onDragOver={(e) => e.preventDefault()}
                                        onContextMenu={(e) => { if(isAdmin) e.preventDefault(); }}
                                        
                                        onTouchStart={(e) => {
                                            if(!isAdmin) return;
                                            dragTimer.current = setTimeout(() => {
                                                setDraggedShowcaseIdx(index);
                                            }, 500);
                                        }}
                                        onTouchMove={(e) => {
                                            if(!isAdmin) return;
                                            if(draggedShowcaseIdx === null) {
                                                if(dragTimer.current) clearTimeout(dragTimer.current);
                                                return;
                                            }
                                            const touch = e.touches[0];
                                            const touchY = touch.clientY;
                                            const threshold = 100;
                                            if (touchY < threshold) window.scrollBy(0, -15);
                                            else if (window.innerHeight - touchY < threshold) window.scrollBy(0, 15);

                                            const el = document.elementFromPoint(touch.clientX, touch.clientY);
                                            const item = el?.closest('.dnd-showcase');
                                            if (item) {
                                                const idx = parseInt(item.getAttribute('data-index') || '-1', 10);
                                                if (idx !== -1 && idx !== draggedShowcaseIdx) {
                                                    const items = [...showcases];
                                                    const draggedItem = items[draggedShowcaseIdx];
                                                    items.splice(draggedShowcaseIdx, 1);
                                                    items.splice(idx, 0, draggedItem);
                                                    setShowcases(items);
                                                    setDraggedShowcaseIdx(idx);
                                                }
                                            }
                                        }}
                                        onTouchEnd={(e) => {
                                            if(!isAdmin) return;
                                            if(dragTimer.current) clearTimeout(dragTimer.current);
                                            if(draggedShowcaseIdx !== null) onDragEndShowcase();
                                        }}
                                        data-index={index}
                                        
                                        onClick={() => { setSelectedShowcase(showcase); setCurrentImageIndex(0); }}
                                    >
                                        {isAdmin && (
                                            <div className="absolute top-6 right-6 z-10 transition flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200">
                                                <button onClick={(e) => { e.stopPropagation(); openShowcaseEditor(showcase); }} className="p-2 text-gray-600 hover:text-blue-600 touch-manipulation active:scale-95"><Edit3 size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteShowcase(showcase.id); }} className="p-2 text-red-400 hover:text-red-600 touch-manipulation active:scale-95"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                        
                                        <div className="bg-gray-50 rounded-[1rem] aspect-[4/3] flex items-center justify-center mb-5 overflow-hidden border border-gray-100 relative group-hover:border-gray-200 transition pointer-events-none">
                                            {showcase.imageUrls?.[0] ? (
                                                <img src={showcase.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={showcase.title} />
                                            ) : (
                                                showcase.imageUrl ? <img src={showcase.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={showcase.title} /> : <div className="text-gray-300 flex flex-col items-center"><LucideImage size={32} className="mb-2"/><span className="text-xs">ไม่มีรูปภาพ</span></div>
                                            )}
                                            {!isAdmin && (showcase.imageUrl || showcase.imageUrls?.length > 0) && (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24}/>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between pointer-events-none">
                                            <h4 className="font-bold text-gray-900 mb-2 text-base leading-snug line-clamp-2">{showcase.title}</h4>
                                            {showcase.desc && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{stripHtml(showcase.desc)}</p>}
                                        </div>
                                    </div>
                                ))}
                                {showcases.length === 0 && (
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-gray-400 bg-gray-50 rounded-[2rem] border border-gray-100 border-dashed">
                                        ยังไม่มีข้อมูลผลงานในส่วนนี้
                                    </div>
                                )}
                            </div>

                            {showcases.length > 3 && !isAdmin && (
                                <div className="flex justify-center mt-12">
                                    <button onClick={() => setShowAllShowcases(!showAllShowcases)} className="border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-full text-sm font-bold shadow-sm transition flex items-center gap-2 hover:scale-105">
                                        {showAllShowcases ? <>ย่อผลงาน <ChevronUp size={16}/></> : <>ดูผลงานทั้งหมด ({showcases.length}) <ChevronDown size={16}/></>}
                                    </button>
                                </div>
                            )}
                        </section>
                    );
                }

                // --- 3. Certificates Section (เกียรติบัตร) ---
                if (key === 'certificates') {
                    const displayCerts = isAdmin || showAllCerts ? certificates : certificates.slice(0, 3);
                    
                    return (
                        <section key="certificates" id="certificates" className="max-w-6xl mx-auto px-6 py-24 border-t border-gray-100 scroll-mt-20 relative">
                            {isAdmin && getSectionConfig('certificates').visible === false && <div className="absolute top-10 left-6 z-30 bg-red-100 text-red-700 px-3 py-1 rounded-md text-[10px] font-bold shadow-sm uppercase flex items-center gap-1"><EyeOff size={12}/> ซ่อนการแสดงผล (Hidden)</div>}
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                                    <Award className="text-gray-900"/> Certifications & Awards
                                </h2>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <span className="hidden md:flex bg-gray-50 text-gray-500 px-3 py-2 rounded-full text-xs font-medium border border-gray-200 items-center gap-2"><GripHorizontal size={14}/> กดค้างแล้วลากเพื่อจัดเรียง</span>
                                        <button onClick={() => openCertEditor()} className="flex-1 md:flex-none bg-gray-100 text-gray-800 px-4 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-200 shadow-sm">
                                            <Plus size={16}/> เพิ่มเกียรติบัตร
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {displayCerts.map((cert, index) => (
                                    <div 
                                        key={cert.id} 
                                        className={`bg-white border rounded-[1.5rem] p-4 shadow-sm transition-all relative group flex flex-col dnd-cert
                                            ${isAdmin ? 'cursor-move select-none [-webkit-touch-callout:none] hover:shadow-md' : 'cursor-pointer hover:shadow-lg'}
                                            ${draggedCertIdx === index ? 'opacity-40 scale-[0.98]' : 'border-gray-100'}
                                        `}
                                        draggable={isAdmin}
                                        onDragStart={(e) => onDragStartCert(e, index)}
                                        onDragEnter={(e) => onDragEnterCert(e, index)}
                                        onDragEnd={onDragEndCert}
                                        onDragOver={(e) => e.preventDefault()}
                                        onContextMenu={(e) => { if(isAdmin) e.preventDefault(); }}
                                        
                                        onTouchStart={(e) => {
                                            if(!isAdmin) return;
                                            dragTimer.current = setTimeout(() => {
                                                setDraggedCertIdx(index);
                                            }, 500);
                                        }}
                                        onTouchMove={(e) => {
                                            if(!isAdmin) return;
                                            if(draggedCertIdx === null) {
                                                if(dragTimer.current) clearTimeout(dragTimer.current);
                                                return;
                                            }
                                            const touch = e.touches[0];
                                            const touchY = touch.clientY;
                                            const threshold = 100;
                                            if (touchY < threshold) window.scrollBy(0, -15);
                                            else if (window.innerHeight - touchY < threshold) window.scrollBy(0, 15);

                                            const el = document.elementFromPoint(touch.clientX, touch.clientY);
                                            const item = el?.closest('.dnd-cert');
                                            if (item) {
                                                const idx = parseInt(item.getAttribute('data-index') || '-1', 10);
                                                if (idx !== -1 && idx !== draggedCertIdx) {
                                                    const items = [...certificates];
                                                    const draggedItem = items[draggedCertIdx];
                                                    items.splice(draggedCertIdx, 1);
                                                    items.splice(idx, 0, draggedItem);
                                                    setCertificates(items);
                                                    setDraggedCertIdx(idx);
                                                }
                                            }
                                        }}
                                        onTouchEnd={(e) => {
                                            if(!isAdmin) return;
                                            if(dragTimer.current) clearTimeout(dragTimer.current);
                                            if(draggedCertIdx !== null) onDragEndCert();
                                        }}
                                        data-index={index}
                                        onClick={() => setSelectedCert(cert)}
                                    >
                                        {/* 🌟 แสดงปุ่มตลอดเวลาสำหรับแอดมิน */}
                                        {isAdmin && (
                                            <div className="absolute top-6 right-6 z-10 transition flex gap-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-gray-200">
                                                <button onClick={(e) => { e.stopPropagation(); openCertEditor(cert); }} className="p-2 text-gray-600 hover:text-blue-600 touch-manipulation active:scale-95"><Edit3 size={14}/></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteCert(cert.id); }} className="p-2 text-red-400 hover:text-red-600 touch-manipulation active:scale-95"><Trash2 size={14}/></button>
                                            </div>
                                        )}

                                        <div className="bg-gray-50 rounded-[1rem] aspect-[4/3] flex items-center justify-center mb-5 overflow-hidden border border-gray-100 relative group-hover:border-gray-200 transition pointer-events-none">
                                            {cert.imageUrl ? (
                                                <>
                                                    <img src={cert.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={cert.title} />
                                                    {!isAdmin && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                            <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24}/>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-gray-300 flex flex-col items-center"><FileText size={32} className="mb-2"/><span className="text-xs">ไม่มีรูปภาพ</span></div>
                                            )}
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between pointer-events-none">
                                            <h4 className="font-bold text-gray-900 mb-3 text-sm leading-snug line-clamp-2">{cert.title}</h4>
                                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                                <span className="text-[11px] text-gray-500 font-medium truncate pr-4">{cert.issuer}</span>
                                                <span className="text-[11px] font-bold text-gray-400">{cert.year}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {certificates.length === 0 && (
                                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 text-gray-400 bg-gray-50 rounded-[2rem] border border-gray-100 border-dashed">
                                        ยังไม่มีข้อมูลเกียรติบัตรและรางวัล
                                    </div>
                                )}
                            </div>

                            {certificates.length > 3 && !isAdmin && (
                                <div className="flex justify-center mt-12">
                                    <button onClick={() => setShowAllCerts(!showAllCerts)} className="border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-full text-sm font-bold shadow-sm transition flex items-center gap-2 hover:scale-105">
                                        {showAllCerts ? <>ย่อเกียรติบัตร <ChevronUp size={16}/></> : <>ดูเกียรติบัตรทั้งหมด ({certificates.length}) <ChevronDown size={16}/></>}
                                    </button>
                                </div>
                            )}
                        </section>
                    );
                }
                return null;
            })}

            {/* --- Footer & Contact Links --- */}
            <footer id="contact" className="max-w-6xl mx-auto px-6 py-32 mt-10 border-t border-gray-200 text-center scroll-mt-20">
                <h2 {...getStyle('footerTitle', 'text-4xl font-bold mb-6 tracking-tight')} 
                    contentEditable={isAdmin} suppressContentEditableWarning 
                    onPaste={handlePaste}
                    onBlur={(e) => handleTextEdit('footerTitle', e.currentTarget.innerHTML)}
                    onClick={(e) => isAdmin && openEditor(e, 'footerTitle', 'หัวข้อส่วนท้าย')}
                    dangerouslySetInnerHTML={{ __html: siteData.footerTitle || '' }}>
                </h2>
                <p {...getStyle('footerDesc', 'text-gray-500 font-light mb-12 max-w-md mx-auto text-lg')} 
                   contentEditable={isAdmin} suppressContentEditableWarning 
                   onPaste={handlePaste}
                   onBlur={(e) => handleTextEdit('footerDesc', e.currentTarget.innerHTML)}
                   onClick={(e) => isAdmin && openEditor(e, 'footerDesc', 'ข้อความส่วนท้าย')}
                   dangerouslySetInnerHTML={{ __html: siteData.footerDesc || '' }}>
                </p>

                <div className="flex flex-col items-center justify-center mb-16 relative">
                    {isAdmin && !isEditingContact && (
                        <button onClick={() => {
                            setEditPhone(profileData?.phone || '');
                            setEditEmail(profileData?.email || siteData.contactEmail || '');
                            setIsEditingContact(true);
                        }} className="mb-6 bg-white border border-gray-200 shadow-sm hover:shadow text-gray-700 px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-2 hover:text-blue-600">
                            <Edit3 size={16}/> แก้ไขข้อมูลติดต่อ
                        </button>
                    )}

                    {isEditingContact ? (
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl flex flex-col items-center gap-4 animate-fade-in w-full max-w-md">
                            <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center gap-2"><Edit3 size={20}/> แก้ไขเบอร์และอีเมล</h3>
                            <div className="w-full text-left">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">เบอร์โทรศัพท์</label>
                                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500" placeholder="ใส่เบอร์โทร..." />
                            </div>
                            <div className="w-full text-left">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">อีเมล</label>
                                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500" placeholder="ใส่อีเมล..." />
                            </div>
                            <div className="flex gap-3 w-full mt-4">
                                <button onClick={() => setIsEditingContact(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition text-sm">ยกเลิก</button>
                                <button onClick={async () => {
                                    try {
                                        await setDoc(doc(db, "settings", "userProfile"), { phone: editPhone, email: editEmail }, { merge: true });
                                        setProfileData((prev: any) => ({...prev, phone: editPhone, email: editEmail}));
                                        setIsEditingContact(false);
                                        alert("บันทึกข้อมูลติดต่อสำเร็จ!");
                                    } catch(e) { console.error(e); alert("เกิดข้อผิดพลาด"); }
                                }} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition text-sm flex justify-center items-center gap-2"><Save size={16}/> บันทึก</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                            {profileData?.phone && (
                                <a href={`tel:${profileData.phone}`} className="flex items-center gap-3 text-xl font-bold text-gray-700 hover:text-blue-600 transition hover:scale-105">
                                    <span className="bg-white border border-gray-200 shadow-sm p-4 rounded-full"><Phone size={24} className="text-gray-700"/></span> {profileData.phone}
                                </a>
                            )}
                            {(profileData?.email || siteData.contactEmail) && (
                                <a href={`mailto:${profileData?.email || siteData.contactEmail}`} className="flex items-center gap-3 text-xl font-bold text-gray-700 hover:text-blue-600 transition hover:scale-105">
                                    <span className="bg-white border border-gray-200 shadow-sm p-4 rounded-full"><Mail size={24} className="text-gray-700"/></span> {profileData?.email || siteData.contactEmail}
                                </a>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="mt-20 text-xs text-gray-400 flex flex-col items-center space-y-4">
                    <span onDoubleClick={() => setShowLoginModal(true)} className="cursor-default select-none transition hover:text-gray-500">© {new Date().getFullYear()} Sorasak Yamsri.</span>
                </div>
            </footer>

            {/* Modal ผลงานผู้ชม (Projects) */}
            {selectedProject && !showProjectModal && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-10 animate-fade-in overflow-hidden">
                    <div className="bg-white w-full h-full md:h-[90vh] md:rounded-[2rem] md:max-w-7xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-gray-100">
                        <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 z-10 bg-gray-100/80 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-200 transition text-xl"><X size={24}/></button>
                        <div className="w-full md:w-3/5 bg-[#fafafa] relative h-[50vh] md:h-auto flex items-center justify-center p-4 md:p-12">
                            {selectedProject.imageUrls?.length > 0 ? (
                                <>
                                    <img
                                        src={selectedProject.imageUrls[currentImageIndex]}
                                        className="w-full h-full object-contain drop-shadow-sm transition-opacity duration-500 cursor-zoom-in"
                                        onClick={() => setLightboxData({urls: selectedProject.imageUrls, index: currentImageIndex})}
                                    />
                                    {selectedProject.imageUrls.length > 1 && (
                                        <>
                                            <button onClick={prevImage} className="absolute left-3 md:left-6 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md transition text-xl">❮</button>
                                            <button onClick={nextImage} className="absolute right-3 md:right-6 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md transition text-xl">❯</button>
                                            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center space-x-2">
                                                {selectedProject.imageUrls.map((_: any, idx: number) => (<div key={idx} onClick={() => setCurrentImageIndex(idx)} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${idx === currentImageIndex ? 'bg-gray-900 w-6' : 'bg-gray-300'}`} />))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (<div className="text-gray-400">ไม่มีรูปภาพ</div>)}
                        </div>
                        <div className="w-full md:w-2/5 p-8 md:p-16 overflow-y-auto max-h-[50vh] md:max-h-full bg-white flex flex-col">
                            <p className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">{selectedProject.category} {selectedProject.date && `| ${selectedProject.date}`}</p>
                            {/* 🌟 ปรับขนาดหัวข้อให้อ่านง่าย */}
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-snug text-gray-900">{selectedProject.title}</h2>
                            {selectedProject.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{selectedProject.tags.map((tag: string, i: number) => (<span key={i} className="text-xs border border-gray-200 px-4 py-2 rounded-full text-gray-600 font-medium">{tag}</span>))}</div>}
                            
                            {/* ลิงก์ผลงาน Projects */}
                            {selectedProject.links && selectedProject.links.length > 0 && (
                                <div className="flex flex-wrap gap-3 mb-8">
                                    {selectedProject.links.map((link: any, i: number) => (
                                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
                                            {link.label || 'ดูลิงก์ผลงาน'} <ExternalLink size={14} />
                                        </a>
                                    ))}
                                </div>
                            )}

                            <div className="h-px w-full bg-gray-100 mb-8"></div>
                            {selectedProject.impact && (
                                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-8">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">Impact & Metrics <TrendingUp size={14}/></h4>
                                    <div className="text-sm text-blue-900 leading-relaxed rich-text-content" dangerouslySetInnerHTML={{ __html: selectedProject.impact }}></div>
                                </div>
                            )}
                            {/* 🌟 ปรับสไตล์คำบรรยายให้อ่านง่าย */}
                            <div className="text-gray-600 text-sm md:text-base flex-grow rich-text-content" dangerouslySetInnerHTML={{ __html: selectedProject.description }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ผลงาน (Showcase - สไตล์แยก 2 ฝั่ง ซ้าย/ขวา เหมือน Projects) */}
            {selectedShowcase && !showShowcaseModal && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-10 animate-fade-in overflow-hidden">
                    <div className="bg-white w-full h-full md:h-[90vh] md:rounded-[2rem] md:max-w-7xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-gray-100">
                        <button onClick={() => setSelectedShowcase(null)} className="absolute top-6 right-6 z-10 bg-gray-100/80 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-200 transition text-xl"><X size={24}/></button>
                        
                        {(() => {
                            const allImages = selectedShowcase.imageUrls?.length > 0 ? selectedShowcase.imageUrls : (selectedShowcase.imageUrl ? [selectedShowcase.imageUrl] : []);
                            return (
                                <>
                                    <div className="w-full md:w-3/5 bg-[#fafafa] relative h-[50vh] md:h-auto flex items-center justify-center p-4 md:p-12">
                                        {allImages.length > 0 ? (
                                            <>
                                                <img
                                                    src={allImages[currentImageIndex]}
                                                    className="w-full h-full object-contain drop-shadow-sm transition-opacity duration-500 cursor-zoom-in"
                                                    onClick={() => setLightboxData({urls: allImages, index: currentImageIndex})}
                                                />
                                                {allImages.length > 1 && (
                                                    <>
                                                        <button onClick={prevImage} className="absolute left-3 md:left-6 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md transition text-xl">❮</button>
                                                        <button onClick={nextImage} className="absolute right-3 md:right-6 w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white shadow-md transition text-xl">❯</button>
                                                        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center space-x-2">
                                                            {allImages.map((_: any, idx: number) => (
                                                                <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer shadow-sm ${idx === currentImageIndex ? 'bg-gray-900 w-6' : 'bg-gray-300'}`} />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : (<div className="text-gray-400">ไม่มีรูปภาพ</div>)}
                                    </div>
                                    <div className="w-full md:w-2/5 p-8 md:p-16 overflow-y-auto max-h-[50vh] md:max-h-full bg-white flex flex-col">
                                        <p className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest flex items-center gap-2">PORTFOLIO</p>
                                        {/* 🌟 ปรับขนาดหัวข้อให้อ่านง่าย */}
                                        <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-snug text-gray-900">{selectedShowcase.title}</h2>
                                        
                                        <div className="flex flex-wrap gap-3 mb-8">
                                            {selectedShowcase.link && (
                                                <a href={selectedShowcase.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
                                                    ดูผลงานต้นฉบับ <ExternalLink size={14} />
                                                </a>
                                            )}
                                            {selectedShowcase.links && selectedShowcase.links.length > 0 && selectedShowcase.links.map((link: any, i: number) => (
                                                <a key={i} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
                                                    {link.label || 'ดูลิงก์ผลงาน'} <ExternalLink size={14} />
                                                </a>
                                            ))}
                                        </div>

                                        <div className="h-px w-full bg-gray-100 mb-8"></div>
                                        
                                        {/* 🌟 ปรับสไตล์คำบรรยายให้อ่านง่าย */}
                                        <div className="text-gray-600 text-sm md:text-base flex-grow rich-text-content" dangerouslySetInnerHTML={{ __html: selectedShowcase.desc }}></div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Modal เกียรติบัตร (Certificates - สไตล์แยกฝั่งเหมือนกิจกรรม) */}
            {selectedCert && !showCertModal && (
                <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-10 animate-fade-in overflow-hidden">
                    <div className="bg-white w-full h-full md:h-[90vh] md:rounded-[2rem] md:max-w-6xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl border border-gray-100">
                        <button onClick={() => setSelectedCert(null)} className="absolute top-6 right-6 z-10 bg-gray-100/80 backdrop-blur-md w-12 h-12 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-200 transition text-xl"><X size={24}/></button>
                        
                        <div className="w-full md:w-1/2 bg-[#fafafa] relative h-[40vh] md:h-auto flex items-center justify-center p-4 md:p-8 border-b md:border-b-0 md:border-r border-gray-100">
                            {selectedCert.imageUrl || (selectedCert.imageUrls && selectedCert.imageUrls.length > 0) ? (
                                (() => {
                                    const allImages = selectedCert.imageUrls?.length > 0 ? selectedCert.imageUrls : [selectedCert.imageUrl];
                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 overflow-y-auto p-4">
                                            {allImages.map((url: string, idx: number) => (
                                                <div key={idx} className="w-full flex-shrink-0 cursor-zoom-in relative group" onClick={() => setLightboxData({urls: allImages, index: idx})}>
                                                    <img src={url} className="max-w-full max-h-full mx-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" alt={selectedCert.title} />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center"><FileText size={48} className="mb-4 opacity-50"/>ไม่มีรูปภาพเกียรติบัตร</div>
                            )}
                        </div>
                        
                        <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto max-h-[60vh] md:max-h-full bg-white flex flex-col justify-center">
                            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-widest flex items-center gap-2"><Award size={16}/> เกียรติบัตรและรางวัล</p>
                            {/* 🌟 ปรับขนาดหัวข้อให้อ่านง่าย */}
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 leading-snug text-gray-900">{selectedCert.title}</h2>
                            
                            <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl mb-8 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">หน่วยงานที่มอบให้ (Issuer)</p>
                                    <p className="text-lg font-medium text-gray-800">{selectedCert.issuer}</p>
                                </div>
                                <div className="h-px w-full bg-gray-200"></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ปีที่ได้รับ (Year)</p>
                                    <p className="text-lg font-bold text-gray-800">{selectedCert.year}</p>
                                </div>
                            </div>

                            {selectedCert.desc && (
                                <div className="pt-6 border-t border-gray-100">
                                    {/* 🌟 ปรับสไตล์คำบรรยายให้อ่านง่าย */}
                                    <div className="text-gray-600 text-sm md:text-base rich-text-content" dangerouslySetInnerHTML={{ __html: selectedCert.desc }}></div>
                                </div>
                            )}

                            {/* ลิงก์ผลงาน Certificates */}
                            {selectedCert.links && selectedCert.links.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-6">
                                    {selectedCert.links.map((link: any, i: number) => (
                                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
                                            {link.label || 'ดูลิงก์อ้างอิง'} <ExternalLink size={14} />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal จัดการกิจกรรม Admin (Projects) */}
            {isAdmin && showProjectModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl p-8 md:p-12 relative animate-fade-in">
                        <button onClick={() => setShowProjectModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"><X size={20}/></button>
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">{editingProject ? <><Edit3 size={24}/> แก้ไขกิจกรรม</> : <><PlusCircle size={24}/> เพิ่มกิจกรรมใหม่</>}</h2>
                        <form onSubmit={handleSaveProject} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">ชื่อผลงาน</label><input type="text" required value={pTitle} onChange={e=>setPTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" /></div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">หมวดหมู่</label>
                                    <input type="text" list="categoryList" value={pCategory} onChange={e=>setPCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" placeholder="พิมพ์หรือเลือกจากลิสต์..." />
                                    <datalist id="categoryList">
                                        <option value="องค์การนิสิต (Student Organization)" />
                                        <option value="กิจกรรมคณะและสาขา" />
                                        <option value="โปรเจกต์วิชาการ" />
                                        {aboutData.categories.map((cat: any) => <option key={cat.id} value={cat.title} />)}
                                    </datalist>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3">รูปแบบวันที่จัดกิจกรรม <span className="text-blue-500">*</span></label>
                                    <div className="flex gap-6 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100 inline-flex">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white px-3 py-1.5 rounded-lg transition-colors">
                                            <input type="radio" className="accent-blue-600" checked={pDateMode === 'single'} onChange={() => setPDateMode('single')} /> จัดวันเดียว
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white px-3 py-1.5 rounded-lg transition-colors">
                                            <input type="radio" className="accent-blue-600" checked={pDateMode === 'range'} onChange={() => setPDateMode('range')} /> จัดหลายวัน (เป็นช่วง)
                                        </label>
                                    </div>
                                    {pDateMode === 'single' ? (
                                        <div className="w-full md:w-1/2">
                                            <input type="date" value={pStartDate} onChange={e=>setPStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm cursor-pointer" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col md:flex-row items-center gap-3">
                                            <div className="w-full relative">
                                                <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 font-bold">วันที่เริ่มต้น</span>
                                                <input type="date" value={pStartDate} onChange={e=>setPStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm cursor-pointer" />
                                            </div>
                                            <span className="text-gray-400 font-bold text-xs uppercase px-2">ถึง</span>
                                            <div className="w-full relative">
                                                <span className="absolute -top-2 left-3 bg-white px-1 text-[10px] text-gray-400 font-bold">วันที่สิ้นสุด</span>
                                                <input type="date" value={pEndDate} onChange={e=>setPEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm cursor-pointer" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">ทักษะที่ใช้ (คั่นด้วย ,)</label>
                                    <input type="text" list="projectSkillsList" value={pTags} onChange={e=>setPTags(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" placeholder="พิมพ์หรือกดเลือกจากลิสต์..." />
                                    <datalist id="projectSkillsList">
                                        <option value="Event Management, Leadership" />
                                        <option value="Digital Marketing, Content Creator" />
                                        <option value="Data Storytelling & Analytics" />
                                        <option value="Web Development, React, Next.js" />
                                        <option value="Business Strategy, Management" />
                                    </datalist>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ExternalLink size={14}/> ลิงก์ผลงานเพิ่มเติม (ไม่บังคับ)</label>
                                {pLinks.map((link, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input type="text" placeholder="ชื่อปุ่ม (เช่น GitHub, อ่านข่าว)" value={link.label} onChange={e => { const newLinks=[...pLinks]; newLinks[i].label=e.target.value; setPLinks(newLinks); }} className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <input type="url" placeholder="URL ลิงก์ปลายทาง" value={link.url} onChange={e => { const newLinks=[...pLinks]; newLinks[i].url=e.target.value; setPLinks(newLinks); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <button type="button" onClick={() => setPLinks(pLinks.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"><X size={18}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setPLinks([...pLinks, {label: '', url: ''}])} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"><Plus size={14}/> เพิ่มลิงก์</button>
                            </div>
                            
                            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div><h4 className="text-sm font-bold text-blue-900">Defensive Status</h4><p className="text-xs text-blue-700 mt-1">ซ่อนไว้ก่อนหากยังจัดหน้าไม่เสร็จ</p></div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={pIsPublished} onChange={(e) => setPIsPublished(e.target.checked)} />
                                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">รายละเอียดงาน</label><MiniEditor value={pDesc} onChange={setPDesc} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">ตัวชี้วัดความสำเร็จ (Impact & Metrics)</label><MiniEditor value={pImpact} onChange={setPImpact} minHeight="80px" /></div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">จัดการรูปภาพผลงาน</label>
                                {pExistingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-3 mb-3">
                                        {pExistingImages.map((url, i) => (
                                            <div key={i} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setPExistingImages(pExistingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md z-10 hover:bg-red-600 transition"><X size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input type="file" accept="image/*" multiple onChange={(e) => setPFiles(Array.from(e.target.files || []))} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
                                {pFiles.length > 0 && <p className="text-xs text-blue-600 mt-2">เลือกรูปใหม่เพิ่ม {pFiles.length} รูป</p>}
                            </div>
                            
                            <div className="flex gap-4 pt-4 border-t border-gray-100">
                                {editingProject && <button type="button" onClick={() => handleDeleteProject(editingProject.id)} className="px-6 py-4 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition">ลบกิจกรรม</button>}
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2">{isSaving ? <><Loader size={18} className="animate-spin"/> กำลังบันทึก...</> : <><Save size={18}/> บันทึกกิจกรรม</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal จัดการเกียรติบัตร Admin (Certificates) */}
            {isAdmin && showCertModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg overflow-y-auto rounded-[2rem] shadow-2xl p-8 relative animate-fade-in">
                        <button onClick={() => setShowCertModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"><X size={20}/></button>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Award className="text-blue-600"/> {editingCert ? "แก้ไขเกียรติบัตร" : "เพิ่มเกียรติบัตรใหม่"}</h2>
                        <form onSubmit={handleSaveCert} className="space-y-5">
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อเกียรติบัตร / รางวัล</label><input type="text" required value={cTitle} onChange={e=>setCTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm" placeholder="เช่น Data Storytelling Excellence" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">หน่วยงานที่ออกให้</label><input type="text" required value={cIssuer} onChange={e=>setCIssuer(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm" placeholder="เช่น Bootcamp Co." /></div>
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">ปีที่ได้รับ</label><input type="text" required value={cYear} onChange={e=>setCYear(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm" placeholder="เช่น 2026" /></div>
                            
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label><MiniEditor value={cDesc} onChange={setCDesc} minHeight="80px" /></div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ExternalLink size={14}/> ลิงก์อ้างอิงเพิ่มเติม (ไม่บังคับ)</label>
                                {cLinks.map((link, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input type="text" placeholder="ชื่อปุ่ม (เช่น โพสต์ประกาศ)" value={link.label} onChange={e => { const newLinks=[...cLinks]; newLinks[i].label=e.target.value; setCLinks(newLinks); }} className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <input type="url" placeholder="URL ลิงก์ปลายทาง" value={link.url} onChange={e => { const newLinks=[...cLinks]; newLinks[i].url=e.target.value; setCLinks(newLinks); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <button type="button" onClick={() => setCLinks(cLinks.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"><X size={18}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setCLinks([...cLinks, {label: '', url: ''}])} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"><Plus size={14}/> เพิ่มลิงก์</button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">จัดการรูปภาพเกียรติบัตร</label>
                                {cExistingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {cExistingImages.map((url, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden group">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setCExistingImages(cExistingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md z-10 hover:bg-red-600 transition"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input type="file" accept="image/*" multiple onChange={(e) => setCFiles(Array.from(e.target.files || []))} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 cursor-pointer" />
                                {cFiles.length > 0 && <p className="text-xs text-blue-600 mt-2">เลือกรูปใหม่เพิ่ม {cFiles.length} รูป</p>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {editingCert && <button type="button" onClick={() => handleDeleteCert(editingCert.id)} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition text-sm">ลบ</button>}
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 text-sm">{isSaving ? <><Loader size={18} className="animate-spin"/> กำลังบันทึก...</> : <><Save size={18}/> บันทึกเกียรติบัตร</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal จัดการ Showcases (ผลงานหน้าหลัก) และระบบ Auto-fill */}
            {isAdmin && showShowcaseModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg overflow-y-auto rounded-[2rem] shadow-2xl p-8 relative animate-fade-in">
                        <button onClick={() => setShowShowcaseModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"><X size={20}/></button>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><FolderOpen className="text-blue-600"/> {editingShowcase ? "แก้ไขผลงาน" : "เพิ่มผลงานใหม่"}</h2>
                        
                        <form onSubmit={handleSaveShowcase} className="space-y-5">
                            
                            {!editingShowcase && availableImportOptions.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-2">
                                    <label className="block text-xs font-bold text-blue-800 mb-2 flex items-center gap-2">
                                        <Download size={14}/> นำเข้าผลงานด่วนจากหน้าประวัติ (Auto-fill)
                                    </label>
                                    <select value={importSource} onChange={handleImportSelect} className="w-full bg-white border border-blue-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm text-gray-700">
                                        <option value="">-- เลือกผลงานที่ต้องการนำเข้า --</option>
                                        {availableImportOptions.map((opt, idx) => (
                                            <option key={idx} value={idx}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อผลงาน</label><input type="text" required value={sTitle} onChange={e=>setSTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 text-sm" placeholder="เช่น โปสเตอร์แคมเปญ" /></div>
                            
                            <div><label className="block text-xs font-bold text-gray-500 mb-1">รายละเอียดสั้นๆ (ไม่บังคับ)</label><MiniEditor value={sDesc} onChange={setSDesc} minHeight="80px" /></div>
                            
                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><ExternalLink size={14}/> ลิงก์ผลงานเพิ่มเติม (ไม่บังคับ)</label>
                                {sLinks.map((link, i) => (
                                    <div key={i} className="flex gap-2 mb-2">
                                        <input type="text" placeholder="ชื่อปุ่ม" value={link.label} onChange={e => { const newLinks=[...sLinks]; newLinks[i].label=e.target.value; setSLinks(newLinks); }} className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <input type="url" placeholder="URL ลิงก์ปลายทาง" value={link.url} onChange={e => { const newLinks=[...sLinks]; newLinks[i].url=e.target.value; setSLinks(newLinks); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-gray-900 text-sm" />
                                        <button type="button" onClick={() => setSLinks(sLinks.filter((_, idx) => idx !== i))} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"><X size={18}/></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setSLinks([...sLinks, {label: '', url: ''}])} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition"><Plus size={14}/> เพิ่มลิงก์</button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">จัดการรูปภาพผลงาน</label>
                                {sExistingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {sExistingImages.map((url, i) => (
                                            <div key={i} className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden group">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setSExistingImages(sExistingImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-md z-10 hover:bg-red-600 transition"><X size={12}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input type="file" accept="image/*" multiple onChange={(e) => setSFiles(Array.from(e.target.files || []))} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 cursor-pointer" />
                                {sFiles.length > 0 && <p className="text-xs text-blue-600 mt-2">เลือกรูปใหม่เพิ่ม {sFiles.length} รูป</p>}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {editingShowcase && <button type="button" onClick={() => handleDeleteShowcase(editingShowcase.id)} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition text-sm">ลบ</button>}
                                <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 text-sm">{isSaving ? <><Loader size={18} className="animate-spin"/> กำลังบันทึก...</> : <><Save size={18}/> บันทึกผลงาน</>}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}