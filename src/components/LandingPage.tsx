
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Lock, Key, Database, Zap, Eye, Users, Globe } from 'lucide-react';

interface LandingPageProps {
  onShowAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onShowAuth }) => {
  const features = [
    {
      icon: Shield,
      title: "AI-Powered Security",
      description: "Advanced AI algorithms analyze and generate ultra-secure passwords tailored to your needs."
    },
    {
      icon: Lock,
      title: "Military-Grade Encryption",
      description: "Your passwords are protected with AES-256 encryption, ensuring maximum security."
    },
    {
      icon: Key,
      title: "Smart Password Generation",
      description: "Generate complex, unique passwords that meet the highest security standards."
    },
    {
      icon: Database,
      title: "Secure Vault",
      description: "Store passwords, API keys, and certificates in encrypted vaults with master password protection."
    },
    {
      icon: Zap,
      title: "Instant Analysis",
      description: "Real-time password strength analysis and breach detection to keep you safe."
    },
    {
      icon: Eye,
      title: "Privacy First",
      description: "Your data never leaves our secure infrastructure. Complete privacy guaranteed."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Guarantee" },
    { number: "256-bit", label: "AES Encryption" },
    { number: "10K+", label: "Users Protected" },
    { number: "0", label: "Data Breaches" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 animate-pulse" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <Shield className="w-20 h-20 text-green-400 animate-glass-glow" />
            </div>
            
            <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-white via-green-400 to-white bg-clip-text text-transparent">
              AI PW Shield
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              The next-generation password security platform powered by artificial intelligence. 
              Generate, analyze, and store your passwords with military-grade encryption and AI-driven insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={onShowAuth}
                size="lg"
                className="glass-button bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
              >
                <Shield className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              
              <Button
                onClick={onShowAuth}
                variant="outline"
                size="lg"
                className="glass-button bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-card text-center p-6 bg-white/5 backdrop-blur-xl border-white/20">
                <div className="text-3xl font-bold text-green-400 mb-2">{stat.number}</div>
                <div className="text-gray-300 text-sm">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why Choose AI PW Shield?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Advanced security features designed to protect your digital life with cutting-edge AI technology.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="glass-card p-8 bg-white/5 backdrop-blur-xl border-white/20 hover:bg-white/10 transition-all duration-300">
              <feature.icon className="w-12 h-12 text-green-400 mb-6" />
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-300 leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Security Showcase Section */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Enterprise-Grade Security
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Built with the same security standards used by Fortune 500 companies. 
                Your passwords are encrypted locally before they ever leave your device.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-green-400 mr-3" />
                  <span className="text-white">End-to-end encryption</span>
                </div>
                <div className="flex items-center">
                  <Lock className="w-6 h-6 text-green-400 mr-3" />
                  <span className="text-white">Zero-knowledge architecture</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-6 h-6 text-green-400 mr-3" />
                  <span className="text-white">Multi-factor authentication</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <Card className="glass-card p-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-400/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Password Strength</span>
                    <span className="text-green-400 font-semibold">Very Strong</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full w-full"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Encryption Status</span>
                    <span className="text-green-400 flex items-center">
                      <Lock className="w-4 h-4 mr-1" />
                      AES-256 Encrypted
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Secure Your Digital Life?
        </h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust AI PW Shield to protect their most important accounts. 
          Get started today with our free plan.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onShowAuth}
            size="lg"
            className="glass-button bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-semibold"
          >
            <Shield className="w-5 h-5 mr-2" />
            Start Free Trial
          </Button>
          
          <Button
            onClick={onShowAuth}
            variant="outline"
            size="lg"
            className="glass-button bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg"
          >
            Learn More
          </Button>
        </div>
        
        <p className="text-gray-500 text-sm mt-6">
          No credit card required • Free forever plan available • Enterprise plans starting at $10/month
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
