import { NotificationItem } from "@/components/notify/NotificationItem";

const MOCK_NOTIFICATIONS: Notify[] = [
  {
    id: 1,
    type: "like",
    sender: "사람1",
    content: "좋아요를 누른 게시글의 제목",
    createdAtText: "5분 전",
  },
  {
    id: 2,
    type: "comment",
    sender: "다른 사람",
    content: "그 사람이 남긴 댓글 내용",
    createdAtText: "12분 전",
  },
  {
    id: 3,
    type: "follow",
    sender: "다른 사람",
    createdAtText: "1시간 전",
  },
  {
    id: 4,
    type: "message",
    sender: "다른 사람",
    content: "DM 내용 일부를 여기에 미리보기로 보여줍니다.",
    createdAtText: "2시간 전",
  },
];

export default function Page() {
  return (
    <>
      <div className="mt-6 space-y-6">
        {/* 상단 */}
        <div className="flex justify-between items-center">
          <h3 className="ml-2 text-xl font-semibold">알림 목록</h3>
          <button className="cursor-pointer leading-none border-b text-[#717182]">
            알림 삭제
          </button>
        </div>

        {/* 알림 목록 */}
        <div className="space-y-4">
          {MOCK_NOTIFICATIONS.map((n) => (
            <NotificationItem key={n.id} data={n} />
          ))}
        </div>
      </div>
    </>
  );
}
