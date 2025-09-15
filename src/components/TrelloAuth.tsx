import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Trello } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { TRELLO_API_KEY, buildTrelloAuthorizeUrl } from '@/config';

export function TrelloAuth() {
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { startOAuth, setToken } = useAuth();

  const isLovableSandbox = typeof window !== 'undefined' && window.location.origin.includes('sandbox.lovable.dev');

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
    if (!TRELLO_API_KEY) {
      setError('Missing Trello API key. Set VITE_TRELLO_API_KEY.');
      return;
    }
    startOAuth();
  };

  const handleManualToken = async () => {
    if (!manualToken.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      await setToken(manualToken.trim());
      toast({
        title: "Success!",
        description: "Successfully connected to Trello",
      });
    } catch (error) {
      setError('Invalid token. Please check and try again.');
    } finally {
      setIsValidating(false);
    }
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
          {!showManualInput ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click the button below to authenticate with your Trello account
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
                Connect with Trello {isLovableSandbox && "(Opens in new tab)"}
              </Button>

              {isLovableSandbox && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualInput(true)}
                    className="text-sm"
                  >
                    <Key className="w-3 h-3 mr-2" />
                    Use manual token instead
                  </Button>
                </div>
              )}

              <div className="text-xs text-center text-muted-foreground">
                {isLovableSandbox 
                  ? "Authentication will open in a new tab. Copy the token from the URL after authorization."
                  : "You'll be redirected to Trello to authorize access to your boards"
                }
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-3">Get your Trello token:</p>
                  <p className="mb-2">1. <a href={buildTrelloAuthorizeUrl('manual')} target="_blank" rel="noopener noreferrer" className="text-trello-primary underline">Click here to authorize</a></p>
                  <p className="mb-2">2. After authorization, look for the token in the URL after "#token="</p>
                  <p className="mb-2">3. Copy that token and paste it below</p>
                  <p className="text-xs text-amber-600">If you don't see a token in the URL, the page might show "Token: [your-token]" - copy that instead</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Trello Token</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Paste your Trello token here..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert className="border-destructive/50 text-destructive animate-fade-in">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleManualToken}
                    disabled={isValidating || !manualToken.trim()}
                    className="flex-1"
                  >
                    {isValidating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Validate Token
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualInput(false)}
                  >
                    Back
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}