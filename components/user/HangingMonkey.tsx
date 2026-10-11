"use client";
import { MonkeyHead } from "./MonkeyHead";

export function HangingMonkey({ scared = false, motion = "idle" }: { scared?: boolean; motion?: "idle" | "fall" | "climb" }) {
  return <span aria-hidden="true" className={`hanging-monkey ${motion === "fall" ? "monkey-fall" : motion === "climb" ? "monkey-climb" : ""} ${scared ? "monkey-scared" : ""}`}>
    <svg viewBox="0 0 100 166" className="h-full w-full overflow-visible" role="presentation">
      <path className="monkey-tail" d="M67 111C105 103 96 141 76 134C62 130 76 116 85 125" fill="none" stroke="#754632" strokeWidth="11" strokeLinecap="round"/>
      <path d="M35 100Q50 85 68 105L74 135Q51 156 28 134Z" fill="#754632" stroke="#34201b" strokeWidth="3"/>
      <ellipse cx="50" cy="122" rx="17" ry="21" fill="#e9ac83"/>
      <text x="50" y="128" textAnchor="middle" fontSize="19" fontWeight="900" fill="#642d20" stroke="#fff4e8" strokeWidth="1.3" paintOrder="stroke" letterSpacing="1">AI</text>
      <g className="monkey-legs" stroke="#754632" strokeWidth="13" fill="none" strokeLinecap="round">
        <path d="M36 137L27 154L15 151"/>
        <path d="M64 137L75 154L87 147"/>
      </g>
      <g stroke="#34201b" strokeWidth="2.5" strokeLinejoin="round">
        <ellipse cx="15" cy="151" rx="10" ry="6" fill="#a56b4e"/>
        <ellipse cx="86" cy="148" rx="10" ry="6" fill="#a56b4e"/>
      </g>
      <g className="monkey-arms" stroke="#754632" strokeWidth="12" strokeLinecap="round" fill="none">
        <path d="M35 103Q20 89 14 73"/>
        <path d="M67 103Q85 85 88 60"/>
      </g>
      <g stroke="#34201b" strokeWidth="2.5" fill="#b78364">
        <ellipse cx="14" cy="70" rx="8" ry="9"/>
        <ellipse cx="88" cy="57" rx="8" ry="9"/>
      </g>
    </svg>
    <span className="monkey-face"><MonkeyHead />{scared && <span className="monkey-panic">!</span>}</span>
    <style jsx>{`
      .hanging-monkey{position:relative;display:block;width:78px;height:126px;transform-origin:50% 6%}
      .monkey-face{position:absolute;top:0;left:12px;transform:scale(1.16);transform-origin:top center}
      .monkey-panic{position:absolute;right:-8px;top:2px;color:#e33;font-weight:900;font-size:23px;text-shadow:0 1px white}
      .monkey-arms{transform-origin:50% 58%;animation:sway-arms 2.8s ease-in-out infinite alternate}
      .monkey-tail{transform-origin:70% 70%;animation:tail-wag 2s ease-in-out infinite alternate}
      .monkey-scared .monkey-arms,.monkey-scared .monkey-legs{animation:panic .17s ease-in-out infinite alternate}
      .monkey-fall{animation:fall .65s cubic-bezier(.35,0,.8,1) forwards}
      .monkey-climb{animation:climb 1.25s ease-in-out both}
      @keyframes fall{0%{transform:translateY(0) rotate(0)}30%{transform:rotate(-32deg) translateY(7px)}100%{transform:translateY(min(37vh,260px)) rotate(65deg)}}
      @keyframes climb{0%{transform:translateY(min(37vh,260px)) rotate(65deg)}30%{transform:translateY(130px) rotate(-18deg)}58%{transform:translateY(75px) rotate(13deg)}80%{transform:translateY(24px) rotate(-10deg)}100%{transform:translateY(0) rotate(0)}}
      @keyframes panic{to{transform:rotate(18deg)}}@keyframes sway-arms{to{transform:rotate(8deg)}}
      @keyframes tail-wag{to{transform:rotate(12deg)}}
      @media(prefers-reduced-motion:reduce){.hanging-monkey,.monkey-arms,.monkey-tail,.monkey-legs{animation:none!important}}
    `}</style>
  </span>;
}
