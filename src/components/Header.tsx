import React from 'react';
import { Bus, Ticket, UserCheck, Lock } from 'lucide-react';

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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E2DC] shadow-[0_1px_4px_rgba(15,30,54,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#0F1E36] to-[#1A2F50] flex items-center justify-center text-amber-400 shadow-sm ring-1 ring-amber-500/20">
              <Bus className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0F1E36]">
                  College<span className="text-amber-600">Nav</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                  CVRCE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                <span>CVR College of Engineering</span>
                <span className="text-slate-300">•</span>
                <span className="hidden sm:inline">Official Transit Navigation</span>
              </p>
            </div>
          </div>

          {/* Center Campus Transit Info (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#FAF9F5] border border-[#E5E2DC] text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-600'}`}></span>
              <span className="font-bold text-[#0F1E36]">{totalRoutesCount} Official Corridors</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">Mangalpally Campus</span>
          </div>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-2">
            
            {/* Missed Bus Boarding Request Button */}
            {onOpenBoardingRequest && (
              <button
                type="button"
                onClick={onOpenBoardingRequest}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0F1E36] text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 border border-amber-600/30"
                title="Request seat on alternative bus if you missed your scheduled bus"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Missed Bus?</span>
              </button>
            )}

            {/* Conductor Console Button */}
            {onOpenConductor && (
              <button
                type="button"
                onClick={onOpenConductor}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FAF9F5] text-slate-700 hover:text-[#0F1E36] border border-[#DCD8D0] text-xs font-bold transition-all shadow-2xs active:scale-95"
                title="Open Driver / Conductor Console"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Conductor</span>
              </button>
            )}

            {/* Admin Portal Button */}
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0F1E36] hover:bg-[#1A2F50] text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm active:scale-95 border border-[#0F1E36]"
                title="Open Transport Administration Console"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin Portal</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
