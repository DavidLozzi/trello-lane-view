import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  Circle, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Calendar,
  Tag
} from 'lucide-react';
import { TrelloBoard, TrelloCard, TrelloList, CardProgress } from '@/types/trello';
import { cn } from '@/lib/utils';

interface SwimlaneViewProps {
  board: TrelloBoard;
  apiKey: string;
  token: string;
  onBack: () => void;
}

export function SwimlaneView({ board, apiKey, token, onBack }: SwimlaneViewProps) {
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [cards, setCards] = useState<TrelloCard[]>([]);
  const [cardProgresses, setCardProgresses] = useState<CardProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBoardData();
  }, []);

  const fetchBoardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch lists
      const listsResponse = await fetch(
        `https://api.trello.com/1/boards/${board.id}/lists?key=${apiKey}&token=${token}&filter=open`
      );
      
      if (!listsResponse.ok) {
        throw new Error('Failed to fetch lists');
      }
      
      const listsData = await listsResponse.json();
      const sortedLists = listsData.sort((a: TrelloList, b: TrelloList) => a.pos - b.pos);
      setLists(sortedLists);

      // Fetch cards
      const cardsResponse = await fetch(
        `https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&filter=open&fields=id,name,desc,pos,due,labels,url,cover&list=true`
      );
      
      if (!cardsResponse.ok) {
        throw new Error('Failed to fetch cards');
      }
      
      const cardsData = await cardsResponse.json();
      setCards(cardsData);

      // Calculate progress for each card
      const progresses = cardsData.map((card: TrelloCard) => {
        const currentListIndex = sortedLists.findIndex((list: TrelloList) => list.id === card.list.id);
        const completedLists = sortedLists.slice(0, currentListIndex).map((list: TrelloList) => list.name);
        const currentList = sortedLists[currentListIndex]?.name || '';
        const remainingLists = sortedLists.slice(currentListIndex + 1).map((list: TrelloList) => list.name);

        return {
          card,
          currentListIndex,
          totalLists: sortedLists.length,
          completedLists,
          currentList,
          remainingLists
        };
      });

      setCardProgresses(progresses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return 'bg-status-completed text-white';
      case 'current':
        return 'bg-status-current text-white';
      case 'pending':
        return 'bg-status-pending text-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  const getStatusIcon = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'current':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <Circle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-trello-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading board data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert className="max-w-md border-destructive/50 text-destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Boards
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{board.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {cardProgresses.length} cards • {lists.length} columns
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => window.open(board.url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Trello
            </Button>
          </div>
        </div>
      </div>

      {/* Swimlane View */}
      <div className="max-w-7xl mx-auto p-4">
        {cardProgresses.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No cards found in this board.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cardProgresses.map((progress) => (
              <Card key={progress.card.id} className="shadow-card hover:shadow-elevated transition-shadow animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-foreground truncate">
                        {progress.card.name}
                      </CardTitle>
                      {progress.card.desc && (
                        <CardDescription className="mt-1 text-sm line-clamp-2">
                          {progress.card.desc}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {progress.card.labels.length > 0 && (
                          <div className="flex gap-1">
                            {progress.card.labels.slice(0, 3).map((label) => (
                              <Badge 
                                key={label.id} 
                                variant="secondary" 
                                className="text-xs"
                                style={{ backgroundColor: `var(--label-${label.color}, hsl(var(--muted)))` }}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {label.name || label.color}
                              </Badge>
                            ))}
                            {progress.card.labels.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{progress.card.labels.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        {progress.card.due && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(progress.card.due).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(progress.card.url, '_blank')}
                      className="shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-muted-foreground">
                        {progress.currentListIndex + 1} of {progress.totalLists}
                      </span>
                    </div>
                    <Progress 
                      value={(progress.currentListIndex + 1) / progress.totalLists * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Column Status */}
                  <div className="flex flex-wrap gap-2">
                    {lists.map((list, index) => {
                      let status: 'completed' | 'current' | 'pending';
                      
                      if (index < progress.currentListIndex) {
                        status = 'completed';
                      } else if (index === progress.currentListIndex) {
                        status = 'current';
                      } else {
                        status = 'pending';
                      }

                      return (
                        <Badge
                          key={list.id}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1 transition-all duration-200',
                            getStatusColor(status),
                            status === 'current' && 'animate-pulse-soft'
                          )}
                        >
                          {getStatusIcon(status)}
                          <span className="text-sm font-medium">{list.name}</span>
                        </Badge>
                      );
                    })}
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