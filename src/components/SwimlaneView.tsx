import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table as TableUI, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Loader2, 
  CheckCircle, 
  Circle, 
  Clock, 
  ExternalLink, 
  ArrowLeft,
  Calendar,
  Tag,
  RotateCcw,
  Table,
  List,
  Settings,
  Filter,
  Check
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
  const [sortBy, setSortBy] = useState<'progress' | 'name' | 'created'>('progress');
  const [viewMode, setViewMode] = useState<'swimlane' | 'table'>('swimlane');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [visibleCardColumns, setVisibleCardColumns] = useState<string[]>([]);
  const [visibleLabels, setVisibleLabels] = useState<string[]>([]);

  useEffect(() => {
    loadBoardData();
  }, [board.id, apiKey, token]);

  const loadBoardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch lists from the selected board
      const listsResponse = await fetch(
        `https://api.trello.com/1/boards/${board.id}/lists?key=${apiKey}&token=${token}&filter=open&fields=id,name,pos,closed`
      );
      
      if (!listsResponse.ok) {
        throw new Error('Failed to fetch board lists');
      }

      const listsData: TrelloList[] = await listsResponse.json();
      
      // Fetch cards from the selected board
      const cardsResponse = await fetch(
        `https://api.trello.com/1/boards/${board.id}/cards?key=${apiKey}&token=${token}&fields=id,name,desc,pos,due,dateLastActivity,labels,idList,url,cover,closed&list=true`
      );
      
      if (!cardsResponse.ok) {
        throw new Error('Failed to fetch board cards');
      }

      const cardsData: any[] = await cardsResponse.json();
      
      // Transform cards to match our interface and fetch move dates
      const transformedCards: TrelloCard[] = await Promise.all(
        cardsData.map(async (card) => {
          // Get the date when card was moved to current list
          let movedToCurrentListDate: string | undefined;
          
          try {
            const actionsResponse = await fetch(
              `https://api.trello.com/1/cards/${card.id}/actions?key=${apiKey}&token=${token}&filter=updateCard:idList&limit=10`
            );
            
            if (actionsResponse.ok) {
              const actions = await actionsResponse.json();
              
              // Find the most recent action that moved the card to its current list
              const moveAction = actions.find((action: any) => 
                action.data?.listAfter?.id === card.idList
              );
              
              if (moveAction) {
                movedToCurrentListDate = moveAction.date;
              } else if (actions.length > 0) {
                // If no specific move found, use the most recent action date
                movedToCurrentListDate = actions[0].date;
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch actions for card ${card.id}:`, error);
          }

          return {
            id: card.id,
            name: card.name,
            desc: card.desc || '',
            pos: card.pos,
            due: card.due,
            dateLastActivity: card.dateLastActivity,
            movedToCurrentListDate,
            closed: card.closed || false,
            labels: card.labels || [],
            list: {
              id: card.idList,
              name: card.list?.name || ''
            },
            url: card.url,
            cover: card.cover
          };
        })
      );

      // Sort lists by position
      const sortedLists = listsData.sort((a, b) => a.pos - b.pos);
      
      setLists(sortedLists);
      setCards(transformedCards);
      
      // Initialize visible columns and card columns (show all by default)
      if (visibleColumns.length === 0) {
        setVisibleColumns(sortedLists.map(list => list.id));
      }
      if (visibleCardColumns.length === 0) {
        setVisibleCardColumns(sortedLists.map(list => list.id));
      }
      
      // Initialize visible labels (show all by default)
      const allLabels = [...new Set(transformedCards.flatMap(card => card.labels.map(label => label.id)))];
      if (visibleLabels.length === 0) {
        setVisibleLabels(allLabels);
      }

      // Calculate progress for each card
      const progresses = transformedCards.map((card: TrelloCard) => {
        const currentListIndex = sortedLists.findIndex((list: TrelloList) => list.id === card.list.id);
        const completedLists = sortedLists.slice(0, currentListIndex).map((list: TrelloList) => list.name);
        const currentList = sortedLists[currentListIndex]?.name || '';
        const remainingLists = sortedLists.slice(currentListIndex + 1).map((list: TrelloList) => list.name);

        return {
          card,
          currentListIndex: currentListIndex >= 0 ? currentListIndex : 0,
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

  // Helper function to extract creation date from Trello card ID
  // Helper function to extract creation date from Trello card ID
  const getCardCreationDate = (cardId: string) => {
    // First 8 characters of Trello card ID are hex timestamp
    const timestamp = parseInt(cardId.substring(0, 8), 16);
    return new Date(timestamp * 1000);
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

  // Function to get softer Trello label colors
  const getTrelloLabelColor = (color: string) => {
    const trelloColors: Record<string, { bg: string; text: string }> = {
      'green': { bg: 'hsl(122, 39%, 85%)', text: 'hsl(122, 39%, 25%)' },
      'yellow': { bg: 'hsl(54, 70%, 85%)', text: 'hsl(54, 70%, 25%)' },
      'orange': { bg: 'hsl(25, 85%, 85%)', text: 'hsl(25, 85%, 25%)' },
      'red': { bg: 'hsl(0, 65%, 85%)', text: 'hsl(0, 65%, 25%)' },
      'purple': { bg: 'hsl(271, 36%, 85%)', text: 'hsl(271, 36%, 25%)' },
      'blue': { bg: 'hsl(211, 60%, 85%)', text: 'hsl(211, 60%, 25%)' },
      'sky': { bg: 'hsl(197, 71%, 85%)', text: 'hsl(197, 71%, 25%)' },
      'lime': { bg: 'hsl(84, 69%, 85%)', text: 'hsl(84, 69%, 25%)' },
      'pink': { bg: 'hsl(314, 44%, 85%)', text: 'hsl(314, 44%, 25%)' },
      'black': { bg: 'hsl(220, 9%, 85%)', text: 'hsl(220, 9%, 25%)' },
    };
    
    return trelloColors[color] || { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' };
  };

  // Sorting function
  const getSortedCardProgresses = () => {
    let filtered = [...cardProgresses];
    
    // Filter by visible card columns (status)
    filtered = filtered.filter(progress => visibleCardColumns.includes(progress.card.list.id));
    
    // Filter by visible labels (only if card has labels and at least one matches)
    filtered = filtered.filter(progress => {
      if (progress.card.labels.length === 0) {
        // Show cards without labels only if no specific labels are selected
        return visibleLabels.length === [...new Set(cardProgresses.flatMap(p => p.card.labels.map(l => l.id)))].length;
      }
      return progress.card.labels.some(label => visibleLabels.includes(label.id));
    });
    
    switch (sortBy) {
      case 'progress':
        return filtered.sort((a, b) => a.currentListIndex - b.currentListIndex);
      case 'name':
        return filtered.sort((a, b) => a.card.name.localeCompare(b.card.name));
      case 'created':
        return filtered.sort((a, b) => {
          const dateA = getCardCreationDate(a.card.id);
          const dateB = getCardCreationDate(b.card.id);
          return dateB.getTime() - dateA.getTime(); // Newest first
        });
      default:
        return filtered;
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
      {/* Header with Board Background */}
      <div 
        className="border-b shadow-soft relative overflow-hidden"
        style={{
          backgroundColor: board.prefs.backgroundColor || '#0079bf',
          backgroundImage: board.prefs.background ? `url(${board.prefs.background})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="max-w-7xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="text-white/90 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Boards
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">{board.name}</h1>
                <p className="text-sm text-white/80">
                  {cardProgresses.length} cards • {lists.length} columns
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={loadBoardData}
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.open(board.url, '_blank')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Trello
              </Button>
            </div>
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
            {/* Controls */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value: 'progress' | 'name' | 'created') => setSortBy(value)}>
                    <SelectTrigger className="w-32 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="progress">Progress</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="created">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3"
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      Filter Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {lists.map((list) => (
                      <DropdownMenuCheckboxItem
                        key={list.id}
                        checked={visibleCardColumns.includes(list.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVisibleCardColumns([...visibleCardColumns, list.id]);
                          } else {
                            setVisibleCardColumns(visibleCardColumns.filter(id => id !== list.id));
                          }
                        }}
                      >
                        {list.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-3"
                    >
                      <Filter className="w-3 h-3 mr-1" />
                      Filter Labels
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Filter by Labels</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Array.from(new Map(cardProgresses.flatMap(progress => progress.card.labels).map(label => [label.id, label])).values()).map((label) => {
                      const colors = getTrelloLabelColor(label.color);
                      return (
                        <DropdownMenuCheckboxItem
                          key={label.id}
                          checked={visibleLabels.includes(label.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setVisibleLabels([...visibleLabels, label.id]);
                            } else {
                              setVisibleLabels(visibleLabels.filter(id => id !== label.id));
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: colors.bg }}
                            />
                            {label.name || label.color}
                          </div>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {viewMode === 'table' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs px-3"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>Show Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {lists.map((list) => (
                        <DropdownMenuCheckboxItem
                          key={list.id}
                          checked={visibleColumns.includes(list.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setVisibleColumns([...visibleColumns, list.id]);
                            } else {
                              setVisibleColumns(visibleColumns.filter(id => id !== list.id));
                            }
                          }}
                        >
                          {list.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'swimlane' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('swimlane')}
                  className="h-8 text-xs px-3"
                >
                  <List className="w-3 h-3 mr-1" />
                  Swimlane
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 text-xs px-3"
                >
                  <Table className="w-3 h-3 mr-1" />
                  Table
                </Button>
              </div>
            </div>
            
            {viewMode === 'swimlane' ? (
              <div className="space-y-4">
                {getSortedCardProgresses().map((progress) => (
              <Card key={progress.card.id} className="shadow-card hover:shadow-elevated transition-shadow animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                       <CardTitle className="text-lg font-semibold text-foreground truncate">
                         {progress.card.name}
                       </CardTitle>
                       <p className="text-xs text-muted-foreground mt-1">
                         Created: {getCardCreationDate(progress.card.id).toLocaleDateString()}
                         <span className="ml-3">
                           Last Activity: {new Date(progress.card.dateLastActivity).toLocaleDateString()}
                         </span>
                       </p>
                       {progress.card.desc && (
                         <CardDescription className="mt-1 text-sm line-clamp-2">
                           {progress.card.desc}
                         </CardDescription>
                       )}
                      <div className="flex items-center gap-2 mt-2">
                        {progress.card.labels.length > 0 && (
                           <div className="flex gap-1">
                             {progress.card.labels.slice(0, 3).map((label) => {
                               const colors = getTrelloLabelColor(label.color);
                               return (
                                 <Badge 
                                   key={label.id} 
                                   variant="secondary" 
                                   className="text-xs border-0"
                                   style={{ 
                                     backgroundColor: colors.bg,
                                     color: colors.text
                                   }}
                                 >
                                   <Tag className="w-3 h-3 mr-1" />
                                   {label.name || label.color}
                                 </Badge>
                               );
                             })}
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
                        const originalIndex = index;
                       let status: 'completed' | 'current' | 'pending';
                       
                       // Check if the card is closed/checked off or in a "Done" column
                       const isCardCompleted = progress.card.closed || progress.currentList.toLowerCase().includes('done');
                       
                        if (isCardCompleted && originalIndex === progress.currentListIndex) {
                          // If card is closed/checked off, show current column as completed
                          status = 'completed';
                        } else if (originalIndex < progress.currentListIndex) {
                          status = 'completed';
                        } else if (originalIndex === progress.currentListIndex && !isCardCompleted) {
                          status = 'current';
                       } else {
                         status = 'pending';
                       }

                      return (
                        <Badge
                          key={list.id}
                          className={cn(
                            'flex items-center gap-1 px-3 py-1 transition-all duration-200',
                            getStatusColor(status)
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
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <TableUI>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Card</TableHead>
                      <TableHead className="min-w-[120px]">Last Activity</TableHead>
                      {lists.filter(list => visibleColumns.includes(list.id)).map((list) => (
                        <TableHead key={list.id} className="text-center min-w-[120px]">
                          {list.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedCardProgresses().map((progress) => (
                      <TableRow key={progress.card.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">{progress.card.name}</span>
                            {progress.card.labels.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {progress.card.labels.slice(0, 2).map((label) => {
                                  const colors = getTrelloLabelColor(label.color);
                                  return (
                                    <Badge 
                                      key={label.id} 
                                      variant="secondary" 
                                      className="text-xs border-0 h-4 px-1"
                                      style={{ 
                                        backgroundColor: colors.bg,
                                        color: colors.text
                                      }}
                                    >
                                      {label.name || label.color}
                                    </Badge>
                                  );
                                })}
                                {progress.card.labels.length > 2 && (
                                  <Badge variant="secondary" className="text-xs h-4 px-1">
                                    +{progress.card.labels.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(progress.card.dateLastActivity).toLocaleDateString()}
                        </TableCell>
                        {lists.filter(list => visibleColumns.includes(list.id)).map((list, index) => {
                          const originalIndex = lists.findIndex(l => l.id === list.id);
                          let status: 'completed' | 'current' | 'pending';
                          
                          // Check if the card is closed/checked off or in a "Done" column
                          const isCardCompleted = progress.card.closed || progress.currentList.toLowerCase().includes('done');
                          
                          if (isCardCompleted && originalIndex === progress.currentListIndex) {
                            // If card is closed/checked off, show current column as completed
                            status = 'completed';
                          } else if (originalIndex < progress.currentListIndex) {
                            status = 'completed';
                          } else if (originalIndex === progress.currentListIndex && !isCardCompleted) {
                            status = 'current';
                          } else {
                            status = 'pending';
                          }

                          return (
                            <TableCell key={list.id} className="text-center">
                              <div 
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all duration-200',
                                  getStatusColor(status)
                                )}
                              >
                                {getStatusIcon(status)}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </TableUI>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}