import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { consumeAndValidateOAuthState, useAuth } from '@/context/AuthContext';
import { TRELLO_API_KEY } from '@/config';

export function OAuthCallback({ onAuthenticated }: { onAuthenticated?: (apiKey: string, token: string) => void }) {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL fragment (Trello returns it after #)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('token');
        const state = params.get('state');

        if (!token) {
          throw new Error('No token received from Trello');
        }
        if (!consumeAndValidateOAuthState(state)) {
          throw new Error('Invalid OAuth state');
        }

        await setToken(token);
        onAuthenticated?.(TRELLO_API_KEY, token);
        navigate('/');
      } catch (error) {
        // Redirect back to auth page on error
        navigate('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [onAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-trello-primary mb-4" />
          <p className="text-center text-muted-foreground">Completing authentication...</p>
        </CardContent>
      </Card>
    </div>
  );
}