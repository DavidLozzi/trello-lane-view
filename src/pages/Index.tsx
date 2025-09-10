import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloAuth } from '@/components/TrelloAuth';
import { BoardSelector } from '@/components/BoardSelector';
import { OAuthCallback } from '@/components/OAuthCallback';
import { TrelloBoard } from '@/types/trello';

const STORAGE_KEY = 'trello_credentials';

const Index = () => {
  const { boardId, boardName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [authState, setAuthState] = useState<{
    apiKey: string;
    token: string;
  } | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<TrelloBoard | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);

  // Load saved credentials on component mount
  useEffect(() => {
    console.log('=== AUTHENTICATION CHECK START ===');
    console.log('Current URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    console.log('Hash:', window.location.hash);
    console.log('Pathname:', window.location.pathname);
    console.log('Is Lovable sandbox:', window.location.origin.includes('sandbox.lovable.dev'));
    
    // Check for OAuth token in URL hash first
    const hash = window.location.hash;
    if (hash.includes('token=')) {
      console.log('✅ Found token in URL hash');
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('token');
      
      if (token) {
        console.log('✅ Token extracted successfully:', token.substring(0, 10) + '...');
        const apiKey = 'a3fda079880a6e03b474e7c434fcc79c';
        handleAuthenticated(apiKey, token);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    } else {
      console.log('❌ No token found in URL hash');
    }
    
    console.log('🔍 Checking for saved credentials...');
    const savedCredentials = localStorage.getItem(STORAGE_KEY);
    if (savedCredentials) {
      try {
        const parsed = JSON.parse(savedCredentials);
        console.log('✅ Found saved credentials, setting auth state');
        setAuthState(parsed);
      } catch (error) {
        console.log('❌ Invalid stored credentials, clearing...');
        // Clear invalid stored data
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      console.log('❌ No saved credentials found');
    }
    console.log('=== AUTHENTICATION CHECK END ===');
  }, []);

  // Load board from URL if authenticated and boardId is present
  useEffect(() => {
    if (authState && boardId && boardName && !selectedBoard && !isLoadingBoard) {
      loadBoardFromUrl();
    }
  }, [authState, boardId, boardName]);

  const loadBoardFromUrl = async () => {
    if (!authState || !boardId || !boardName) return;
    
    setIsLoadingBoard(true);
    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}?key=${authState.apiKey}&token=${authState.token}`
      );
      
      if (response.ok) {
        const board = await response.json();
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

  const handleAuthenticated = (apiKey: string, token: string) => {
    const credentials = { apiKey, token };
    setAuthState(credentials);
    // Save credentials to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
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
      // Clear credentials from localStorage when logging out
      localStorage.removeItem(STORAGE_KEY);
      setAuthState(null);
      navigate('/');
    }
  };


  // Show authentication if not authenticated
  if (!authState) {
    return <TrelloAuth onAuthenticated={handleAuthenticated} />;
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
