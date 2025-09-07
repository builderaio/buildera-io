import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PasswordStrength {
  score: number;
  isValid: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  minLength: boolean;
}

export const usePasswordValidation = (password: string) => {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    isValid: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    minLength: false
  });

  useEffect(() => {
    if (!password) {
      setStrength({
        score: 0,
        isValid: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        minLength: false
      });
      return;
    }

    const validatePassword = async () => {
      try {
        const { data, error } = await supabase.rpc('validate_password_strength', {
          password_input: password
        });

        if (data && !error && typeof data === 'object' && data !== null) {
          const result = data as any;
          setStrength({
            score: result.score || 0,
            isValid: result.isValid || false,
            hasUpper: result.hasUpper || false,
            hasLower: result.hasLower || false,
            hasNumber: result.hasNumber || false,
            hasSpecial: result.hasSpecial || false,
            minLength: result.minLength || false
          });
        } else {
          // Fallback client-side validation
          const score = calculateLocalStrength(password);
          setStrength(score);
        }
      } catch {
        // Fallback to client-side validation if server fails
        const score = calculateLocalStrength(password);
        setStrength(score);
      }
    };

    validatePassword();
  }, [password]);

  return strength;
};

// Fallback client-side validation
const calculateLocalStrength = (password: string): PasswordStrength => {
  let score = 0;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const minLength = password.length >= 8;

  if (minLength) score += 2;
  if (hasUpper) score += 1;
  if (hasLower) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  return {
    score,
    isValid: score >= 4 && minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    minLength
  };
};