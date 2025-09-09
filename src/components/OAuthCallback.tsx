import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackProps {
  onAuthenticated: (apiKey: string, token: string) => void;
}

const TRELLO_APP_KEY = '4d368ac4406e65484129bfde9916c85c';

export function OAuthCallback({ onAuthenticated }: OAuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract token from URL fragment (Trello returns it after #)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('token');

        if (!token) {
          throw new Error('No token received from Trello');
        }

        // Test the token with Trello API
        const response = await fetch(`https://api.trello.com/1/members/me?key=${TRELLO_APP_KEY}&token=${token}`);
        if (!response.ok) {
          throw new Error('Invalid authentication token');
        }

        // Authentication successful
        onAuthenticated(TRELLO_APP_KEY, token);
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
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