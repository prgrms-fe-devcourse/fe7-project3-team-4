type Notify = {
  id: number;
  type: NotificationType;
  sender: string;
  content?: string; // 댓글 내용, 메시지 내용, 게시글 제목 등
  createdAtText: string; // "5분 전" 같은 표시용 텍스트
};

type NotificationType = "like" | "comment" | "follow" | "message";
