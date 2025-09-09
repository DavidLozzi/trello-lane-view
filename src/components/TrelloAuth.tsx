import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, Key, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrelloAuthProps {
  onAuthenticated: (apiKey: string, token: string) => void;
}

export function TrelloAuth({ onAuthenticated }: TrelloAuthProps) {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const copyRedirectUrl = () => {
    const redirectUrl = window.location.origin;
    navigator.clipboard.writeText(redirectUrl);
    toast({
      description: "Redirect URL copied to clipboard!",
    });
  };

  const handleAuth = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Trello API key');
      return;
    }

    if (!token.trim()) {
      setError('Please enter your access token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-trello-primary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Create a Power-Up at{' '}
              <a 
                href="https://trello.com/power-ups/admin" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-trello-primary hover:underline inline-flex items-center gap-1"
              >
                trello.com/power-ups/admin
                <ExternalLink className="w-3 h-3" />
               </a>
               <br />
               <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs"><strong>Redirect URL:</strong></span>
                 <code className="bg-muted px-1 rounded text-xs flex-1">{window.location.origin}</code>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={copyRedirectUrl}
                   className="h-6 w-6 p-0"
                 >
                   <Copy className="w-3 h-3" />
                 </Button>
               </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Access Token</Label>
            <div className="relative">
              <Input
                id="token"
                type={showToken ? "text" : "password"}
                placeholder="Enter your access token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-trello-primary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              In your Power-Up's API key tab, click the "Token" link to get your access token
            </div>
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