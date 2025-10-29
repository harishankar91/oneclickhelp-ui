import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaWhatsapp,
} from 'react-icons/fa';

import styles from './styles/footer.module.scss';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          
          {/* Copyright */}
          <p className="text-sm text-gray-400 order-2 md:order-1">
            © {new Date().getFullYear()} Oneclickhelp. All rights reserved.
          </p>
  
          {/* Social Media - Centered on mobile */}
          <div className="flex gap-5 order-1 md:order-2">
            <a href="https://www.facebook.com/people/Oneclickhelp/61580422095287/" aria-label="Facebook" className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
              <FaFacebookF size={16} />
            </a>
            <a href="https://wa.me/917015683482" aria-label="Whatsapp" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
              <FaWhatsapp size={16} />
            </a>

            <a href="https://www.linkedin.com/company/oneclickhelp" aria-label="Linkedin" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
              <FaLinkedinIn size={16} />
            </a>
            
          </div>
        </div>
        
        {/* Navigation Links - now in a compact grid */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-4 text-sm border-t border-gray-800 pt-6">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">Privacy Policy</Link>
            <Link href="/refund-policy" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">Refund Policy</Link>
            <Link href="/terms-of-use" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">Terms Of Use</Link>
            <Link href="/about-us" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">About Us</Link>
            <Link href="/faqs" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">FAQs</Link>
            <Link href="/contact-us" className="text-gray-400 hover:text-white transition-colors duration-200 text-center md:text-left">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}