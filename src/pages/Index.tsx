import { SwimlaneView } from '@/components/SwimlaneView';
import { TrelloBoard } from '@/types/trello';

// Mock data that mimics Trello's API structure
const mockBoard: TrelloBoard = {
  id: 'mock-board-123',
  name: 'Product Development Workflow',
  desc: 'A comprehensive product development process from ideation to launch',
  url: 'https://trello.com/b/mock-board-123',
  prefs: {
    background: 'blue',
    backgroundColor: '#0079bf'
  }
};

const Index = () => {
  const handleBack = () => {
    // For now, just reload the page
    window.location.reload();
  };

  return (
    <SwimlaneView 
      board={mockBoard}
      apiKey="mock-api-key"
      token="mock-token"
      onBack={handleBack}
    />
  );
};

export default Index;
