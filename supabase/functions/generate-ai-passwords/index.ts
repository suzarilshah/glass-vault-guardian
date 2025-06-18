
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordRequirements {
  includeNumbers: boolean;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeSpecialChars: boolean;
  length: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, requirements }: { keywords: string; requirements?: PasswordRequirements } = await req.json();

    if (!keywords) {
      return new Response(
        JSON.stringify({ error: 'Keywords are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use the correct endpoint and API key
    const endpoint = 'https://airilshah.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview';
    const apiKey = '1P2srHsEam6U2rj0HRck9NL9tJ5iEmcay63xnU8FkSo27ZDkw53jJQQJ99BEACYeBjFXJ3w3AAAAACOGmoks';

    // Build requirements string
    const reqList = [];
    if (requirements?.includeUppercase) reqList.push('uppercase letters');
    if (requirements?.includeLowercase) reqList.push('lowercase letters');
    if (requirements?.includeNumbers) reqList.push('numbers');
    if (requirements?.includeSpecialChars) reqList.push('special characters');
    
    const requirementsText = reqList.length > 0 
      ? `Must include: ${reqList.join(', ')}.` 
      : 'Use a balanced mix of character types.';

    const passwordLength = requirements?.length || 12;

    const prompt = `Generate 3-4 highly secure and memorable passwords based on these keywords: "${keywords}". 

Requirements:
- Each password must be exactly ${passwordLength} characters long
- ${requirementsText}
- Be memorable but cryptographically strong
- Incorporate the keywords creatively (obfuscated, not literally)
- Each should have different security patterns
- Focus on creating passwords that are both secure AND easy to remember

Return ONLY a valid JSON array with this exact format:
[
  {
    "password": "example123!",
    "explanation": "Brief explanation of how keywords were incorporated and why it's memorable",
    "strength": "Very Strong"
  }
]`;

    console.log('Making request to Azure AI endpoint...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert specializing in creating secure, memorable passwords. Always return valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API request failed:', response.status, response.statusText, errorText);
      throw new Error(`AI API request failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI response received successfully');
    
    const content = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Validate the response structure
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating AI passwords:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI passwords',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
