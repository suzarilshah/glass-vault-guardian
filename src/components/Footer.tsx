
import React from 'react';
import { Shield, Github, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-16 py-8 border-t border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Password Security Suite</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Your trusted companion for generating secure passwords and managing your digital vault with military-grade encryption.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Advanced Password Generator</li>
              <li>• Keyword Obfuscation</li>
              <li>• Password Strength Analysis</li>
              <li>• Secure Vault Storage</li>
              <li>• Breach Detection</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Security & Privacy</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• End-to-end encryption</li>
              <li>• Zero-knowledge architecture</li>
              <li>• Local password generation</li>
              <li>• No tracking or analytics</li>
              <li>• Open source security</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>for digital security</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors text-sm"
            >
              <Github className="w-4 h-4" />
              <span>Open Source</span>
            </a>
            <span className="text-gray-500 text-sm">
              © 2025 PWShield - developed by Suzaril Shah
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
