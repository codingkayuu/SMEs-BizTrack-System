import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-gradient-to-r from-emerald-50/80 via-white/80 to-slate-50/80 backdrop-blur-xl border-b border-emerald-100 supports-[backdrop-filter]:bg-emerald-50/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black italic text-emerald-900 tracking-tighter">
                                Trackify
                            </span>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link to="/login" className="hidden sm:block text-emerald-700 hover:text-emerald-900 font-medium transition-colors">
                                Sign In
                            </Link>
                            <Link to="/signup" className="inline-flex items-center px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300 border border-emerald-500">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-20 pb-20 lg:pt-24 lg:pb-32 overflow-hidden min-h-screen">
                {/* Studio Environment Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-slate-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/5 via-transparent to-emerald-800/10" />

                {/* Horizon Line */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-emerald-50 to-transparent" />

                {/* Subtle Gradient Curve */}
                <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-[200px] transform -translate-x-1/2 -translate-y-1/2" />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        {/* Hero Content */}
                        <div className="max-w-4xl">
                            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1] animate-fade-in-up stagger-1">
                                <span className="font-serif">Master</span> your <br />
                                <span className="relative inline-block">
                                    <span className="text-emerald-900">money flow.</span>
                                    <svg className="absolute -bottom-2 left-0 w-full h-8" viewBox="0 0 200 40" preserveAspectRatio="none">
                                        <path d="M 10 30 Q 50 10, 100 20 T 190 15" stroke="#059669" strokeWidth="3" fill="none" strokeLinecap="round" />
                                    </svg>
                                </span>
                            </h1>
                            <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up stagger-2">
                                The all-in-one financial operating system for Zambian SMEs. Invoicing, expenses, and insights—simplified.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up stagger-3">
                                <Link to="/signup" className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white bg-emerald-600 border-b-4 border-emerald-800 shadow-lg hover:bg-emerald-700 hover:border-emerald-900 hover:shadow-xl transition-all duration-200 transform active:translate-y-1 active:border-b-2">
                                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                                </Link>
                                <Link to="/login" className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-emerald-900 bg-white border-2 border-slate-200 border-b-4 border-slate-300 shadow-md hover:bg-slate-50 hover:border-emerald-200 hover:border-b-emerald-300 hover:text-emerald-800 transition-all duration-200 transform active:translate-y-1 active:border-b-2">
                                    View Demo
                                </Link>
                            </div>

                            <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 animate-fade-in-up stagger-4">
                                <div className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                    <span className="text-sm font-medium text-slate-500">No credit card</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-emerald-600" />
                                    <span className="text-sm font-medium text-slate-500">14-day free trial</span>
                                </div>
                            </div>

                            {/* Avatar Strip */}
                            <div className="mt-8 flex items-center justify-center animate-fade-in-up stagger-5">
                                <div className="flex items-center -space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-3 border-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                                        JD
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-3 border-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                                        MK
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-3 border-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                                        SC
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-3 border-white shadow-md flex items-center justify-center text-white text-sm font-bold">
                                        PN
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 border-3 border-white shadow-md flex items-center justify-center text-emerald-600 text-sm font-bold">
                                        +2k
                                    </div>
                                </div>
                                <span className="ml-4 text-sm text-gray-600 font-medium">Zambian entrepreneurs trust Trackify</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl font-black italic text-emerald-900 tracking-tighter">Trackify</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Empowering Zambian SMEs with simple, powerful financial tools.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Security</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-slate-400 text-sm">
                            &copy; {new Date().getFullYear()} Trackify Zambia. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            {/* Social Icons Placeholder */}
                            <div className="h-5 w-5 bg-slate-200 rounded-full hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                            <div className="h-5 w-5 bg-slate-200 rounded-full hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                            <div className="h-5 w-5 bg-slate-200 rounded-full hover:bg-emerald-600 transition-colors cursor-pointer"></div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
