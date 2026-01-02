import { useChatContext } from "@/contexts/chat-context";
import { ChatWindow } from "./chat-window";

export function ChatContainer() {
  const { openChats } = useChatContext();

  return (
    <>
      {openChats.map((chat, index) => (
        <ChatWindow
          key={chat.partnerId}
          partnerId={chat.partnerId}
          partner={chat.partner}
          minimized={chat.minimized}
          position={index}
        />
      ))}
    </>
  );
}
