import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Trello, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrelloAuthProps {
  onAuthenticated: (apiKey: string, token: string) => void;
}

const TRELLO_API_KEY = 'a3fda079880a6e03b474e7c434fcc79c';

export function TrelloAuth({ onAuthenticated }: TrelloAuthProps) {
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Check for authentication error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    
    if (authError === 'auth_failed') {
      setError('Authentication failed. Please try again.');
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleOAuthLogin = () => {
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const authUrl = `https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&name=Trello%20Swimlane%20Viewer&key=${TRELLO_API_KEY}&return_url=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-trello-primary rounded-xl flex items-center justify-center mb-4">
            <Trello className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Connect to Trello</CardTitle>
          <CardDescription>
            Visualize your Trello boards with beautiful swimlane layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the button below to securely authenticate with your Trello account
            </p>
          </div>

          {error && (
            <Alert className="border-destructive/50 text-destructive animate-fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleOAuthLogin} 
            className="w-full bg-trello-primary hover:bg-trello-primary/90 text-white"
            size="lg"
          >
            <Trello className="w-4 h-4 mr-2" />
            Connect with Trello
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            You'll be redirected to Trello to authorize access to your boards
          </div>
        </CardContent>
      </Card>
    </div>
  );
}