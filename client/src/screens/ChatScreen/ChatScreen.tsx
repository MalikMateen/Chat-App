"use client";

import React from "react";
import io, { Socket } from "socket.io-client";
import { Message } from "./ChatScreen.types";

export const ChatScreen = React.memo(function ChatScreen() {
  const [socket, setSocket] = React.useState<Socket>();
  const [messages, setMessages] = React.useState<Message>({});
  const [inputMessage, setInputMessage] = React.useState("");
  const [room, setRoom] = React.useState("general1");
  const [typingUsers, setTypingUsers] = React.useState<string[]>([]);

  React.useEffect(() => {
    const socketInstance = io("http://localhost:3001");
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!socket) return;

    socket.emit("leave_room");
    socket.emit("join_room", room);

    socket.on("receive_message", (data) => {
      const { room, userId, message } = data;
      setMessages((prevMessages) => {
        return {
          ...prevMessages,
          [room]: [...(prevMessages[room] || []), { userId, message }],
        };
      });
    });

    socket.on("user_joined", (userId) => {
      alert(`${userId} Joined!`);
    });

    socket.on("user_left", (userId) => {
      alert(`${userId} Left!`);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_left");
    };
  }, [room, socket]);

  // React.useEffect(() => {
  //   if (!socket) return;

  //   return () => {
  //     socket.off("user_typing");
  //   };
  // }, [inputMessage, socket, typingUsers.length]);

  const handleSendMessage = React.useCallback(() => {
    if (inputMessage.trim() !== "") {
      socket?.emit("send_message", { room, message: inputMessage });
      setInputMessage("");
    }
  }, [inputMessage, room, socket]);

  const handleTyping = React.useCallback(() => {
    socket?.emit("typing");
  }, [socket]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Chat App by Muhammad Mateen</h1>
      <div>
        <select onChange={(e) => setRoom(e.target.value)}>
          <option value="general1">General 1</option>
          <option value="general2">General 2</option>
          <option value="general3">General 3</option>
        </select>
        <ul>
          {messages?.[room] &&
            messages[room].slice(-10).map((data, index) => (
              <li key={index}>
                <b>{data.userId}:</b> {data.message}
              </li>
            ))}
        </ul>
        <div>
          {typingUsers.map((userId) => (
            <p className="italic" key={userId}>
              {userId} is typing...
            </p>
          ))}
        </div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleTyping}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </main>
  );
});
