export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  prefs: {
    background: string;
    backgroundColor: string;
    backgroundImage?: string;
  };
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
  closed: boolean;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  pos: number;
  due: string | null;
  dateLastActivity: string;
  movedToCurrentListDate?: string;
  closed: boolean;
  labels: TrelloLabel[];
  list: {
    id: string;
    name: string;
  };
  url: string;
  cover?: {
    color: string;
    brightness: string;
  };
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloMember {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string;
}

export interface CardProgress {
  card: TrelloCard;
  currentListIndex: number;
  totalLists: number;
  completedLists: string[];
  currentList: string;
  remainingLists: string[];
}