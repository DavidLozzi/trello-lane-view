import { useState } from 'react';
import { TrelloAuth } from '@/components/TrelloAuth';
import { BoardSelector } from '@/components/BoardSelector';
import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloBoard } from '@/types/trello';

type AppState = 'auth' | 'boards' | 'swimlane';

const Index = () => {
  const [state, setState] = useState<AppState>('auth');
  const [credentials, setCredentials] = useState<{ apiKey: string; token: string } | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);

  const handleAuthenticated = (apiKey: string, token: string) => {
    setCredentials({ apiKey, token });
    setState('boards');
  };

  const handleBoardSelected = (board: TrelloBoard) => {
    setSelectedBoard(board);
    setState('swimlane');
  };

  const handleBackToBoards = () => {
    setSelectedBoard(null);
    setState('boards');
  };

  const handleBackToAuth = () => {
    setCredentials(null);
    setSelectedBoard(null);
    setState('auth');
  };

  if (state === 'auth') {
    return <TrelloAuth onAuthenticated={handleAuthenticated} />;
  }

  if (state === 'boards' && credentials) {
    return (
      <BoardSelector 
        apiKey={credentials.apiKey}
        token={credentials.token}
        onBoardSelected={handleBoardSelected}
      />
    );
  }

  if (state === 'swimlane' && credentials && selectedBoard) {
    return (
      <SwimlaneView 
        board={selectedBoard}
        apiKey={credentials.apiKey}
        token={credentials.token}
        onBack={handleBackToBoards}
      />
    );
  }

  return null;
};

export default Index;
