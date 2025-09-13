import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloAuth } from '@/components/TrelloAuth';
import { BoardSelector } from '@/components/BoardSelector';
import { TrelloBoard } from '@/types/trello';
import { useAuth } from '@/context/AuthContext';
import { createTrelloClient } from '@/api/trelloClient';

const Index = () => {
  const { boardId, boardName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { apiKey, token, isAuthenticated, logout } = useAuth();
  const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  // Cleanup any legacy hash tokens and logs (remove sensitive logs)
  useEffect(() => {
    if (window.location.hash.includes('token=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load board from URL if authenticated and boardId is present
  useEffect(() => {
    if (isAuthenticated && apiKey && token && boardId && boardName && !selectedBoard && !isLoadingBoard) {
      loadBoardFromUrl();
    }
  }, [isAuthenticated, apiKey, token, boardId, boardName]);

  const loadBoardFromUrl = async () => {
    if (!isAuthenticated || !apiKey || !token || !boardId || !boardName) return;
    
    setIsLoadingBoard(true);
    try {
      const client = createTrelloClient({ apiKey, token });
      const board = await client.getBoard(boardId);
      if (board) {
        setSelectedBoard(board);
      } else {
        console.error('Failed to load board from URL');
        // Redirect to board selector if board not found
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading board from URL:', error);
      navigate('/');
    } finally {
      setIsLoadingBoard(false);
    }
  };

  const handleBoardSelected = (board: TrelloBoard) => {
    setSelectedBoard(board);
    // Update URL to include board info
    const boardNameSlug = board.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    navigate(`/board/${board.id}/${boardNameSlug}`);
  };

  const handleBack = () => {
    if (selectedBoard) {
      setSelectedBoard(null);
      navigate('/');
    } else {
      logout();
      navigate('/');
    }
  };


  // Show authentication if not authenticated
  if (!isAuthenticated) {
    return <TrelloAuth />;
  }

  // Show loading if we're loading a board from URL
  if (isLoadingBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading board...</p>
        </div>
      </div>
    );
  }

  // Show board selector if authenticated but no board selected
  if (!selectedBoard) {
    return (
      <BoardSelector
        apiKey={apiKey!}
        token={token!}
        onBoardSelected={handleBoardSelected}
      />
    );
  }

  // Show swimlane view with selected board
  return (
    <SwimlaneView 
      board={selectedBoard}
      apiKey={apiKey!}
      token={token!}
      onBack={handleBack}
    />
  );
};

export default Index;
