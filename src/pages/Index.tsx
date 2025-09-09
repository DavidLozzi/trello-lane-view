import { useState, useEffect } from 'react';
import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloAuth } from '@/components/TrelloAuth';
import { BoardSelector } from '@/components/BoardSelector';
import { TrelloBoard } from '@/types/trello';

const STORAGE_KEY = 'trello_credentials';

const Index = () => {
  const [authState, setAuthState] = useState<{
    apiKey: string;
    token: string;
  } | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem(STORAGE_KEY);
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        setAuthState(parsed);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleAuthenticated = (apiKey: string, token: string) => {
    const credentials = { apiKey, token };
    setAuthState(credentials);
    // Save credentials to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  };

  const handleBoardSelected = (board: TrelloBoard) => {
    setSelectedBoard(board);
  };

  const handleBack = () => {
    if (selectedBoard) {
      setSelectedBoard(null);
    } else {
      // Clear credentials from localStorage when logging out
      localStorage.removeItem(STORAGE_KEY);
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
