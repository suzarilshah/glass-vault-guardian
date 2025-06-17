
import React from 'react';
import { Shield, Github, Heart, Lock, Key, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-16 py-8 border-t border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-semibold text-white">AI PW Shield</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Your trusted companion for generating secure passwords and managing your digital vault with military-grade encryption and AI-powered security analysis.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Security Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• AI-Powered Password Generator</li>
              <li>• Advanced Keyword Obfuscation</li>
              <li>• Real-time Password Strength Analysis</li>
              <li>• Encrypted Secure Vault Storage</li>
              <li>• Comprehensive API Key Management</li>
              <li>• SSL Certificate Storage & Monitoring</li>
              <li>• Automated Breach Detection</li>
              <li>• Secure Import/Export Tools</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Quick Access</h4>
            <nav>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Password Generator
                  </Link>
                </li>
                <li>
                  <Link to="/vault" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Password Vault
                  </Link>
                </li>
                <li>
                  <Link to="/api-vault" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    API Vault
                  </Link>
                </li>
                <li>
                  <Link to="/export" className="text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2">
                    <Download className="w-3 h-3" />
                    Export Data
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="text-white font-medium">Security & Privacy</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• End-to-end AES-256 encryption</li>
              <li>• Zero-knowledge architecture</li>
              <li>• Local password generation</li>
              <li>• Privacy-first design</li>
              <li>• No tracking or analytics</li>
              <li>• Open source security model</li>
              <li>• Secure import/export capabilities</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400" />
            <span>for enhanced digital security</span>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors text-sm"
              aria-label="View AI PW Shield source code on GitHub"
            >
              <Github className="w-4 h-4" />
              <span>Open Source</span>
            </a>
            <span className="text-gray-500 text-sm">
              © 2025 AI PW Shield - All rights reserved
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
