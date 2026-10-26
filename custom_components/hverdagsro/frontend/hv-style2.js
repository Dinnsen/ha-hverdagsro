/* Hverdagsro – styles for the panel frame (things the prototype didn't have). */
export default `
[hidden] { display: none !important; }
:host { display: block; height: 100%; height: 100dvh; overflow: hidden auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; background: var(--bg); }
/* The sky runs up under the phone's status bar, like Home Assistant's own toolbars. */
.hero { box-sizing: content-box; padding-top: env(safe-area-inset-top, 0px); }
.hv-app { min-height: 100%; background: var(--bg); color: var(--ink); }
.hv-loading { display: grid; place-items: center; gap: 12px; padding: 80px 16px; color: var(--muted); font-weight: 600; }
.hv-loading .ic { width: 40px; height: 40px; color: var(--violet); animation: hvpulse 1.4s ease-in-out infinite; }
@keyframes hvpulse { 0%,100% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.12); opacity: 1 } }
.hv-empty { text-align: center; padding: 36px 20px; display: grid; justify-items: center; gap: 8px; }
.hv-empty .ic.big { width: 44px; height: 44px; color: var(--violet); }
.hv-empty h2 { margin: 0; }
.menu-btn { width: 40px; height: 40px; display: grid; place-items: center; padding: 0; }
.menu-btn[hidden] { display: none; }
@media (max-width: 480px) { .hero.compact .mini-title { font-size: 17px; } .hero-top { gap: 6px; } }
.mini-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.av.sm { width: 28px; height: 28px; font-size: 12px; }
.av img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.view.view-in { animation: hvin .35s cubic-bezier(.2,.9,.3,1) both; }
@keyframes hvin { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
.tabs[hidden] { display: none; }
.hv-who { max-width: 640px; margin: 24px auto; text-align: center; }
.hv-who .who-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 18px; }
.hv-who .who-grid button { border: 0; background: var(--surface); box-shadow: var(--shadow); border-radius: 22px; padding: 22px 12px; display: grid; justify-items: center; gap: 10px; color: var(--ink); font: 800 17px var(--font-display); cursor: pointer; transition: transform .2s; }
.hv-who .who-grid button:hover { transform: translateY(-3px); }
.hv-who .who-grid .av { width: 64px; height: 64px; font-size: 26px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
`;
