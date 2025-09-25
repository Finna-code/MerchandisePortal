export type ReviewDto = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  body: string;
  visibility: "public" | "hidden";
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
  };
  isOwner: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canModerate: boolean;
};

export type ReviewSummary = {
  ratingCount: number;
  ratingSum: number;
};

