import * as React from "react"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useRateLimit } from "@/hooks/useSecurity"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showStrengthIndicator?: boolean;
  onStrengthChange?: (strength: { score: number; isValid: boolean; strength: string }) => void;
}

// Función para calcular la fuerza de la contraseña en el cliente
const calculatePasswordStrength = (password: string) => {
  let score = 0;
  const issues: string[] = [];
  
  if (password.length >= 8) score += 1;
  else issues.push('At least 8 characters');
  
  if (password.length >= 12) score += 1;
  
  if (/[A-Z]/.test(password)) score += 1;
  else issues.push('One uppercase letter');
  
  if (/[a-z]/.test(password)) score += 1;
  else issues.push('One lowercase letter');
  
  if (/[0-9]/.test(password)) score += 1;
  else issues.push('One number');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else issues.push('One special character');
  
  // Penalizar contraseñas comunes
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2);
    issues.push('Avoid common passwords');
  }
  
  return {
    score: Math.min(score, 6),
    maxScore: 6,
    strength: score >= 5 ? 'strong' : score >= 3 ? 'medium' : 'weak',
    isValid: issues.length === 0 && score >= 4,
    issues
  };
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, type, showStrengthIndicator = false, onStrengthChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [strength, setStrength] = React.useState<any>(null)
    const [value, setValue] = React.useState("")
    
    // Rate limiting para prevenir ataques de fuerza bruta
    const { checkRateLimit } = useRateLimit({
      maxAttempts: 10,
      windowMs: 60000, // 1 minuto
      identifier: `password_attempts_${Date.now()}`
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      if (showStrengthIndicator && newValue) {
        const newStrength = calculatePasswordStrength(newValue);
        setStrength(newStrength);
        onStrengthChange?.(newStrength);
      } else {
        setStrength(null);
        onStrengthChange?.({ score: 0, isValid: false, strength: 'weak' });
      }
      
      props.onChange?.(e);
    };

    const togglePasswordVisibility = () => {
      if (!checkRateLimit()) {
        return; // Rate limited
      }
      setShowPassword(!showPassword)
    }

    const getStrengthColor = () => {
      if (!strength) return "bg-gray-200";
      switch (strength.strength) {
        case 'strong': return "bg-green-500";
        case 'medium': return "bg-yellow-500";
        default: return "bg-red-500";
      }
    };

    const getStrengthIcon = () => {
      if (!strength) return null;
      switch (strength.strength) {
        case 'strong': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'medium': return <Shield className="h-4 w-4 text-yellow-500" />;
        default: return <AlertTriangle className="h-4 w-4 text-red-500" />;
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            className={cn("pr-20", className)}
            ref={ref}
            value={value}
            onChange={handleChange}
            data-sensitive="true" // Marca para detección de seguridad
            autoComplete={props.autoComplete || "current-password"}
            {...props}
          />
          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
            {strength && getStrengthIcon()}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-transparent"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={props.disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        {showStrengthIndicator && strength && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Password strength</span>
              <span className={cn(
                "font-medium",
                strength.strength === 'strong' ? "text-green-600" :
                strength.strength === 'medium' ? "text-yellow-600" : "text-red-600"
              )}>
                {strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1)}
              </span>
            </div>
            <Progress 
              value={(strength.score / strength.maxScore) * 100} 
              className={cn("h-2", getStrengthColor())}
            />
            {strength.issues.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <p>Required: {strength.issues.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }