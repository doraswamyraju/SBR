import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- IMPORT GLOBAL COMPONENTS ---
import CustomCursor from './components/CustomCursor';
import ChatbotModal from './components/ChatbotModal';
import FloatingActionButtons from './components/FloatingActionButtons';
import ContactModal from './components/ContactModal';
import TimedWelcomeModal from './components/TimedWelcomeModal';
import Header from './components/Header';
import Footer from './components/Footer';

// --- IMPORT INDIVIDUAL PAGE COMPONENTS ---
import HomePage from './pages/Home Page';
import AboutPage from './pages/About Us';
import ProductsPage from './pages/All Products';
import ProductScalenorPage from './pages/scalenors page';


import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import ProductDetail from './pages/ProductDetail';
import BlogDetail from './pages/BlogDetail';

// --- MAIN APP COMPONENT ---
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

const parsePath = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return { pageId: 'home' };
    if (path === '/login') return { pageId: 'auth' };
    if (path === '/admin') return { pageId: 'admin-dashboard', tab: 'overview' };
    if (path.startsWith('/admin/')) {
        return { pageId: 'admin-dashboard', tab: path.substring(7) };
    }
    if (path === '/customer') return { pageId: 'customer-dashboard', tab: 'overview' };
    if (path.startsWith('/customer/')) {
        return { pageId: 'customer-dashboard', tab: path.substring(10) };
    }
    if (path === '/agent') return { pageId: 'agent-dashboard', tab: 'jobs' };
    if (path.startsWith('/agent/')) {
        return { pageId: 'agent-dashboard', tab: path.substring(7) };
    }
    if (path === '/about') return { pageId: 'about' };
    if (path === '/products') return { pageId: 'products' };
    if (path.startsWith('/product/')) {
        const productId = path.substring(9);
        return { pageId: 'product-detail', productId };
    }
    // Match root-level URL slugs (e.g. /5-signs-switch-to-solar-water-heater)
    const slug = path.substring(1);
    if (slug && !slug.includes('/')) {
        return { pageId: 'blog-detail', blogSlug: slug };
    }
    return { pageId: 'home' };
};

function AppContent() {
    const initialRoute = parsePath();
    const [currentPage, setCurrentPage] = useState(initialRoute.pageId);
    const [currentTab, setCurrentTab] = useState(initialRoute.tab || '');
    const [currentProductId, setCurrentProductId] = useState(initialRoute.productId || '');
    const [currentBlogSlug, setCurrentBlogSlug] = useState(initialRoute.blogSlug || '');
    const [blogs, setBlogs] = useState([]);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);
    const [isTimedWelcomeModalOpen, setIsTimedWelcomeModalOpen] = useState(false);

    // Context state
    const { user, loading: authLoading } = useAuth();

    // Fetch all blogs on mount
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const response = await fetch('/api/blogs');
                const result = await response.json();
                if (result.success) {
                    setBlogs(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch blogs on startup:', err);
            }
        };
        fetchBlogs();
    }, []);

    // Listen to popstate event for back/forward navigation
    useEffect(() => {
        const handlePopState = () => {
            const route = parsePath();
            setCurrentPage(route.pageId);
            setCurrentTab(route.tab || '');
            setCurrentProductId(route.productId || '');
            setCurrentBlogSlug(route.blogSlug || '');
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);



    // Firebase state (will remain null if Firebase is not initialized)
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // --- LOCAL DEVELOPMENT FIX: Explicitly define Canvas-specific globals for local environment ---
    const __firebase_config = undefined;
    const __initial_auth_token = undefined;
    const __app_id = undefined;

    // Initialize Firebase and set up auth listener
    useEffect(() => {
        const localFirebaseConfig = {
            apiKey: "YOUR_FIREBASE_API_KEY", // Placeholder
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Placeholder
            projectId: "YOUR_PROJECT_ID", // Placeholder
            storageBucket: "YOUR_PROJECT_ID.appspot.com",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config !== null) ? JSON.parse(__firebase_config) : localFirebaseConfig;
        const initialAuthToken = (typeof __initial_auth_token !== 'undefined' && __initial_auth_token !== null) ? __initial_auth_token : null;
        const currentAppId = (typeof __app_id !== 'undefined' && __app_id !== null) ? __app_id : 'default-app-id';

        if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
            try {
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);

                setDb(firestoreDb);
                setAuth(firebaseAuth);

                const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                    if (user) {
                        setUserId(user.uid);
                    } else {
                        if (initialAuthToken) {
                            try {
                                await signInWithCustomToken(firebaseAuth, initialAuthToken);
                                setUserId(firebaseAuth.currentUser?.uid);
                            } catch (error) {
                                console.error("Error signing in with custom token:", error);
                                await signInAnonymously(firebaseAuth);
                                setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                            }
                        } else {
                            await signInAnonymously(firebaseAuth);
                            setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                        }
                    }
                    setIsAuthReady(true);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error initializing Firebase:", error);
                setIsAuthReady(true);
            }
        } else {
            console.log("Firebase not initialized. Provide valid API key in App.jsx for Firebase features to work.");
            setIsAuthReady(true);
        }
    }, []);


    const openContactModal = () => setIsContactModalOpen(true);
    const closeContactModal = () => setIsContactModalOpen(false);

    const openChatbotModal = () => setIsChatbotModalOpen(true);
    const closeChatbotModal = () => setIsChatbotModalOpen(false);

    const openTimedWelcomeModal = () => setIsTimedWelcomeModalOpen(true);
    const closeTimedWelcomeModal = () => setIsTimedWelcomeModalOpen(false);

    // Effect to trigger the timed welcome modal after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            openTimedWelcomeModal();
        }, 5000); // 5 seconds
        return () => clearTimeout(timer);
    }, []);

    // Handle navigation for single page application
    const handleNavigation = (pageInput) => {
        let pageId, tab, productId, blogSlug;
        
        if (typeof pageInput === 'string') {
            pageId = pageInput;
            
            // Map legacy page IDs or shortcut strings
            if (pageId === 'admin-dashboard') tab = 'overview';
            else if (pageId === 'customer-dashboard') tab = 'overview';
            else if (pageId === 'agent-dashboard') tab = 'jobs';
            else if (pageId.startsWith('product-')) {
                productId = pageId.substring(8);
                pageId = 'product-detail';
            } else if (pageId.startsWith('blog-')) {
                blogSlug = pageId.substring(5);
                pageId = 'blog-detail';
            }
        } else {
            pageId = pageInput.pageId;
            tab = pageInput.tab;
            productId = pageInput.productId;
            blogSlug = pageInput.blogSlug;
        }

        setCurrentPage(pageId);
        setCurrentTab(tab || '');
        setCurrentProductId(productId || '');
        setCurrentBlogSlug(blogSlug || '');
        
        let path = '/';
        if (pageId === 'auth') path = '/login';
        else if (pageId === 'admin-dashboard') {
            path = tab && tab !== 'overview' ? `/admin/${tab}` : '/admin';
        } else if (pageId === 'customer-dashboard') {
            path = tab && tab !== 'overview' ? `/customer/${tab}` : '/customer';
        } else if (pageId === 'agent-dashboard') {
            path = tab && tab !== 'jobs' ? `/agent/${tab}` : '/agent';
        } else if (pageId === 'about') path = '/about';
        else if (pageId === 'products') path = '/products';
        else if (pageId === 'product-detail') path = `/product/${productId}`;
        else if (pageId === 'blog-detail') path = `/${blogSlug}`;
        else if (pageId === 'home') path = '/';
        
        if (window.location.pathname !== path) {
            window.history.pushState({ pageId, tab, productId, blogSlug }, '', path);
        }
        
        window.scrollTo(0, 0); // Scroll to top on page change
    };


    // --- Global Data (Centralized for the whole website) ---
    const navLinksData = ["Home", "About", "Calculator", "Products", "Blog"];
    const productLinksData = [
        { name: "HM Hard Water Scalenors", route: "product-hmws" },
        { name: "Water Softeners", route: "product-aws" },
        { name: "Solar Water Heaters", route: "product-swh" },
        { name: "RO Water Plant", route: "product-rowp" },
        { name: "Domestic RO Purifier", route: "product-drop" },
        { name: "Solar Power Systems", route: "product-sps" },
        { name: "Fenice Solar Energy", route: "product-fse" },
        { name: "Heat Pumps", route: "product-hp" },
    ];
    const projectImagesData = [
        { src: "https://i.postimg.cc/CZp2b16T/solar-water-heater.png", alt: "Solar Water Heater", title: "Solar Water Heaters" },
        { src: "https://i.postimg.cc/sQDwJZY8/scalenor.png", alt: "HM Hard Water Scalenors", title: "HM Hard Water Scalenors" },
        { src: "https://i.postimg.cc/BPjpr9wB/softener.png", alt: "Automatic Water Softners", title: "Automatic Water Softners" },
    ];

    // --- Render Logic based on currentPage ---
    const renderPage = () => {
        // Ensure authentication is ready before rendering pages that might depend on it
        if (!isAuthReady || authLoading) {
            return (
                <div className="flex justify-center items-center h-screen text-xl text-gray-700">
                    Loading application...
                </div>
            );
        }

        // Authentication guard and redirect logic
        if (['admin-dashboard', 'customer-dashboard', 'agent-dashboard'].includes(currentPage)) {
            if (!user) {
                setTimeout(() => handleNavigation('auth'), 0);
                return null;
            }
            if (currentPage === 'admin-dashboard' && user.role !== 'ADMIN') {
                setTimeout(() => handleNavigation(`${user.role.toLowerCase()}-dashboard`), 0);
                return null;
            }
            if (currentPage === 'customer-dashboard' && user.role !== 'CUSTOMER') {
                setTimeout(() => handleNavigation(`${user.role.toLowerCase()}-dashboard`), 0);
                return null;
            }
            if (currentPage === 'agent-dashboard' && user.role !== 'AGENT') {
                setTimeout(() => handleNavigation(`${user.role.toLowerCase()}-dashboard`), 0);
                return null;
            }
        }

        if (currentPage === 'auth' && user) {
            setTimeout(() => handleNavigation(`${user.role.toLowerCase()}-dashboard`), 0);
            return null;
        }


        switch (currentPage) {
            case 'home':
                return <HomePage blogs={blogs} handleNavigation={handleNavigation} />;
            case 'about':
                return <AboutPage />;
            case 'products':
                return <ProductsPage handleNavigation={handleNavigation} />;
            case 'scalenors page':
                return <ProductScalenorPage openContactModal={openContactModal} />;
            case 'product-detail':
                return <ProductDetail productId={currentProductId} handleNavigation={handleNavigation} openContactModal={openContactModal} />;
            case 'blog-detail':
                return <BlogDetail slug={currentBlogSlug} handleNavigation={handleNavigation} />;
            case 'auth':
                return <Auth handleNavigation={handleNavigation} />;
            case 'admin-dashboard':
                return <AdminDashboard initialTab={currentTab} handleNavigation={handleNavigation} />;
            case 'customer-dashboard':
                return <CustomerDashboard initialTab={currentTab} handleNavigation={handleNavigation} />;
            case 'agent-dashboard':
                return <AgentDashboard initialTab={currentTab} handleNavigation={handleNavigation} />;
            default:
                return <HomePage blogs={blogs} handleNavigation={handleNavigation} />; // Fallback to home page
        }
    };

    const isDashboard = ['auth', 'admin-dashboard', 'customer-dashboard', 'agent-dashboard'].includes(currentPage);

    return (
        <>
            {/* Global CSS Variables and Animations */}
            <style>{`
                :root { --brand-blue: #00529B; --brand-dark-blue: #002D5B; --brand-yellow: #FFC107; --brand-light-blue: #f0f5fa; }
                body { font-family: 'Inter', sans-serif; scroll-behavior: smooth; overflow-x: hidden; }
                .cursor-none { cursor: none; }
                .bg-brand-blue { background-color: var(--brand-blue); } .bg-brand-dark-blue { background-color: var(--brand-dark-blue); } .bg-brand-yellow { background-color: var(--brand-yellow); } .bg-brand-light-blue { background-color: var(--brand-light-blue); }
                .text-brand-blue { color: var(--brand-blue); } .text-brand-dark-blue { color: var(--brand-dark-blue); }
                .border-brand-blue { border-color: var(--brand-blue); } .border-brand-yellow { border-color: var(--brand-yellow); } .border-blue-700 { border-color: #00417A; }
                .hover\\:text-brand-yellow:hover { color: var(--brand-yellow); } .hover\\:text-brand-blue:hover { color: var(--brand-blue); }
                .hover\\:bg-brand-dark-blue:hover { background-color: var(--brand-dark-blue); } .hover\\:bg-brand-yellow:hover { background-color: var(--brand-yellow); } .hover\\:bg-brand-yellow\\/20:hover { background-color: rgba(255, 193, 7, 0.2); }
                .active\\:text-brand-yellow:active { color: var(--brand-yellow); }
                .focus\\:ring-brand-yellow:focus { --tw-ring-color: var(--brand-yellow); } .focus\\:border-brand-yellow:focus { border-color: var(--brand-yellow); } .focus\\:ring-brand-blue:focus { --tw-ring-color: var(--brand-blue); }
                .text-shadow-md { text-shadow: 0px 1px 3px rgb(0 0 0 / 60%); } .text-shadow-lg { text-shadow: 0px 2px 5px rgb(0 0 0 / 70%); }
                .hover\\:drop-shadow-lg:hover { filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.1)) drop_shadow(0 4px 3px rgb(0 0 0 / 0.1)); }
                .decorated-background { background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2300529B" fill-opacity="0.04"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E'); }
                .font-serif-body { font-family: 'Lora', serif; }
                .title-gradient-text { background: linear-gradient(to right, var(--brand-dark-blue), var(--brand-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-fill-color: transparent; }
                .gradient-text-underline { background: linear-gradient(to right, var(--brand-dark-blue), var(--brand-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; text-fill-color: transparent; position: relative; display: inline-block; }
                .gradient-text-underline::after { content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 3px; background-color: var(--brand-yellow); transform: scaleX(0); transform-origin: left; transition: transform 0.7s cubic-bezier(0.25, 1, 0.5, 1); }
                .is-visible .gradient-text-underline::after { transform: scaleX(1); }
                @keyframes ticker-scroll { from { transform: translateX(100%); } to { transform: translateX(-100%); } } .ticker-text { animation: ticker-scroll 20s linear infinite; }
                @keyframes infinite-scroll { from { transform: translateX(0); } to { transform: translateX(-100%); } } .animate-infinite-scroll { animation: infinite-scroll 60s linear infinite; }
                @keyframes ripple-effect { 0% { transform: translate(-50%, -50%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(10); opacity: 0; } }
                @keyframes water-drop-effect { 0% { transform: translate(-50%, -50%) translateY(-30px) scale(0.7) rotate(45deg); border-radius: 50%; opacity: 0.7; } 20% { transform: translate(-50%, -50%) translateY(0) scale(1.7) rotate(45deg); border-radius: 0 50% 50% 50%; opacity: 1; } 50%, 75% { transform: translate(-50%, -50%) translateY(0) scale(1.5) rotate(45deg); border-radius: 0 50% 50% 50%; } 100% { transform: translate(-50%, -50%) translateY(0) scale(1) rotate(45deg); border-radius: 50%; opacity: 0; } }
                .cursor-follower { width: 12px; height: 12px; background-color: #38bdf8; border-radius: 50%; position: fixed; pointer-events: none; z-index: 10000; transition: transform 0.1s ease-out, opacity 0.1s ease-out; }
                .water-drop { width: 12px; height: 12px; background-color: #38bdf8; border-radius: 50%; position: fixed; pointer-events: none; z-index: 9999; transform-origin: center center; animation: water-drop-effect 2s ease-out forwards; }
                .ripple { width: 20px; height: 20px; border: 2px solid #38bdf8; border-radius: 50%; position: fixed; pointer-events: none; z-index: 9998; opacity: 0; transform-origin: center center; animation: ripple-effect 0.75s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 45, 91, 0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--brand-blue); border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--brand-dark-blue); }
                .parallax-bg {
                    background-attachment: fixed;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: cover;
                }
                @keyframes animate-scale-in {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
            
            {isDashboard ? (
                <div className="bg-[#0a0a0f] min-h-screen w-full overflow-x-hidden">
                    {renderPage()}
                </div>
            ) : (
                <div className="bg-white cursor-none">
                    <CustomCursor />
                    <Header navLinks={navLinksData} productLinks={productLinksData} projectImages={projectImagesData} openContactModal={openContactModal} handleNavigation={handleNavigation} />

                    <main className="pt-24"> {/* Added pt-24 to account for fixed header */}
                        {renderPage()}
                    </main>

                    <Footer navLinks={navLinksData} handleNavigation={handleNavigation} />
                    <FloatingActionButtons openContactModal={openContactModal} openChatbotModal={openChatbotModal} />
                    <ContactModal isOpen={isContactModalOpen} onClose={closeContactModal} />
                    <ChatbotModal isOpen={isChatbotModalOpen} onClose={closeChatbotModal} />
                    <TimedWelcomeModal isOpen={isTimedWelcomeModalOpen} onClose={closeTimedWelcomeModal} />
                </div>
            )}
        </>
    );
}

