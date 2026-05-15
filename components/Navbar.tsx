"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  Video,
  FileText,
  Award,
  MessageCircle,
  LogOut,
  User,
  Menu,
  X,
  Trophy,
  Globe,
} from "lucide-react";
import { useState, useEffect } from "react";
import { dbService, Language } from "@/lib/database";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const { user, userData, logout, signInWithGoogle, updateUserData } =
    useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const langs = await dbService.getLanguages({ isActive: true });
      setLanguages(langs);
    } catch {}
  };

  const currentLang =
    languages.find((l) => l.code === userData?.preferredLanguage) ||
    languages.find((l) => l.code === "en");

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap size={22} />
            </div>
            <span className="text-xl font-bold text-gray-900">IJWI-LEARN</span>
          </Link>

          {user && userData && (
            <div className="hidden md:flex items-center gap-2">
              <NavLink
                href="/"
                icon={<GraduationCap size={18} />}
                active={isActive("/")}
              >
                Levels
              </NavLink>
              <NavLink
                href="/videos"
                icon={<Video size={18} />}
                active={isActive("/videos")}
              >
                Videos
              </NavLink>
              <NavLink
                href="/tests"
                icon={<FileText size={18} />}
                active={isActive("/tests")}
              >
                Tests
              </NavLink>
              <NavLink
                href="/certificates"
                icon={<Award size={18} />}
                active={isActive("/certificates")}
              >
                Certificates
              </NavLink>
              <NavLink
                href="/leaderboard"
                icon={<Trophy size={18} />}
                active={isActive("/leaderboard")}
              >
                Leaderboard
              </NavLink>
            </div>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>

                <Link
                  href="/chat"
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium shadow-sm"
                >
                  <MessageCircle size={16} />
                  <span>Chat</span>
                </Link>

                <div className="relative group">
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-9 h-9 rounded-full ring-2 ring-primary-200"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white shadow-md">
                        <User size={18} />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900 truncate">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {user.email}
                      </div>
                      <div className="mt-2 flex gap-3 text-xs">
                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                          {userData?.totalPoints || 0} pts
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {userData?.consecutivePasses || 0} streak
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100">
                      {(userData?.isAdmin || userData?.isTeacher) && (
                        <Link
                          href="/admin"
                          className="w-full p-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                        >
                          <User size={16} />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        className="w-full p-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                      >
                        <User size={16} />
                        My Profile
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setShowLangMenu(!showLangMenu)}
                          className="w-full p-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                        >
                          <Globe size={16} />
                          <span>
                            {currentLang
                              ? `${currentLang.flag} ${currentLang.name}`
                              : "Language"}
                          </span>
                        </button>
                        {showLangMenu && (
                          <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg mb-1 overflow-hidden">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  updateUserData({
                                    preferredLanguage: lang.code,
                                  });
                                  setShowLangMenu(false);
                                }}
                                className={`w-full p-3 text-left flex items-center gap-3 text-sm hover:bg-gray-50 transition-colors ${
                                  userData?.preferredLanguage === lang.code
                                    ? "bg-primary-50 text-primary-700 font-medium"
                                    : "text-gray-700"
                                }`}
                              >
                                <span className="text-base">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {userData?.preferredLanguage === lang.code && (
                                  <span className="ml-auto text-primary-600 text-xs">
                                    Active
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => logout()}
                      className="w-full p-3 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 text-sm font-medium"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition font-semibold text-sm shadow-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {mobileMenuOpen && user && (
          <div className="md:hidden py-4 border-t border-gray-100 divide-y divide-gray-100">
            <div className="pb-3">
              <MobileNavLink
                href="/"
                icon={<GraduationCap size={18} />}
                active={isActive("/")}
              >
                Levels
              </MobileNavLink>
              <MobileNavLink
                href="/videos"
                icon={<Video size={18} />}
                active={isActive("/videos")}
              >
                Videos
              </MobileNavLink>
              <MobileNavLink
                href="/tests"
                icon={<FileText size={18} />}
                active={isActive("/tests")}
              >
                Tests
              </MobileNavLink>
              <MobileNavLink
                href="/certificates"
                icon={<Award size={18} />}
                active={isActive("/certificates")}
              >
                Certificates
              </MobileNavLink>
              <MobileNavLink
                href="/leaderboard"
                icon={<Trophy size={18} />}
                active={isActive("/leaderboard")}
              >
                Leaderboard
              </MobileNavLink>
              <MobileNavLink
                href="/chat"
                icon={<MessageCircle size={18} />}
                active={isActive("/chat")}
              >
                Chat
              </MobileNavLink>
            </div>
            <div className="pt-3 px-2">
              <div className="md:hidden">
                <GlobalSearch />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-primary-100 text-primary-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-primary-100 text-primary-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
