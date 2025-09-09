import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, Key } from 'lucide-react';

interface TrelloAuthProps {
  onAuthenticated: (apiKey: string, token: string) => void;
}

export function TrelloAuth({ onAuthenticated }: TrelloAuthProps) {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Trello API key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // If no token provided, redirect to Trello OAuth
      if (!token.trim()) {
        const authUrl = `https://trello.com/1/authorize?expiration=never&scope=read&response_type=token&name=Trello%20Board%20Visualizer&key=${apiKey}&return_url=${window.location.origin}`;
        window.open(authUrl, '_blank');
        setError('Please complete authentication in the new window and paste your token below.');
        setIsLoading(false);
        return;
      }

      // Test the credentials
      const response = await fetch(`https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`);
      if (!response.ok) {
        throw new Error('Invalid API key or token');
      }

      onAuthenticated(apiKey, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-trello-primary rounded-xl flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Connect to Trello</CardTitle>
          <CardDescription>
            Visualize your Trello boards with beautiful swimlane layouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Trello API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="transition-all duration-200 focus:ring-2 focus:ring-trello-primary"
            />
            <p className="text-sm text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://trello.com/1/appKey/generate" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-trello-primary hover:underline inline-flex items-center gap-1"
              >
                trello.com/1/appKey/generate
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Access Token (optional)</Label>
            <Input
              id="token"
              type="password"
              placeholder="Paste token here after authentication"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="transition-all duration-200 focus:ring-2 focus:ring-trello-primary"
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to get token through OAuth
            </p>
          </div>

          {error && (
            <Alert className="border-destructive/50 text-destructive animate-fade-in">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleAuth} 
            disabled={isLoading || !apiKey.trim()}
            className="w-full bg-trello-primary hover:bg-trello-primary/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Connect to Trello'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}