import { Users, Sparkles, Heart } from "lucide-react";
import { Link } from 'react-router-dom';
import logo from "../../assets/logo.svg";


function LandingPage() {

    return (
        <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-white">
            {/* Animated Blur Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-90 animate-blob"></div>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-80 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-20 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-90 animate-blob animation-delay-4000"></div>
                <div className="absolute -bottom-10 -right-20 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-90 animate-blob animation-delay-4000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-3000"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="w-full px-6 py-6 md:px-8 lg:px-12">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="Gathearly Logo" className="w-10 h-10 rounded-lg" />
                            <span className="text-3xl leading-normal font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                                Gatherly
                            </span>
                        </div>

                        {/* Desktop Login Button */}
                        <div className="hidden md:block">
                            <button
                                className="px-4 py-2 font-semibold text-gray-700 hover:text-purple-600 transition"
                            >
                                <Link to="/login">
                                    Log In
                                </Link>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-purple-200">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">
                                Connect with people who matter
                            </span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Where People
                                <br />
                                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                                    Come Together
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                                Join Gatherly to connect with friends, share moments, and build meaningful relationships in a vibrant social community.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <button
                                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-6 text-base font-bold rounded-xl"
                            >
                                <Link to="/signup">
                                    Create Account
                                </Link>
                            </button>

                            <button
                                className="w-full sm:w-auto border-2 border-gray-300 hover:border-purple-600 hover:bg-purple-50 text-gray-700 hover:text-purple-700 px-8 py-6 text-base font-bold rounded-xl transition-all duration-300 md:hidden"
                            >
                                <Link to="/login">
                                    Log In
                                </Link>
                            </button>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
                            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-purple-100 hover:bg-white/80 hover:shadow-xl transition-all duration-300">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
                                <p className="text-sm text-gray-600">
                                    Stay connected with friends
                                </p>
                            </div>

                            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-pink-100 hover:bg-white/80 hover:shadow-xl transition-all duration-300">
                                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <Heart className="w-6 h-6 text-pink-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Share</h3>
                                <p className="text-sm text-gray-600">
                                    Express yourself and share your moments
                                </p>
                            </div>

                            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-blue-100 hover:bg-white/80 hover:shadow-xl transition-all duration-300">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                    <Sparkles className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Discover</h3>
                                <p className="text-sm text-gray-600">
                                    Explore trending topics and find your people
                                </p>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="w-full px-4 py-6 text-center text-sm text-gray-500">
                    <p>© 2025 Gatherly. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
}

export default LandingPage;
