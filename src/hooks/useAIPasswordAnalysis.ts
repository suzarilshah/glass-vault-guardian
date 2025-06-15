
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisResponse {
  insights: string;
  suggestions: string[];
  riskAssessment: string;
  improvements: string[];
}

interface CurrentAnalysis {
  entropy: number;
  crackTime: { humanReadable: string };
  passwordScore: any;
  breachStatus?: any;
}

export const useAIPasswordAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const { toast } = useToast();

  const analyzePasswordWithAI = async (password: string, currentAnalysis: CurrentAnalysis) => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter a password to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-password-ai', {
        body: {
          password,
          currentAnalysis: {
            entropy: currentAnalysis.entropy,
            crackTime: currentAnalysis.crackTime.humanReadable,
            passwordScore: currentAnalysis.passwordScore,
            breachStatus: currentAnalysis.breachStatus,
          }
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        throw error;
      }

      setAiAnalysis(data);
      toast({
        title: "AI Analysis Complete",
        description: "Grok 3 has analyzed your password",
      });
    } catch (error) {
      console.error('Failed to get AI analysis:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Unable to get AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setAiAnalysis(null);
  };

  return {
    isAnalyzing,
    aiAnalysis,
    analyzePasswordWithAI,
    clearAnalysis,
  };
};
