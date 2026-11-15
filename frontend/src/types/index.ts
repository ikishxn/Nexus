export type PostCategory =
  | 'technology'
  | 'movies'
  | 'food_cooking'
  | 'fashion_style'
  | 'science'
  | 'music'
  | 'books'
  | 'business'
  | 'psychology'
  | 'history'
  | 'health'
  | 'general';

export interface Author {
  _id: string;
  username: string;
  reputationScore: number;
  totalReputation?: number;
  reputationXp?: number;
  walletBalance: number;
  badges?: string[];
}

export interface ContentPayload {
  text?: string;
  codeSnippet?: string;
  mediaUrls?: string[];
  audioNoteUrl?: string;
}

export interface Post {
  _id: string;
  author: Author;
  title: string;
  content: ContentPayload;
  category: PostCategory;
  postType?: 'post' | 'question' | 'debate';
  threadStyle?: string;
  stance?: 'affirmative' | 'negative';
  commentCount: number;
  voteScore: number;
  upvotes?: string[];
  downvotes?: string[];
  bountyAmount: number;
  bountyStatus: 'none' | 'active' | 'awarded';
  acceptedCommentId?: string | null;
  acceptedAnswer?: string | null;
  aiBotScore?: number;
  status?: string;
  targetedExpertId?: Author | string | null;
  exclusiveUntil?: string | null;
  audioNoteUrl?: string;
  createdAt: string;
  realmId?: string | null;
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: Author;
  parentId: string | null;
  body: string;
  path: string;
  depth: number;
  status: 'approved' | 'quarantined';
  isAccepted: boolean;
  createdAt: string;
  realmId?: string | null;
}

export interface CommentNode extends Comment {
  children: CommentNode[];
}

export type ChatContext =
  | { kind: 'post' | 'comment'; contextRef: string; preview: string };

export interface Realm {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  ownerId: string | { _id: string; username: string };
  memberCount: number;
  themeColor: string;
  createdAt: string;
}
