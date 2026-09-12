"use client";

// A hand-built vector illustration of Dr. Hen (chicken vet: white coat,
// stethoscope, comb, waving wing) — stands in for a commissioned 3D render,
// which would need an image-generation tool this environment doesn't have.
// Chibi/big-head proportions read as friendlier and clearer at small sizes
// than a realistic build. Animated wave + a subtle idle bob for life.

export function DrHenMascot({ className }: { className?: string }) {
  return (
    <div className={className}>
      <style>{`
        @keyframes dr-hen-wave {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(28deg); }
        }
        @keyframes dr-hen-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .dr-hen-wing-wave {
          transform-box: fill-box;
          transform-origin: 15% 85%;
          animation: dr-hen-wave 1.6s ease-in-out infinite;
        }
        .dr-hen-body {
          transform-box: fill-box;
          transform-origin: 50% 100%;
          animation: dr-hen-bob 3.2s ease-in-out infinite;
        }
      `}</style>
      <svg viewBox="0 0 300 360" className="h-full w-full" role="img" aria-label="Dr. Hen, the AI poultry doctor mascot">
        <ellipse cx="150" cy="345" rx="70" ry="10" fill="#000" opacity="0.08" />

        <g className="dr-hen-body">
          {/* legs */}
          <rect x="128" y="312" width="11" height="28" rx="5.5" fill="#e8871e" />
          <rect x="161" y="312" width="11" height="28" rx="5.5" fill="#e8871e" />
          <path d="M122,340 l11,-4 l9,4 l-2,5 l-16,2 Z" fill="#e8871e" />
          <path d="M158,340 l11,-4 l9,4 l-2,5 l-16,2 Z" fill="#e8871e" />

          {/* resting wing (viewer's right side) */}
          <ellipse cx="222" cy="272" rx="18" ry="30" fill="#f5a531" transform="rotate(18 222 272)" />

          {/* coat body */}
          <path
            d="M104,230 Q100,232 98,264 Q96,300 118,316 Q150,328 182,316 Q204,300 202,264 Q200,232 196,230 Q150,252 104,230 Z"
            fill="#ffffff"
            stroke="#e4e4e0"
            strokeWidth="2"
          />
          {/* lapels */}
          <path d="M150,236 L133,254 L148,260 Z" fill="#f2f2ee" />
          <path d="M150,236 L167,254 L152,260 Z" fill="#f2f2ee" />
          {/* pocket badge */}
          <rect x="128" y="288" width="24" height="18" rx="3" fill="#fbfbf9" stroke="#e4e4e0" strokeWidth="1.5" />
          <path d="M140,292 v10 M135,297 h10" stroke="#e0392b" strokeWidth="2.5" strokeLinecap="round" />

          {/* stethoscope: tube around collar down to chest disc */}
          <path
            d="M120,238 Q118,258 138,266 M180,238 Q182,258 162,266"
            fill="none"
            stroke="#8b93a1"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="150" cy="274" r="10" fill="#aab2bd" stroke="#8b93a1" strokeWidth="2" />

          {/* waving wing (viewer's left side, in front) */}
          <g className="dr-hen-wing-wave">
            <ellipse cx="80" cy="255" rx="19" ry="31" fill="#f7ab3e" />
          </g>

          {/* head */}
          <circle cx="150" cy="148" r="92" fill="#f7ab3e" />

          {/* comb */}
          <path
            d="M104,82 Q108,42 128,68 Q136,30 150,64 Q164,30 172,68 Q192,42 196,82 Q176,66 150,68 Q124,66 104,82 Z"
            fill="#e0392b"
          />

          {/* ears/cheek blush */}
          <circle cx="98" cy="178" r="15" fill="#f9c9b0" opacity="0.85" />
          <circle cx="202" cy="178" r="15" fill="#f9c9b0" opacity="0.85" />

          {/* eyes */}
          <circle cx="116" cy="146" r="19" fill="#ffffff" />
          <circle cx="184" cy="146" r="19" fill="#ffffff" />
          <circle cx="120" cy="150" r="9.5" fill="#2a2118" />
          <circle cx="188" cy="150" r="9.5" fill="#2a2118" />
          <circle cx="116" cy="146" r="3.2" fill="#ffffff" />
          <circle cx="184" cy="146" r="3.2" fill="#ffffff" />

          {/* beak */}
          <path d="M133,182 Q150,174 167,182 Q150,180 133,182 Z" fill="#d5321f" />
          <path d="M133,182 Q150,206 167,182 Q150,198 133,182 Z" fill="#f7941d" />

          {/* wattle */}
          <path d="M138,200 Q150,222 162,200 Q150,214 138,200 Z" fill="#d5321f" />
        </g>
      </svg>
    </div>
  );
}
