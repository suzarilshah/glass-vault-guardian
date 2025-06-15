
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { calculateCrackTime } from '@/utils/passwordUtils';
import { calculatePasswordScore } from '@/utils/passwordScoring';
import { checkPasswordBreach } from '@/utils/breachChecker';
import { useAuth } from '@/contexts/AuthContext';
import KeywordObfuscator from './KeywordObfuscator';
import PasswordAnalyzer from './PasswordAnalyzer';
import SavePasswordModal from './SavePasswordModal';
import GeneratedPasswordDisplay from './generator/GeneratedPasswordDisplay';
import PasswordCustomization from './generator/PasswordCustomization';
import { usePasswordGeneration } from '@/hooks/usePasswordGeneration';

interface PasswordGeneratorProps {
  onSavePassword?: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = () => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAdvancedScoring, setShowAdvancedScoring] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    password,
    setPassword,
    options,
    setOptions,
    generatePassword,
    copyToClipboard
  } = usePasswordGeneration();

  const handleSavePassword = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "No password to save",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to save passwords",
        variant: "destructive"
      });
      return;
    }

    setShowSaveModal(true);
  };

  const handleKeywordPasswordGenerated = (keywordPassword: string) => {
    setPassword(keywordPassword);
  };

  const generatedPasswordCrackTime = password ? calculateCrackTime(password) : null;
  const generatedPasswordBreach = password ? checkPasswordBreach(password) : null;
  const passwordScore = password ? calculatePasswordScore(password) : null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card bg-white/5 backdrop-blur-xl border-white/20">
          <TabsTrigger 
            value="generator" 
            className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-green-400"
          >
            Password Generator
          </TabsTrigger>
          <TabsTrigger 
            value="analyzer" 
            className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-green-400"
          >
            AI Password Analyzer [NEW]
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6 mt-6">
          <GeneratedPasswordDisplay
            password={password}
            onRegenerate={generatePassword}
            onSave={handleSavePassword}
            onCopy={copyToClipboard}
            showAdvancedScoring={showAdvancedScoring}
            onToggleAdvancedScoring={() => setShowAdvancedScoring(!showAdvancedScoring)}
            passwordScore={passwordScore}
            crackTime={generatedPasswordCrackTime}
            breach={generatedPasswordBreach}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PasswordCustomization
              options={options}
              onOptionsChange={setOptions}
            />
            <KeywordObfuscator onPasswordGenerated={handleKeywordPasswordGenerated} />
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-6 mt-6">
          <PasswordAnalyzer />
        </TabsContent>
      </Tabs>

      {showSaveModal && (
        <SavePasswordModal
          isOpen={showSaveModal}
          password={password}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default PasswordGenerator;
