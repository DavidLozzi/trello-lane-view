import { useState } from 'react';
import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloAuth } from '@/components/TrelloAuth';
import { BoardSelector } from '@/components/BoardSelector';
import { TrelloBoard } from '@/types/trello';

const Index = () => {
  const [authState, setAuthState] = useState<{
    apiKey: string;
    token: string;
  } | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);

  const handleAuthenticated = (apiKey: string, token: string) => {
    setAuthState({ apiKey, token });
  };

  const handleBoardSelected = (board: TrelloBoard) => {
    setSelectedBoard(board);
  };

  const handleBack = () => {
    if (selectedBoard) {
      setSelectedBoard(null);
    } else {
      setAuthState(null);
    }
  };

  // Show authentication if not authenticated
  if (!authState) {
    return <TrelloAuth onAuthenticated={handleAuthenticated} />;
  }

  // Show board selector if authenticated but no board selected
  if (!selectedBoard) {
    return (
      <BoardSelector
        apiKey={authState.apiKey}
        token={authState.token}
        onBoardSelected={handleBoardSelected}
      />
    );
  }

  // Show swimlane view with selected board
  return (
    <SwimlaneView 
      board={selectedBoard}
      apiKey={authState.apiKey}
      token={authState.token}
      onBack={handleBack}
    />
  );
};

export default Index;
