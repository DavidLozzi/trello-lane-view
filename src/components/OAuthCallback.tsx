import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackProps {
  onAuthenticated: (apiKey: string, token: string) => void;
}

export function OAuthCallback({ onAuthenticated }: OAuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the API key from localStorage (should be stored during auth flow)
        const savedCredentials = localStorage.getItem('trello_api_key');
        const apiKey = savedCredentials || '';
        
        if (!apiKey) {
          throw new Error('No API key found. Please restart authentication.');
        }

        // Extract token from URL fragment (Trello returns it after #)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get('token');

        if (!token) {
          throw new Error('No token received from Trello');
        }

        // Test the token with Trello API
        const response = await fetch(`https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`);
        if (!response.ok) {
          throw new Error('Invalid authentication token');
        }

        // Clean up temporary API key storage
        localStorage.removeItem('trello_api_key');
        
        // Authentication successful
        onAuthenticated(apiKey, token);
        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        // Clean up on error
        localStorage.removeItem('trello_api_key');
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