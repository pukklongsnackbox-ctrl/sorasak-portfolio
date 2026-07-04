"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { uploadToCloudinary } from '../../lib/uploadImage'; 
import Link from 'next/link';

// นำเข้า SVG Icons สไตล์มินิมอล
import { 
  Briefcase, ChevronDown, Mail, ExternalLink, 
  Star, User, ArrowLeft, MapPin, Phone, Calendar, Code, FileText, 
  Globe, Database, TrendingUp, Users, Sparkles, Video, CheckCircle2, 
  Edit3, Plus, Trash2, X, Save, Building, Palette, Monitor, Megaphone, 
  Target, Layout, Link as LinkIcon, 
  Eye, EyeOff, FolderOpen, Image as LucideImage, Maximize2, ArrowRight,
  Loader, Send,
  BookOpen, Lightbulb, Music, Camera, Mic, Award, Heart, Zap, Flag, Coffee, Rocket, Shield, Clock, Search, MessageSquare
} from 'lucide-react';

// ==========================================
// 🎨 Custom Brand Icons
// ==========================================
const FacebookIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>;
const LinkedinIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>;
const GithubIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.465-2.38 1.236-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.22 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>;
const InstagramIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const YoutubeIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const TwitterIcon = (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>;

const categoryIcons: Record<string, any> = {
  Star, Video, Sparkles, TrendingUp, Users, Building, Code, Database, Globe, Palette, Monitor, Megaphone, Target, Layout, Briefcase,
  BookOpen, Lightbulb, Music, Camera, Mic, Award, Heart, Zap, Flag, Coffee, Rocket, Shield, Clock, Search, MessageSquare
};

const socialIcons: Record<string, any> = {
  Facebook: FacebookIcon, 
  Instagram: InstagramIcon, 
  Linkedin: LinkedinIcon, 
  Github: GithubIcon, 
  Youtube: YoutubeIcon, 
  Twitter: TwitterIcon, 
  Globe, 
  LinkIcon, 
  Mail
};

const brandLogos = [
  { id: 'photoshop', name: 'Photoshop', url: 'https://cdn.simpleicons.org/adobephotoshop/31A8FF' },
  { id: 'illustrator', name: 'Illustrator', url: 'https://cdn.simpleicons.org/adobeillustrator/FF9A00' },
  { id: 'premiere', name: 'Premiere Pro', url: 'https://cdn.simpleicons.org/adobepremierepro/9999FF' },
  { id: 'aftereffects', name: 'After Effects', url: 'https://cdn.simpleicons.org/adobeaftereffects/9999FF' },
  { id: 'figma', name: 'Figma', url: 'https://cdn.simpleicons.org/figma/F24E1E' },
  { id: 'canva', name: 'Canva', url: 'https://cdn.simpleicons.org/canva/00C4CC' },
  { id: 'excel', name: 'Excel', url: 'https://cdn.simpleicons.org/microsoftexcel/217346' },
  { id: 'word', name: 'Word', url: 'https://cdn.simpleicons.org/microsoftword/2B579A' },
  { id: 'powerpoint', name: 'PowerPoint', url: 'https://cdn.simpleicons.org/microsoftpowerpoint/B7472A' },
  { id: 'notion', name: 'Notion', url: 'https://cdn.simpleicons.org/notion/000000' },
  { id: 'react', name: 'React', url: 'https://cdn.simpleicons.org/react/61DAFB' },
  { id: 'html5', name: 'HTML5', url: 'https://cdn.simpleicons.org/html5/E34F26' },
  { id: 'css3', name: 'CSS3', url: 'https://cdn.simpleicons.org/css3/1572B6' },
  { id: 'javascript', name: 'JavaScript', url: 'https://cdn.simpleicons.org/javascript/F7DF1E' },
  { id: 'python', name: 'Python', url: 'https://cdn.simpleicons.org/python/3776AB' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://cdn.simpleicons.org/openai/412991' }
];

const colorThemes: Record<string, any> = {
  emerald: { name: 'เขียว', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  blue: { name: 'น้ำเงิน', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  purple: { name: 'ม่วง', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  amber: { name: 'เหลือง', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  pink: { name: 'ชมพู', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600', badge: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  red: { name: 'แดง', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  orange: { name: 'ส้ม', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  teal: { name: 'เขียวน้ำ', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
  gray: { name: 'เทา', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' }
};

// ==========================================
// 💾 State ข้อมูลตั้งต้น (Initial Mock Data)
// ==========================================
const initialProfile = {
  fullName: 'สรศักดิ์ แย้มศรี',
  nickName: 'Sorasak Yamsri',
  jobTitle: 'นิสิตและนักสร้างสรรค์ดิจิทัล',
  avatarUrl: '', 
  age: '22 ปี',
  phone: '08X-XXX-XXXX',
  email: 'sorasak.y@example.com',
  address: 'พิษณุโลก, ประเทศไทย',
  summary: 'นิสิตคณะบริหารธุรกิจที่มีความสามารถรอบด้าน โดดเด่นด้านความเป็นผู้นำและการบริหารจัดการองค์การนิสิตระดับมหาวิทยาลัย มีทักษะครอบคลุมทั้งการกำหนดนโยบาย การสื่อสารทางธุรกิจ การสร้างสรรค์สื่อ ไปจนถึงเทคโนโลยี AI พร้อมนำประสบการณ์ไปประยุกต์ใช้ในการทำงานจริง',
  socials: [
    { id: 1, platform: 'Facebook', icon: 'Facebook', url: 'https://facebook.com', isVisible: true },
    { id: 2, platform: 'LinkedIn', icon: 'Linkedin', url: 'https://linkedin.com', isVisible: true },
    { id: 3, platform: 'Github', icon: 'Github', url: 'https://github.com', isVisible: false }
  ]
};

const initialCategories = [
  {
    id: 'cat-1', title: 'Student Organization & Admin', iconName: 'Building', colorName: 'emerald',
    skills: [
      { id: 's-11', name: 'Student Union Policy', desc: 'ร่างนโยบายและบริหารโครงสร้างองค์การนิสิตระดับมหาลัย', tools: ['Policy Making', 'Leadership'], portfolios: [] },
      { id: 's-12', name: 'Stakeholder Negotiation', desc: 'เจรจาต่อรองระหว่างผู้บริหารและนิสิต', tools: ['Negotiation'], portfolios: [] }
    ]
  },
  {
    id: 'cat-2', title: 'Creative & Media', iconName: 'Video', colorName: 'pink',
    skills: [
      { 
        id: 's-21', name: 'Content Creation', desc: 'คิดคอนเทนต์และเขียนสคริปต์สำหรับวิดีโอสั้น', tools: ['Storytelling', 'Copywriting'], 
        portfolios: [
          { 
            id: 'p-1', title: 'แคมเปญโปรโมทมหาวิทยาลัย (TikTok)', desc: 'เขียนสคริปต์และคิดคอนเทนต์วิดีโอสั้นลง TikTok มียอดผู้เข้าชมกว่า 100,000 ครั้ง',
            imageUrls: ['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80', 'https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=500&q=80'], link: 'https://tiktok.com' 
          },
          { 
            id: 'p-2', title: 'คอนเทนต์ให้ความรู้เชิงธุรกิจ', desc: 'เขียนสคริปต์วิดีโอสรุปข่าวธุรกิจรายสัปดาห์',
            imageUrls: ['https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=500&q=80'], link: '' 
          }
        ]
      },
      { id: 's-22', name: 'Graphic Design', desc: 'ออกแบบสื่อประชาสัมพันธ์โครงการต่างๆ', tools: ['Design', 'Branding'], portfolios: [] }
    ]
  },
  {
    id: 'cat-3', title: 'Business Strategy', iconName: 'TrendingUp', colorName: 'amber',
    skills: [
      { id: 's-31', name: 'Project Management', desc: 'บริหารโครงการ จัดสรรงบประมาณ และดูแลทีมงาน', tools: ['Agile', 'Planning'], portfolios: [] }
    ]
  }
];

const initialSoftware = [
  { 
    id: 'sw-1', name: 'Photoshop', level: 'คล่องแคล่ว', logoUrl: brandLogos[0].url, customLogo: false,
    portfolios: [
      { 
        id: 'p-3', title: 'ชุดโปสเตอร์ค่ายอาสา 2025', desc: 'ออกแบบชุด Key Visual และโปสเตอร์ประชาสัมพันธ์โครงการค่ายอาสาพัฒนาชนบท',
        imageUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80'], link: '' 
      }
    ]
  },
  { id: 'sw-2', name: 'Premiere Pro', level: 'ปานกลาง', logoUrl: brandLogos[2].url, customLogo: false, portfolios: [] },
  { id: 'sw-3', name: 'Figma', level: 'คล่องแคล่ว', logoUrl: brandLogos[4].url, customLogo: false, portfolios: [
      { 
        id: 'p-fig', title: 'App Design Project', desc: 'ออกแบบ UI/UX แอปพลิเคชัน E-Commerce',
        imageUrls: ['https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=500&q=80'], link: 'https://figma.com' 
      }
  ] },
  { id: 'sw-4', name: 'Excel', level: 'เชี่ยวชาญ', logoUrl: brandLogos[6].url, customLogo: false, portfolios: [] },
  { id: 'sw-5', name: 'ChatGPT', level: 'เชี่ยวชาญ', logoUrl: brandLogos[15].url, customLogo: false, portfolios: [] }
];

export default function AboutPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // View States
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [activePortfolio, setActivePortfolio] = useState<any | null>(null);
  const [portfolioUploadingId, setPortfolioUploadingId] = useState<string | null>(null);

  // Data States
  const [profile, setProfile] = useState<any>(initialProfile);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [softwares, setSoftwares] = useState<any[]>(initialSoftware);
  
  // UI States
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); 
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, type: string | null, targetId: string | null, targetCategoryId: string | null, data: any | null}>({ isOpen: false, type: null, targetId: null, targetCategoryId: null, data: null });
  
  // Forms States
  const [profileForm, setProfileForm] = useState<any>(initialProfile);
  const [categoryForm, setCategoryForm] = useState({ title: '', iconName: 'Star', colorName: 'gray' });
  const [skillForm, setSkillForm] = useState<{name: string, desc: string, tools: string, portfolios: any[]}>({ name: '', desc: '', tools: '', portfolios: [] });
  const [softwareForm, setSoftwareForm] = useState<{name: string, level: string, logoUrl: string, customLogo: boolean, portfolios: any[]}>({ name: '', level: 'ปานกลาง', logoUrl: '', customLogo: false, portfolios: [] });

  // Contact Edit State (หน้า About)
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // ==========================================
  // 🔗 Firebase Integration
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setIsAdmin(!!user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCMSData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "aboutPageV2"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.profile) {
            // merge กับ initialProfile เพื่อให้มี field ครบเสมอ
            const mergedProfile = { ...initialProfile, ...data.profile };
            // ถ้า socials จาก Firebase ไม่มี url field ให้ใช้ initialProfile แทน
            if (!data.profile.socials || data.profile.socials.length === 0) {
              mergedProfile.socials = initialProfile.socials;
            }
            setProfile(mergedProfile);
          }
          if (data.categories) setCategories(data.categories);
          if (data.softwares) setSoftwares(data.softwares);
        } else {
          await setDoc(doc(db, "settings", "aboutPageV2"), { profile: initialProfile, categories: initialCategories, softwares: initialSoftware });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchCMSData();
  }, []);

  const saveToFirebase = async (newProfile: any, newCategories: any[], newSoftwares: any[]) => {
    try {
      await setDoc(doc(db, "settings", "aboutPageV2"), { profile: newProfile, categories: newCategories, softwares: newSoftwares }, { merge: true });
    } catch (error) { console.error(error); alert("บันทึกข้อมูลไม่สำเร็จ"); }
  };

  // ==========================================
  // 🛠️ ฟังก์ชันจัดการข้อมูล (CRUD & Handlers)
  // ==========================================

  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null, targetId: null, targetCategoryId: null, data: null });
    setActivePortfolio(null);
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

  // --- Avatar Upload Handler ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
        const url = await uploadToCloudinary(file);
        if (url) {
            const newProfile = { ...profile, avatarUrl: url };
            setProfile(newProfile);
            setProfileForm(newProfile);
            await saveToFirebase(newProfile, categories, softwares);
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
        setIsUploadingAvatar(false);
    }
  };

  // --- Profile CRUD ---
  const openProfileModal = () => { setProfileForm(profile); setModalConfig({ isOpen: true, type: 'edit-profile', targetId: null, targetCategoryId: null, data: null }); };
  const saveProfile = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setProfile(profileForm); 
    await saveToFirebase(profileForm, categories, softwares);
    closeModal(); 
  };
  const addSocialLink = () => setProfileForm({ ...profileForm, socials: [...profileForm.socials, { id: Date.now(), platform: 'New Link', icon: 'Globe', url: '', isVisible: true }] });
  const updateSocialLink = (id: number, field: string, value: any) => setProfileForm({ ...profileForm, socials: profileForm.socials.map((s:any) => s.id === id ? { ...s, [field]: value } : s) });
  const deleteSocialLink = (id: number) => setProfileForm({ ...profileForm, socials: profileForm.socials.filter((s:any) => s.id !== id) });

  // --- Category CRUD ---
  const openCategoryModal = (catToEdit: any = null) => {
    if (catToEdit) { setCategoryForm({ title: catToEdit.title, iconName: catToEdit.iconName, colorName: catToEdit.colorName }); setModalConfig({ isOpen: true, type: 'edit-category', targetId: catToEdit.id, targetCategoryId: null, data: null }); }
    else { setCategoryForm({ title: '', iconName: 'Star', colorName: 'blue' }); setModalConfig({ isOpen: true, type: 'add-category', targetId: null, targetCategoryId: null, data: null }); }
  };
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    let newCategories = [];
    if (modalConfig.type === 'add-category') {
      newCategories = [...categories, { id: `cat-${Date.now()}`, ...categoryForm, skills: [] }];
    } else {
      newCategories = categories.map(cat => cat.id === modalConfig.targetId ? { ...cat, ...categoryForm } : cat);
    }
    setCategories(newCategories);
    await saveToFirebase(profile, newCategories, softwares);
    closeModal();
  };
  const deleteCategory = async (id: string) => { 
    if(window.confirm("ลบหมวดหมู่นี้และทักษะทั้งหมดภายใน?")) {
      const newCategories = categories.filter(cat => cat.id !== id);
      setCategories(newCategories);
      await saveToFirebase(profile, newCategories, softwares);
    } 
  };

  // --- Portfolio Array Management in Forms ---
  const handlePortfolioImageUpload = async (formType: string, portId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPortfolioUploadingId(portId);
    try {
      const uploaded = await Promise.all(Array.from(files).map(f => uploadToCloudinary(f)));
      const urls = uploaded.filter(Boolean) as string[];
      if (formType === 'skill') {
        setSkillForm(prev => ({ ...prev, portfolios: prev.portfolios.map(p => p.id === portId ? { ...p, imageUrls: [...(p.imageUrls || []), ...urls] } : p) }));
      }
      if (formType === 'software') {
        setSoftwareForm(prev => ({ ...prev, portfolios: prev.portfolios.map(p => p.id === portId ? { ...p, imageUrls: [...(p.imageUrls || []), ...urls] } : p) }));
      }
    } catch (e) { alert("อัปโหลดรูปไม่สำเร็จ"); } finally { setPortfolioUploadingId(null); }
  };

  const removePortfolioImage = (formType: string, portId: string, imgIdx: number) => {
    if (formType === 'skill') setSkillForm(prev => ({ ...prev, portfolios: prev.portfolios.map(p => p.id === portId ? { ...p, imageUrls: p.imageUrls.filter((_: any, i: number) => i !== imgIdx) } : p) }));
    if (formType === 'software') setSoftwareForm(prev => ({ ...prev, portfolios: prev.portfolios.map(p => p.id === portId ? { ...p, imageUrls: p.imageUrls.filter((_: any, i: number) => i !== imgIdx) } : p) }));
  };

  const addPortfolioToForm = (formType: string) => {
    const newPort = { id: `p-${Date.now()}`, title: '', desc: '', imageUrls: [], link: '' };
    if (formType === 'skill') setSkillForm({ ...skillForm, portfolios: [...skillForm.portfolios, newPort] });
    if (formType === 'software') setSoftwareForm({ ...softwareForm, portfolios: [...softwareForm.portfolios, newPort] });
  };
  const updatePortfolioInForm = (formType: string, id: string, field: string, value: any) => {
    if (formType === 'skill') setSkillForm({ ...skillForm, portfolios: skillForm.portfolios.map(p => p.id === id ? { ...p, [field]: value } : p) });
    if (formType === 'software') setSoftwareForm({ ...softwareForm, portfolios: softwareForm.portfolios.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };
  const deletePortfolioFromForm = (formType: string, id: string) => {
    if (formType === 'skill') setSkillForm({ ...skillForm, portfolios: skillForm.portfolios.filter(p => p.id !== id) });
    if (formType === 'software') setSoftwareForm({ ...softwareForm, portfolios: softwareForm.portfolios.filter(p => p.id !== id) });
  };

  // --- Skill CRUD ---
  const openSkillModal = (categoryId: string, skillToEdit: any = null) => {
    if (skillToEdit) { 
      setSkillForm({ name: skillToEdit.name, desc: skillToEdit.desc, tools: skillToEdit.tools ? skillToEdit.tools.join(', ') : '', portfolios: skillToEdit.portfolios || [] }); 
      setModalConfig({ isOpen: true, type: 'edit-skill', targetId: skillToEdit.id, targetCategoryId: categoryId, data: null }); 
    } else { 
      setSkillForm({ name: '', desc: '', tools: '', portfolios: [] }); 
      setModalConfig({ isOpen: true, type: 'add-skill', targetId: null, targetCategoryId: categoryId, data: null }); 
    }
  };
  const saveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const toolsArray = skillForm.tools.split(',').map(t => t.trim()).filter(t => t !== '');
    const newSkillData = { id: modalConfig.targetId || `s-${Date.now()}`, name: skillForm.name, desc: skillForm.desc, tools: toolsArray, portfolios: skillForm.portfolios };
    
    const newCategories = categories.map(cat => {
      if (cat.id === modalConfig.targetCategoryId) {
        return modalConfig.type === 'add-skill' ? { ...cat, skills: [...cat.skills, newSkillData] } : { ...cat, skills: cat.skills.map((s:any) => s.id === modalConfig.targetId ? { ...s, ...newSkillData } : s) };
      }
      return cat;
    });
    
    setCategories(newCategories);
    await saveToFirebase(profile, newCategories, softwares);
    closeModal();
  };
  const deleteSkill = async (categoryId: string, skillId: string) => {
    const newCategories = categories.map(cat => cat.id === categoryId ? { ...cat, skills: cat.skills.filter((s:any) => s.id !== skillId) } : cat);
    setCategories(newCategories);
    await saveToFirebase(profile, newCategories, softwares);
  };

  // --- Software CRUD ---
  const openSoftwareModal = (swToEdit: any = null) => {
    if (swToEdit) {
      const isPreset = brandLogos.some(b => b.url === swToEdit.logoUrl);
      setSoftwareForm({ name: swToEdit.name, level: swToEdit.level, logoUrl: swToEdit.logoUrl, portfolios: swToEdit.portfolios || [], customLogo: !isPreset && swToEdit.logoUrl !== '' });
      setModalConfig({ isOpen: true, type: 'edit-software', targetId: swToEdit.id, targetCategoryId: null, data: null });
    } else {
      setSoftwareForm({ name: '', level: 'ปานกลาง', logoUrl: brandLogos[0].url, customLogo: false, portfolios: [] });
      setModalConfig({ isOpen: true, type: 'add-software', targetId: null, targetCategoryId: null, data: null });
    }
  };
  const saveSoftware = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSwData = { id: modalConfig.targetId || `sw-${Date.now()}`, name: softwareForm.name, level: softwareForm.level, logoUrl: softwareForm.logoUrl, portfolios: softwareForm.portfolios, customLogo: softwareForm.customLogo };
    
    let newSoftwares = [];
    if (modalConfig.type === 'add-software') {
      newSoftwares = [...softwares, newSwData];
    } else {
      newSoftwares = softwares.map(sw => sw.id === modalConfig.targetId ? { ...sw, ...newSwData } : sw);
    }
    
    setSoftwares(newSoftwares);
    await saveToFirebase(profile, categories, newSoftwares);
    closeModal();
  };
  const deleteSoftware = async (id: string) => {
    const newSoftwares = softwares.filter(sw => sw.id !== id);
    setSoftwares(newSoftwares);
    await saveToFirebase(profile, categories, newSoftwares);
  };

  const openShowcaseModal = (data: any) => {
    setActivePortfolio(null); 
    setModalConfig({ isOpen: true, type: 'showcase', data: data, targetId: null, targetCategoryId: null });
  };

  // ==========================================
  // 🖼️ 1. ส่วนแสดงผล UI: Modals (Forms & Gallery)
  // ==========================================
  
  const PortfolioItemForm = ({ port, formType }: { port: any, formType: string }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 relative mb-4">
      <button type="button" onClick={() => deletePortfolioFromForm(formType, port.id)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 bg-red-50 p-1 rounded-md transition-colors"><Trash2 size={16}/></button>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">ชื่อผลงาน *</label><input required type="text" placeholder="เช่น โปสเตอร์แคมเปญ" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-gray-900 pr-10 outline-none" value={port.title} onChange={e => updatePortfolioInForm(formType, port.id, 'title', e.target.value)} /></div>
      <div><label className="block text-xs font-bold text-gray-700 mb-1">คำบรรยายผลงาน (Description)</label><textarea rows={2} placeholder="อธิบายรายละเอียดหรือผลลัพธ์ของงานนี้" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-gray-900 outline-none" value={port.desc} onChange={e => updatePortfolioInForm(formType, port.id, 'desc', e.target.value)} /></div>
      
      {/* อัปโหลดรูปภาพ */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2">รูปภาพผลงาน (อัปโหลดได้หลายรูป)</label>
        <label className={`flex items-center gap-2 cursor-pointer w-max px-4 py-2 rounded-lg border text-xs font-bold transition-colors ${portfolioUploadingId === port.id ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
          {portfolioUploadingId === port.id ? <><Loader size={14} className="animate-spin"/> กำลังอัปโหลด...</> : <><LucideImage size={14}/> เลือกรูปภาพ</>}
          <input type="file" accept="image/*" multiple className="hidden" disabled={portfolioUploadingId === port.id} onChange={e => handlePortfolioImageUpload(formType, port.id, e.target.files)} />
        </label>
        {port.imageUrls && port.imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {port.imageUrls.map((url: string, idx: number) => (
              <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePortfolioImage(formType, port.id, idx)} className="absolute inset-0 bg-red-500/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div><label className="block text-xs font-bold text-gray-700 mb-1">ลิงก์ผลงานภายนอก (External Link)</label><input type="url" placeholder="https://..." className="w-full text-sm px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-gray-900 outline-none" value={port.link} onChange={e => updatePortfolioInForm(formType, port.id, 'link', e.target.value)} /></div>
    </div>
  );

  const renderModals = () => {
    if (lightboxImage) {
      return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 sm:p-8" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full backdrop-blur transition-all"><X size={28}/></button>
          <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()} />
        </div>
      );
    }

    if (!modalConfig.isOpen) return null;

    if (modalConfig.type === 'showcase') {
      const { data } = modalConfig;
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#fafafa] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
            <div className="sticky top-0 flex justify-between items-center p-6 border-b border-gray-200 bg-white z-10">
              <div>
                <h3 className="font-bold text-gray-900 text-xl sm:text-2xl mb-1">แกลเลอรีผลงาน</h3>
                <p className="text-gray-500 text-xs sm:text-sm flex flex-wrap items-center gap-2">
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{data.name}</span>
                  {activePortfolio && <><ChevronDown size={14} className="-rotate-90"/> <span className="text-gray-600 font-medium truncate max-w-[150px] sm:max-w-xs">{activePortfolio.title}</span></>}
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors shrink-0"><X size={24}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              {!activePortfolio ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-left-4 duration-300">
                  {data.portfolios.map((port:any) => {
                    const coverImage = port.imageUrls && port.imageUrls.length > 0 ? port.imageUrls[0] : null;
                    const imageCount = port.imageUrls ? port.imageUrls.length : 0;
                    return (
                      <div key={port.id} onClick={() => setActivePortfolio(port)} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col">
                        <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                          {coverImage ? <img src={coverImage} alt={port.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e:any) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found" }} /> : <div className="text-gray-400 flex flex-col items-center gap-2"><LucideImage size={32} className="opacity-50"/> <span className="text-xs">[ไม่มีรูปภาพปก]</span></div>}
                          {imageCount > 1 && <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5"><LucideImage size={12}/> +{imageCount}</div>}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h4 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{port.title || 'ผลงานไม่มีชื่อ'}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{port.desc}</p>
                          <div className="mt-4 text-blue-600 font-bold text-sm flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">ดูรายละเอียด <ArrowRight size={16}/></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-4xl mx-auto">
                  <button onClick={() => setActivePortfolio(null)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 transition-colors w-max hover:-translate-x-1">
                    <ArrowLeft size={16}/> กลับไปหน้ารวมอัลบั้ม
                  </button>

                  <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{activePortfolio.title}</h2>
                    {activePortfolio.desc && <p className="text-gray-600 leading-relaxed mb-6 bg-gray-50 p-5 rounded-xl border border-gray-100 whitespace-pre-line">{activePortfolio.desc}</p>}
                    {activePortfolio.link && <a href={activePortfolio.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800 px-6 py-3 rounded-xl font-bold transition-all hover:shadow-md">ดูผลงานต้นฉบับ <ExternalLink size={18} /></a>}
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2"><LucideImage size={20} className="text-blue-500"/> รูปภาพในผลงาน ({activePortfolio.imageUrls ? activePortfolio.imageUrls.length : 0})</h3>
                  
                  {activePortfolio.imageUrls && activePortfolio.imageUrls.length > 0 ? (
                    <div className={`grid gap-4 ${activePortfolio.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {activePortfolio.imageUrls.map((url:string, idx:number) => (
                        <div key={idx} className="bg-gray-200 rounded-xl overflow-hidden cursor-zoom-in relative group border border-gray-100 shadow-sm" onClick={() => setLightboxImage(url)}>
                          <img src={url} alt={`portfolio-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e:any) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Not+Found" }} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" size={28}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-400"><LucideImage size={40} className="mx-auto mb-3 opacity-30"/><p>ไม่มีรูปภาพสำหรับผลงานชิ้นนี้</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
          
          <div className="sticky top-0 flex justify-between items-center p-5 border-b border-gray-100 bg-white z-10">
            <h3 className="font-bold text-gray-900 text-lg">
              {modalConfig.type === 'edit-profile' && 'แก้ไขข้อมูลส่วนตัว'}
              {modalConfig.type === 'add-category' && 'เพิ่มหมวดหมู่ทักษะใหม่'}
              {modalConfig.type === 'edit-category' && 'แก้ไขหมวดหมู่'}
              {modalConfig.type === 'add-skill' && 'เพิ่มทักษะย่อย'}
              {modalConfig.type === 'edit-skill' && 'แก้ไขทักษะย่อย'}
              {modalConfig.type === 'add-software' && 'เพิ่มโปรแกรม / เครื่องมือ'}
              {modalConfig.type === 'edit-software' && 'แก้ไขโปรแกรม / เครื่องมือ'}
            </h3>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={20}/></button>
          </div>

          <div className="p-6 bg-gray-50/50">
            
            {/* Profile Form */}
            {modalConfig.type === 'edit-profile' && (
               <form onSubmit={saveProfile} className="space-y-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ-นามสกุล *</label><input required type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} /></div>
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">ตำแหน่ง / ชื่อเล่น</label><input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.nickName} onChange={e => setProfileForm({...profileForm, nickName: e.target.value})} /></div>
                 </div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">ตำแหน่งงาน / คำอธิบายสั้นๆ (แสดงใน Resume)</label><input type="text" placeholder="เช่น นิสิตและนักสร้างสรรค์ดิจิทัล" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.jobTitle || ''} onChange={e => setProfileForm({...profileForm, jobTitle: e.target.value})} /></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">ลิงก์รูปโปรไฟล์ (Avatar URL)</label><input type="url" placeholder="เว้นว่างไว้เพื่อใช้ไอคอนแทน" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.avatarUrl || ''} onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})} /></div>
                 <div className="grid grid-cols-2 gap-4">
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">อายุ</label><input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} /></div>
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">เบอร์โทรศัพท์</label><input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} /></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">อีเมล</label><input type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} /></div>
                   <div><label className="block text-sm font-bold text-gray-700 mb-1">ที่อยู่ (สั้นๆ)</label><input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} /></div>
                 </div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-1">คำโปรย (Professional Summary)</label><textarea rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none whitespace-pre-line" value={profileForm.summary} onChange={e => setProfileForm({...profileForm, summary: e.target.value})} /></div>
                 
                 <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center mb-2"><h4 className="font-bold text-sm text-gray-900 flex items-center gap-2"><LinkIcon size={16}/> ช่องทางการติดต่อออนไลน์</h4><button type="button" onClick={addSocialLink} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-gray-800 font-bold transition-colors"><Plus size={14} /> เพิ่ม</button></div>
                  <div className="space-y-3">
                    {profileForm.socials.map((social:any) => (
                      <div key={social.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <select className="text-sm border border-gray-200 bg-white rounded-md p-2 outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto" value={social.icon} onChange={(e) => updateSocialLink(social.id, 'icon', e.target.value)}>{Object.keys(socialIcons).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}</select>
                        <input type="url" placeholder="https://..." className="w-full text-sm border border-gray-200 bg-white rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500" value={social.url} onChange={(e) => updateSocialLink(social.id, 'url', e.target.value)} />
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => updateSocialLink(social.id, 'isVisible', !social.isVisible)} className={`p-2 rounded-md transition-colors ${social.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`} title="เปิด/ปิด การแสดงผล">{social.isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                          <button type="button" onClick={() => deleteSocialLink(social.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"><Save size={18}/> บันทึกข้อมูลส่วนตัว</button>
               </form>
            )}

            {/* Software Form */}
            {modalConfig.type && modalConfig.type.includes('software') && (
              <form onSubmit={saveSoftware} className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">ชื่อโปรแกรม / เครื่องมือ *</label><input required type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none" value={softwareForm.name} onChange={e => setSoftwareForm({...softwareForm, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">ระดับความชำนาญ</label><select className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none appearance-none" value={softwareForm.level} onChange={e => setSoftwareForm({...softwareForm, level: e.target.value})}><option value="พื้นฐาน">พื้นฐาน</option><option value="ปานกลาง">ปานกลาง</option><option value="คล่องแคล่ว">คล่องแคล่ว</option><option value="เชี่ยวชาญ">เชี่ยวชาญ</option></select></div>
                  
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-gray-700">เลือกโลโก้โปรแกรม</label>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={softwareForm.customLogo} onChange={(e) => setSoftwareForm({...softwareForm, customLogo: e.target.checked, logoUrl: e.target.checked ? '' : brandLogos[0].url})} className="rounded text-blue-600 focus:ring-blue-500 border-gray-300" /> อัปโหลดรูปเอง</label>
                    </div>
                    {!softwareForm.customLogo ? (
                      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-1">
                        {brandLogos.map((brand) => (
                          <button type="button" key={brand.id} onClick={() => setSoftwareForm({...softwareForm, logoUrl: brand.url})} className={`aspect-square rounded-lg border flex items-center justify-center p-2 bg-white ${softwareForm.logoUrl === brand.url ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm scale-105' : 'border-gray-200 hover:border-gray-300'} transition-all`} title={brand.name}>
                            <img src={brand.url} alt={brand.name} className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer w-max px-4 py-2.5 rounded-lg border text-sm font-bold bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors">
                          <LucideImage size={16}/> เลือกรูปโลโก้จากเครื่อง
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const url = await uploadToCloudinary(f);
                            if (url) setSoftwareForm({...softwareForm, logoUrl: url});
                          }} />
                        </label>
                        {softwareForm.logoUrl && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <img src={softwareForm.logoUrl} alt="preview" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1" onError={(e:any)=>{e.target.style.display='none'}}/>
                            <div>
                              <p className="text-xs font-bold text-gray-700">รูปโลโก้ที่เลือก</p>
                              <button type="button" onClick={() => setSoftwareForm({...softwareForm, logoUrl: ''})} className="text-xs text-red-500 hover:underline mt-0.5">ลบออก</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-blue-900">แกลเลอรีผลงาน (Showcase)</label>
                    <button type="button" onClick={() => addPortfolioToForm('software')} className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-blue-50 shadow-sm transition-colors"><Plus size={14}/> เพิ่มผลงาน</button>
                  </div>
                  {softwareForm.portfolios.map(port => <PortfolioItemForm key={port.id} port={port} formType="software" />)}
                  {softwareForm.portfolios.length === 0 && <p className="text-xs text-gray-500 text-center py-4 bg-white rounded-lg border border-dashed border-gray-300">กดเพิ่มผลงานเพื่อให้ระบบสร้างปุ่ม 'ดูผลงาน' อัตโนมัติ</p>}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"><Save size={18}/> บันทึกโปรแกรม</button>
              </form>
            )}

            {/* Skill Form */}
            {modalConfig.type && modalConfig.type.includes('skill') && (
               <form onSubmit={saveSkill} className="space-y-6">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">ชื่อทักษะ *</label><input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={skillForm.name} onChange={e => setSkillForm({...skillForm, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">คำอธิบายย่อ</label><textarea rows={2} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none whitespace-pre-line" value={skillForm.desc} onChange={e => setSkillForm({...skillForm, desc: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">คีย์เวิร์ด (คั่นด้วยลูกน้ำ)</label><input type="text" placeholder="เช่น การนำเสนอ, การเจรจา" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={skillForm.tools} onChange={e => setSkillForm({...skillForm, tools: e.target.value})} /></div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-blue-900">แกลเลอรีผลงาน (Showcase)</label>
                    <button type="button" onClick={() => addPortfolioToForm('skill')} className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-blue-50 shadow-sm transition-colors"><Plus size={14}/> เพิ่มผลงาน</button>
                  </div>
                  {skillForm.portfolios.map(port => <PortfolioItemForm key={port.id} port={port} formType="skill" />)}
                  {skillForm.portfolios.length === 0 && <p className="text-xs text-gray-500 text-center py-4 bg-white rounded-lg border border-dashed border-gray-300">กดเพิ่มผลงานเพื่อให้ระบบสร้างปุ่ม 'ดูผลงาน' อัตโนมัติ</p>}
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"><Save size={18}/> บันทึกทักษะ</button>
              </form>
            )}

            {/* Category Form */}
            {modalConfig.type && modalConfig.type.includes('category') && (
              <form onSubmit={saveCategory} className="space-y-6">
                 <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-6">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">ชื่อหมวดหมู่ทักษะ *</label><input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" value={categoryForm.title} onChange={e => setCategoryForm({...categoryForm, title: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">เลือกสีธีม</label><div className="flex flex-wrap gap-3">{Object.entries(colorThemes).map(([colorKey, theme]) => (<button type="button" key={colorKey} title={theme.name} onClick={() => setCategoryForm({...categoryForm, colorName: colorKey})} className={`w-10 h-10 rounded-full border-4 ${theme.dot} ${categoryForm.colorName === colorKey ? 'border-gray-900 scale-110 shadow-md ring-2 ring-gray-400' : 'border-white shadow-sm'} transition-all`}></button>))}</div></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">เลือกไอคอน</label><div className="grid grid-cols-6 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">{Object.keys(categoryIcons).map((iconName) => { const IconComp = categoryIcons[iconName]; return (<button type="button" key={iconName} onClick={() => setCategoryForm({...categoryForm, iconName})} className={`p-3 rounded-lg border transition-all ${categoryForm.iconName === iconName ? 'bg-white border-blue-500 text-blue-600 shadow-sm ring-1 ring-blue-100' : 'border-transparent text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}><IconComp size={24} /></button>); })}</div></div>
                 </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-full font-bold hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"><Save size={18}/> บันทึกหมวดหมู่</button>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 📄 2. ส่วนแสดงผล UI: ABOUT PAGE (ประวัติ & ทักษะ)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-800 font-['IBM_Plex_Sans_Thai'] selection:bg-blue-200 pb-0 flex flex-col">
      {renderModals()}
      
      {/* 🚀 Navigation - สีจุด Active เป็นดำสไตล์มินิมอล */}
    {/* --- Navigation (เมนูสากลสำหรับหน้า About และ Resume) --- */}
       {/* 🌟 --- Navigation (สำหรับหน้า About) --- 🌟 */}
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

                        {/* จุด Active อยู่ที่หน้า About */}
                        <Link href="/about" className="relative flex justify-center transition-colors text-gray-900 font-bold">
                            About
                            <span className="absolute -bottom-2 w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                        </Link>
                        
                        <Link href="/resume" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">Resume</Link>
                        <Link href="/#contact" className="relative flex justify-center transition-colors text-gray-500 hover:text-gray-900">Contact</Link>
                    </div>
                </div>
            </nav>

      {/* 🚀 Main Content Area ของ About Page */}
      <main className="flex-1 animate-in fade-in duration-500 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-32">
          
          {/* Header & CMS Button */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-4 transition-colors bg-white px-4 py-2 rounded-full shadow-sm w-max border border-gray-100 hover:-translate-x-1">
                <ArrowLeft size={18} /> กลับสู่หน้าหลัก
              </Link>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">ประวัติและทักษะความสามารถ</h1>
              <p className="text-gray-500 font-medium">ข้อมูลส่วนตัว ทักษะเชิงลึก และแกลเลอรีผลงาน (Portfolio)</p>
            </div>
            {isAdmin && (
                <button onClick={() => setIsEditingMode(!isEditingMode)} className={`flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-full transition-all shadow-sm border ${isEditingMode ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'}`}>
                    {isEditingMode ? <><Save size={18}/> ปิดระบบจัดการเนื้อหา (CMS)</> : <><Edit3 size={18}/> เข้าสู่ระบบจัดการ (Edit Mode)</>}
                </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* 🌟 ฝั่งซ้าย: Profile Sidebar */}
            <div className="w-full lg:w-[320px] shrink-0">
              <div className={`bg-white rounded-2xl p-8 sticky top-28 transition-all duration-300 border ${isEditingMode ? 'border-blue-300 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                {isEditingMode && <button onClick={openProfileModal} className="absolute top-4 right-4 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all shadow-sm"><Edit3 size={14}/> แก้ไขโปรไฟล์</button>}
                
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto bg-gray-50 rounded-full mb-6 flex items-center justify-center text-gray-300 overflow-hidden relative border-[3px] border-white shadow-sm group">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className={`w-full h-full object-cover transition-opacity duration-300 ${isUploadingAvatar ? 'opacity-50 blur-sm' : ''}`} onError={(e:any) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f8fafc/94a3b8?text=User" }} />
                  ) : (
                    <User size={48} className={`opacity-20 ${isUploadingAvatar ? 'opacity-10 blur-sm' : ''}`} />
                  )}
                  
                  {isEditingMode && (
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-[2px]">
                      {isUploadingAvatar ? (
                          <span className="text-[10px] font-bold flex items-center gap-1"><Loader size={12} className="animate-spin"/> กำลังอัปโหลด...</span>
                      ) : (
                          <>
                              <LucideImage size={24} className="mb-1" />
                              <span className="text-[10px] font-bold">เปลี่ยนรูปโปรไฟล์</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          </>
                      )}
                    </label>
                  )}
                </div>
                
                <h2 className="text-2xl font-black text-center text-gray-900 mb-1 tracking-tight">{profile.fullName}</h2>
                <p className="text-center text-blue-600 text-sm mb-6 font-bold bg-blue-50 px-3 py-1 rounded-full w-max mx-auto">{profile.nickName}</p>
                
                <div className="space-y-4 text-sm text-gray-600 mb-8 border-t border-gray-100 pt-6">
                  {profile.age && <div className="flex items-center gap-3"><Calendar size={18} className="text-gray-400"/> {profile.age}</div>}
                  {profile.phone && <div className="flex items-center gap-3"><Phone size={18} className="text-gray-400"/> {profile.phone}</div>}
                  {profile.email && <div className="flex items-center gap-3"><Mail size={18} className="text-gray-400"/> <span className="truncate">{profile.email}</span></div>}
                  {profile.address && <div className="flex items-start gap-3"><MapPin size={18} className="text-gray-400 shrink-0 mt-0.5"/> <span className="leading-snug">{profile.address}</span></div>}
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 border-t border-gray-100 pt-6">
                  {profile.socials.filter((s:any) => s.isVisible && s.url).map((social:any) => {
                    // ค้นหา icon แบบ case-insensitive
                    const iconKey = Object.keys(socialIcons).find(k => k.toLowerCase() === (social.icon || '').toLowerCase()) || '';
                    const IconComp = socialIcons[iconKey] || Globe;
                    return (<a key={social.id} href={social.url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-50 text-gray-600 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center transition-all hover:-translate-y-1 shadow-sm border border-gray-200"><IconComp size={18} /></a>);
                  })}
                </div>
              </div>
            </div>

            {/* 🌟 ฝั่งขวา: Summary, Skills, Software */}
            <div className="w-full lg:flex-1 space-y-12">
              
              <section className={`transition-all ${isEditingMode ? 'opacity-40 pointer-events-none' : ''}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText className="text-gray-400" /> ข้อมูลโดยสรุป</h3>
                <p className="text-gray-600 leading-relaxed bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm text-base sm:text-lg whitespace-pre-line">{profile.summary}</p>
              </section>

              <section>
                <div className="flex justify-between mb-6 gap-4">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="text-amber-500 fill-amber-500" /> ทักษะ เครื่องมือ และผลงาน</h3>
                </div>

                {/* Grid หมวดหมู่ทักษะ */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  {categories.map((category) => {
                    const theme = colorThemes[category.colorName] || colorThemes.gray;
                    const IconComponent = categoryIcons[category.iconName] || Star;
                    
                    return (
                      <div key={category.id} className={`${theme.bg} border ${theme.border} p-6 sm:p-8 rounded-2xl relative group transition-all`}>
                        <div className="flex justify-between items-start mb-6">
                          <h4 className={`font-bold text-lg sm:text-xl flex items-center gap-2.5 ${theme.text}`}><IconComponent size={24} /> {category.title}</h4>
                          {isEditingMode && (
                            <div className="flex gap-1 bg-white p-1.5 rounded-lg shadow-sm border border-gray-200">
                              <button onClick={() => openCategoryModal(category)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit3 size={16}/></button>
                              <div className="w-px bg-gray-200 my-1"></div>
                              <button onClick={() => deleteCategory(category.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16}/></button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          {category.skills.map((skill:any) => {
                            const hasPortfolio = skill.portfolios && skill.portfolios.length > 0;
                            return (
                              <div key={skill.id} className="relative bg-white/80 backdrop-blur-md p-5 rounded-xl border border-white group/skill shadow-sm hover:shadow-md transition-shadow">
                                <h5 className="font-bold text-gray-900 text-base mb-2 pr-10">{skill.name}</h5>
                                {skill.desc && <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-line">{skill.desc}</p>}
                                
                                <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">
                                  <div className="flex flex-wrap gap-1.5">
                                    {skill.tools && skill.tools.map((tool:string, idx:number) => <span key={idx} className={`text-xs px-2.5 py-1 rounded-md font-bold ${theme.badge}`}>{tool}</span>)}
                                  </div>
                                  {!isEditingMode && hasPortfolio && (
                                    <button onClick={() => openShowcaseModal({ name: category.title, portfolios: skill.portfolios })} className="text-xs font-bold bg-gray-900 text-white px-3.5 py-2 rounded-full flex items-center gap-1.5 hover:bg-blue-600 transition-colors shadow-sm ml-auto hover:-translate-y-0.5">
                                      <FolderOpen size={14}/> แกลเลอรี
                                    </button>
                                  )}
                                </div>

                                {isEditingMode && (
                                  <div className="absolute -top-3 -right-3 flex flex-col gap-1 bg-white border border-gray-200 p-1.5 rounded-lg shadow-lg z-10">
                                    <button onClick={() => openSkillModal(category.id, skill)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit3 size={14}/></button>
                                    <div className="h-px bg-gray-100 mx-1"></div>
                                    <button onClick={() => deleteSkill(category.id, skill.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={14}/></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {isEditingMode && <button onClick={() => openSkillModal(category.id)} className={`mt-5 w-full py-3 flex justify-center gap-2 text-sm font-bold rounded-xl border border-dashed ${theme.text} border-current opacity-50 bg-white/60 hover:bg-white hover:opacity-100 transition-colors shadow-sm`}><Plus size={18}/> เพิ่มทักษะ</button>}
                      </div>
                    );
                  })}
                  {/* ปุ่มเพิ่มหมวดหมู่ใหม่ */}
                  {isEditingMode && (
                    <button onClick={() => openCategoryModal()} className="min-h-[250px] border border-dashed border-gray-300 bg-white/50 rounded-2xl flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all gap-3 shadow-sm">
                      <div className="bg-white p-4 rounded-full shadow-sm border border-gray-100 text-blue-500"><Plus size={28}/></div>
                      <span className="font-bold text-base">สร้างหมวดหมู่ใหม่</span>
                    </button>
                  )}
                </div>

                {/* โปรแกรม (Software Logos) */}
                <div className="bg-white border border-gray-100 shadow-sm p-6 sm:p-8 rounded-2xl relative transition-all">
                  <div className="flex justify-between items-start mb-8"><h4 className="font-bold text-xl flex items-center gap-2.5 text-gray-800"><Monitor size={24} className="text-blue-500" /> โปรแกรมและเครื่องมือทางเทคนิค</h4></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {softwares.map((sw) => {
                      const hasPortfolio = sw.portfolios && sw.portfolios.length > 0;
                      let levelColor = sw.level === 'เชี่ยวชาญ' ? "bg-emerald-100 text-emerald-700" : sw.level === 'คล่องแคล่ว' ? "bg-blue-100 text-blue-700" : sw.level === 'ปานกลาง' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600";
                      return (
                        <div key={sw.id} className="relative group bg-gray-50 border border-gray-100 shadow-sm p-5 rounded-xl flex flex-col items-center text-center hover:bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                          
                          <div className="w-14 h-14 sm:w-16 sm:h-16 mb-4 flex items-center justify-center p-1.5">
                            {sw.logoUrl ? (
                              <img
                                src={sw.logoUrl}
                                alt={sw.name}
                                className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300"
                                onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-white border border-gray-100 rounded-lg items-center justify-center text-gray-400 ${sw.logoUrl ? 'hidden' : 'flex'}`} style={{display: sw.logoUrl ? 'none' : 'flex'}}><Monitor size={24}/></div>
                          </div>
                          <h5 className="font-bold text-gray-900 text-sm sm:text-base mb-2">{sw.name}</h5>
                          <span className={`text-[10px] sm:text-xs px-3 py-1 rounded-md font-bold ${levelColor} mb-4`}>{sw.level}</span>
                          
                          {!isEditingMode && hasPortfolio && (
                            <button onClick={() => openShowcaseModal({ name: 'โปรแกรม/เครื่องมือ', portfolios: sw.portfolios })} className="w-full mt-auto text-xs font-bold bg-white text-gray-700 border border-gray-200 py-2.5 rounded-full flex items-center justify-center gap-1.5 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors shadow-sm">
                              <FolderOpen size={14}/> ดูผลงาน ({sw.portfolios.length})
                            </button>
                          )}

                          {isEditingMode && (
                            <div className="absolute -top-3 -right-3 flex flex-col gap-1 bg-white border border-gray-200 p-1.5 rounded-lg shadow-lg z-10">
                              <button onClick={() => openSoftwareModal(sw)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit3 size={14}/></button>
                              <div className="h-px bg-gray-100 mx-1"></div>
                              <button onClick={() => deleteSoftware(sw.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={14}/></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isEditingMode && (
                      <button onClick={() => openSoftwareModal()} className="border border-dashed border-gray-300 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all min-h-[180px] gap-3 shadow-sm">
                        <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100 text-blue-500"><Plus size={24} /></div><span className="font-bold text-sm">เพิ่มโปรแกรม</span>
                      </button>
                    )}
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}