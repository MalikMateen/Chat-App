"use client";

import React, { ChangeEvent } from "react";
import io, { Socket } from "socket.io-client";
import { GroupMessage, Typing } from "./ChatScreen.types";

export const ChatScreen = React.memo(function ChatScreen() {
  const [socket, setSocket] = React.useState<Socket>();
  const [groupMessages, setGroupMessages] = React.useState<GroupMessage>({});
  const [inputGroupMessage, setInputGroupMessage] = React.useState<string>("");
  const [selectedRoom, setSelectedRoom] = React.useState<string>("general1");
  const [groupTypingUsers, setGroupTypingUsers] = React.useState<Typing>({});

  React.useEffect(() => {
    const socketInstance = io("http://localhost:3001");
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!socket) return;

    socket.emit("leave_group_room");
    socket.emit("join_group_room", selectedRoom);

    socket.on("receive_message", (data) => {
      const { roomId, userId, message } = data;
      setGroupMessages((prevMessages) => {
        return {
          ...prevMessages,
          [roomId]: [...(prevMessages[roomId] || []), { userId, message }],
        };
      });
      setGroupTypingUsers((prevTypingUsers) => {
        return {
          ...prevTypingUsers,
          [roomId]: prevTypingUsers[roomId]?.filter((user) => user !== userId),
        };
      });
    });

    socket.on("user_joined_group", (data) => {
      const { userId, roomId } = data;
      alert(`${userId} Joined ${roomId}!`);
    });

    socket.on("user_left_group", (data) => {
      const { userId, roomId } = data;
      alert(`${userId} Left ${roomId}!`);
    });

    return () => {
      socket.off("leave_group_room");
      socket.off("join_group_room");
      socket.off("receive_message");
      socket.off("user_joined_group");
      socket.off("user_left_group");
    };
  }, [selectedRoom, socket]);

  React.useEffect(() => {
    if (!socket) return;

    socket.on("group_typing", (data) => {
      const { userId, roomId, message } = data;
      if (message) {
        const typingUsersList = groupTypingUsers[roomId];
        if (!typingUsersList?.includes(userId)) {
          setGroupTypingUsers((prevTypingUsers) => {
            return {
              ...prevTypingUsers,
              [roomId]: [...(prevTypingUsers[roomId] || []), userId],
            };
          });
        }
      } else {
        const typingUsersList = groupTypingUsers[roomId];
        const updatedTypingUsersList = typingUsersList?.filter(
          (id) => id !== userId
        );
        setGroupTypingUsers((prevTypingUsers: any) => {
          return {
            ...prevTypingUsers,
            [roomId]: [...updatedTypingUsersList],
          };
        });
      }
    });

    return () => {
      socket.off("group_typing");
    };
  }, [groupTypingUsers, socket]);

  const handleSendMessage = React.useCallback(() => {
    if (inputGroupMessage.trim() !== "") {
      socket?.emit("send_message_to_room", {
        room: selectedRoom,
        message: inputGroupMessage,
      });
      setInputGroupMessage("");
    }
  }, [inputGroupMessage, selectedRoom, socket]);

  const handleInputChange = React.useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const message = e.target.value;
      setInputGroupMessage(message);
      socket?.emit("typing_in_room", { room: selectedRoom, message });
    },
    [socket, selectedRoom]
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>
        <b>Chat App by Muhammad Mateen</b>
      </h1>
      <h2>
        <b>Your ID: </b>
        {socket?.id}
      </h2>
      <div>
        <select onChange={(e) => setSelectedRoom(e.target.value)}>
          <option value="general1">General 1</option>
          <option value="general2">General 2</option>
          <option value="general3">General 3</option>
        </select>
        <ul>
          {groupMessages?.[selectedRoom] &&
            groupMessages[selectedRoom].slice(-10).map((data, index) => (
              <li key={index}>
                <b>{`${data.userId === socket?.id ? "You" : data.userId}`}:</b>{" "}
                {data.message}
              </li>
            ))}
        </ul>
        <div>
          {groupTypingUsers?.[selectedRoom] &&
            groupTypingUsers[selectedRoom].map((userId) => (
              <p className="italic" key={userId}>
                {userId} is typing...
              </p>
            ))}
        </div>
        <input
          type="text"
          value={inputGroupMessage}
          onChange={handleInputChange}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </main>
  );
});
