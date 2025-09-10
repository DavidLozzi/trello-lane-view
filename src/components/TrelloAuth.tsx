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

export function TrelloAuth({ onAuthenticated }: TrelloAuthProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'api-key' | 'oauth'>('api-key');
  const { toast } = useToast();

  useEffect(() => {
    // Check for authentication error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    
    if (authError === 'auth_failed') {
      setError('Authentication failed. Please try again.');
      setStep('api-key'); // Go back to API key step
      // Clear error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      setError('Please enter your Trello API key');
      return;
    }
    // Store API key temporarily for OAuth callback
    localStorage.setItem('trello_api_key', apiKey);
    setError('');
    setStep('oauth');
  };

  const handleOAuthLogin = () => {
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const authUrl = `https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&name=Trello%20Swimlane%20Viewer&key=${apiKey}&return_url=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  if (step === 'api-key') {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-trello-primary rounded-xl flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Connect to Trello</CardTitle>
            <CardDescription>
              First, enter your Trello API key to enable OAuth authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Trello API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-trello-primary"
              />
              <div className="text-sm text-muted-foreground">
                Get your API key from{' '}
                <a 
                  href="https://trello.com/app-key" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-trello-primary hover:underline inline-flex items-center gap-1"
                >
                  trello.com/app-key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {error && (
              <Alert className="border-destructive/50 text-destructive animate-fade-in">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleApiKeySubmit} 
              disabled={!apiKey.trim()}
              className="w-full bg-trello-primary hover:bg-trello-primary/90 text-white"
              size="lg"
            >
              Continue to OAuth
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setStep('api-key')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Back to API Key
            </Button>
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