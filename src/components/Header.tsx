import React from 'react';
import { Bus, MapPin, FileCheck2, ShieldCheck, Lock, Ticket, UserCheck } from 'lucide-react';

interface HeaderProps {
  totalRoutesCount: number;
  onOpenAdmin?: () => void;
  onOpenBoardingRequest?: () => void;
  onOpenConductor?: () => void;
  isCloudConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalRoutesCount,
  onOpenAdmin,
  onOpenBoardingRequest,
  onOpenConductor,
  isCloudConnected = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E2DC] shadow-[0_1px_3px_rgba(15,30,54,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0F1E36] flex items-center justify-center text-amber-400 shadow-sm ring-1 ring-amber-500/20">
              <Bus className="w-5 h-5 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F1E36] font-sans">
                  College<span className="text-amber-600">Nav</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#FAF9F5] text-[#0F1E36] border border-[#E5E2DC] font-mono">
                  CVRCE
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <span>CVR College of Engineering</span>
                <span className="text-slate-300">•</span>
                <span className="hidden sm:inline">Official Bus Route Navigation</span>
              </p>
            </div>
          </div>

          {/* Center Campus Transit Info (Desktop) */}
          <div className="hidden xl:flex items-center gap-5 px-4 py-1.5 rounded-full bg-[#FAF9F5] border border-[#E5E2DC] text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="font-semibold text-[#0F1E36]">{totalRoutesCount} Scheduled Routes</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isCloudConnected ? 'Cloud Synced' : 'Official Circular Dataset'}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Mangalpally Campus</span>
            </div>
          </div>

          {/* Right Action & Status Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Official Data</span>
            </div>

            {onOpenBoardingRequest && (
              <button
                type="button"
                onClick={onOpenBoardingRequest}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#0F1E36] text-xs font-bold transition-colors shadow-2xs border border-amber-600/30"
                title="Request seat on alternative bus if you missed your scheduled bus"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Missed Bus?</span>
              </button>
            )}

            {onOpenConductor && (
              <button
                type="button"
                onClick={onOpenConductor}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#FAF9F5] hover:bg-[#F2EFE9] text-[#0F1E36] border border-[#DCD8D0] text-xs font-bold transition-colors shadow-2xs"
                title="Open Driver / Conductor Console"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">Conductor</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0F1E36] hover:bg-[#1A2F50] text-amber-400 text-xs font-bold transition-colors shadow-2xs border border-[#0F1E36]"
                title="Open Transport Administration Console"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

