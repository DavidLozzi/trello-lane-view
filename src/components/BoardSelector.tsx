import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trello, Users, ExternalLink, LogOut } from 'lucide-react';
import { TrelloBoard } from '@/types/trello';

interface BoardSelectorProps {
  apiKey: string;
  token: string;
  onBoardSelected: (board: TrelloBoard) => void;
}

export function BoardSelector({ apiKey, token, onBoardSelected }: BoardSelectorProps) {
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('BoardSelector: Component mounted, fetching boards...');
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      console.log('BoardSelector: Starting fetch with apiKey:', apiKey?.slice(0, 8) + '...', 'token:', token?.slice(0, 8) + '...');
      setIsLoading(true);
      const response = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${apiKey}&token=${token}&filter=open&fields=id,name,desc,url,prefs`
      );
      
      console.log('BoardSelector: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('BoardSelector: Error response:', errorText);
        throw new Error('Failed to fetch boards');
      }

      const boardsData = await response.json();
      console.log('BoardSelector: Fetched boards:', boardsData.length);
      setBoards(boardsData);
    } catch (err) {
      console.log('BoardSelector: Error fetching boards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-trello-primary mb-4" />
            <p className="text-center text-muted-foreground">Loading your Trello boards...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardContent className="py-12">
            <Alert className="border-destructive/50 text-destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={fetchBoards} className="w-full mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-card">
            <Trello className="w-8 h-8 text-trello-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Select Your Board</h1>
          <p className="text-white/80">Choose a Trello board to visualize with swimlane layouts</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('trello_credentials');
              window.location.href = '/';
            }}
            className="mt-4 text-white/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Reconnect with Different Credentials
          </Button>
        </div>

        {boards.length === 0 ? (
          <Card className="shadow-elevated">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No boards found. Create a board in Trello first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Card 
                key={board.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-elevated hover:scale-105 animate-fade-in group"
                onClick={() => onBoardSelected(board)}
              >
                <CardHeader 
                  className="pb-3"
                  style={{
                    background: board.prefs.backgroundColor || '#0079bf',
                    backgroundImage: board.prefs.background ? `url(${board.prefs.background})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-trello-primary transition-colors">
                      {board.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <CardDescription className="text-sm mb-3 line-clamp-2">
                    {board.desc || 'No description available'}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-trello-primary hover:text-trello-primary/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(board.url, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View in Trello
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-trello-primary hover:bg-trello-primary/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBoardSelected(board);
                      }}
                    >
                      Select Board
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}