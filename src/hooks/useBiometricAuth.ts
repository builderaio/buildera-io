import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BiometricCredential {
  id: string;
  device_name: string;
  device_type: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface UseBiometricAuthReturn {
  isAvailable: boolean;
  isLoading: boolean;
  credentials: BiometricCredential[];
  checkAvailability: () => Promise<boolean>;
  registerBiometric: (deviceName?: string) => Promise<boolean>;
  authenticateWithBiometric: (email?: string) => Promise<boolean>;
  getRegisteredDevices: () => Promise<void>;
  removeBiometric: (credentialId: string) => Promise<boolean>;
  hasCredentials: boolean;
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const { toast } = useToast();

  // Check if WebAuthn/biometric is available on this device
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.PublicKeyCredential) {
        setIsAvailable(false);
        return false;
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsAvailable(available);
      return available;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
      return false;
    }
  }, []);

  // Get user's registered biometric devices
  const getRegisteredDevices = useCallback(async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials(data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  }, []);

  // Register a new biometric credential
  const registerBiometric = useCallback(async (deviceName?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Step 1: Get registration options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-register-options'
      );

      if (optionsError || !optionsData?.options) {
        throw new Error(optionsError?.message || 'Failed to get registration options');
      }

      const options = optionsData.options;

      // Convert challenge and user.id to ArrayBuffer
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        user: {
          ...options.user,
          id: Uint8Array.from(options.user.id, (c: string) => c.charCodeAt(0)),
        },
        excludeCredentials: options.excludeCredentials?.map((cred: { id: string; type: string }) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })),
      };

      // Step 2: Create credential using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Convert to base64url for sending to server
      const credentialData = {
        id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, ''),
        type: credential.type,
        response: {
          attestationObject: btoa(String.fromCharCode(...new Uint8Array(response.attestationObject))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          publicKey: response.getPublicKey ? 
            btoa(String.fromCharCode(...new Uint8Array(response.getPublicKey()!))) : null,
          transports: response.getTransports ? response.getTransports() : ['internal'],
        },
      };

      // Detect device type
      const userAgent = navigator.userAgent.toLowerCase();
      let deviceType = 'unknown';
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        deviceType = 'face'; // Face ID on iOS
      } else if (userAgent.includes('android')) {
        deviceType = 'fingerprint'; // Most Android devices use fingerprint
      } else if (userAgent.includes('mac')) {
        deviceType = 'face'; // Touch ID or Face on Mac
      } else if (userAgent.includes('windows')) {
        deviceType = 'face'; // Windows Hello
      }

      // Step 3: Verify and store credential on server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-register-verify',
        {
          body: {
            credential: credentialData,
            deviceName: deviceName || `${deviceType === 'face' ? 'Face ID' : 'Huella digital'}`,
            deviceType,
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Failed to verify credential');
      }

      toast({
        title: '¡Biometría registrada!',
        description: 'Ahora puedes iniciar sesión con tu huella o Face ID.',
      });

      await getRegisteredDevices();
      return true;
    } catch (error: unknown) {
      console.error('Error registering biometric:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      // Handle specific WebAuthn errors
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('cancelled')) {
        toast({
          title: 'Registro cancelado',
          description: 'El proceso de registro biométrico fue cancelado.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error al registrar biometría',
          description: 'No se pudo registrar el dispositivo biométrico.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getRegisteredDevices]);

  // Authenticate with biometric
  const authenticateWithBiometric = useCallback(async (email?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Step 1: Get login options from server
      const { data: optionsData, error: optionsError } = await supabase.functions.invoke(
        'webauthn-login-options',
        {
          body: { email },
        }
      );

      if (optionsError || !optionsData?.options) {
        if (optionsData?.hasCredentials === false) {
          toast({
            title: 'Sin biometría configurada',
            description: 'No tienes dispositivos biométricos registrados.',
            variant: 'destructive',
          });
          return false;
        }
        throw new Error(optionsError?.message || 'Failed to get login options');
      }

      const options = optionsData.options;
      const userId = optionsData.userId;

      // Convert challenge and allowCredentials to ArrayBuffer
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        allowCredentials: options.allowCredentials?.map((cred: { id: string; type: string; transports?: string[] }) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })),
      };

      // Step 2: Get credential from WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to get credential');
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // Convert to base64url for sending to server
      const credentialData = {
        id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, ''),
        type: credential.type,
        response: {
          authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
          clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
          signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
          userHandle: response.userHandle ? 
            btoa(String.fromCharCode(...new Uint8Array(response.userHandle))) : null,
        },
      };

      // Step 3: Verify credential on server
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'webauthn-login-verify',
        {
          body: {
            credential: credentialData,
            userId,
          },
        }
      );

      if (verifyError || !verifyData?.success) {
        throw new Error(verifyError?.message || 'Failed to verify login');
      }

      // Step 4: Use the magic link token to sign in
      if (verifyData.token && verifyData.type) {
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: verifyData.token,
          type: verifyData.type as 'magiclink',
        });

        if (signInError) {
          // Try alternative sign-in method
          window.location.href = verifyData.redirectUrl;
          return true;
        }
      }

      toast({
        title: '¡Bienvenido!',
        description: 'Autenticación biométrica exitosa.',
      });

      return true;
    } catch (error: unknown) {
      console.error('Error authenticating with biometric:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('cancelled')) {
        toast({
          title: 'Autenticación cancelada',
          description: 'El proceso de autenticación fue cancelado.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error de autenticación',
          description: 'No se pudo verificar tu identidad biométrica.',
          variant: 'destructive',
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Remove a biometric credential
  const removeBiometric = useCallback(async (credentialId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_credentials')
        .update({ is_active: false })
        .eq('id', credentialId);

      if (error) throw error;

      toast({
        title: 'Dispositivo eliminado',
        description: 'El dispositivo biométrico ha sido desvinculado.',
      });

      await getRegisteredDevices();
      return true;
    } catch (error) {
      console.error('Error removing biometric:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el dispositivo biométrico.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getRegisteredDevices]);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    isLoading,
    credentials,
    checkAvailability,
    registerBiometric,
    authenticateWithBiometric,
    getRegisteredDevices,
    removeBiometric,
    hasCredentials: credentials.length > 0,
  };
};
