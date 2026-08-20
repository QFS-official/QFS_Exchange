"use client";

export function Footer() {
  function goTerms() { window.dispatchEvent(new CustomEvent('gcrm-navigate', { detail: 'terms' })); }

  return (
    <footer className="bg-[#080a0e] border-t border-[#1e2128] mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <img
              src="https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881"
              alt="GCRM Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-gray-600 text-sm">© 2026 GCRM Exchange. All rights reserved.</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-500">
            <button onClick={goTerms} className="hover:text-white transition">Terms</button>
            <button onClick={goTerms} className="hover:text-white transition">Privacy</button>
            <button onClick={goTerms} className="hover:text-white transition">KYC/AML Policy</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('gcrm-navigate', { detail: 'soporte' }))} className="hover:text-white transition">Support</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
