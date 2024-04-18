"use client"

import React from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export const ChatScreen = React.memo(function ChatScreen() {
    const [messages, setMessages] = React.useState<any[]>([]);
    const [inputMessage, setInputMessage] = React.useState('');
    const [room, setRoom] = React.useState('general');
    const [typingUsers, setTypingUsers] = React.useState<any[]>([]);

    console.log('messages: ',messages)
  
    React.useEffect(() => {
      // Join default room when component mounts
      socket.emit('joinRoom', room);
  
      // Listen for incoming messages
      socket.on('message', (message) => {
        console.log('message: ',message)
        setMessages((prevMessages) => [...prevMessages, message]);
      });
  
      // Listen for typing indicator
      socket.on('userTyping', (userId) => {
        setTypingUsers((prevTypingUsers) => {
          if (!prevTypingUsers.includes(userId)) {
            return [...prevTypingUsers, userId];
          }
          return prevTypingUsers;
        });
      });
  
      // Clean up event listeners
      return () => {
        socket.disconnect();
      };
    }, [room]);
  
    const handleSendMessage = React.useCallback(() => {
      if (inputMessage.trim() !== '') {
        socket.emit('sendMessage', { room, message: inputMessage });
        setInputMessage('');
      }
    },[inputMessage, room]);
  
    const handleTyping = () => {
      socket.emit('typing');
    };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
       <h1>Chat App by Muhammad Mateen</h1>
      <div>
        <select onChange={(e) => setRoom(e.target.value)}>
          <option value="general">General</option>
          <option value="random">Random</option>
          {/* Add more rooms here */}
        </select>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
        <div>
          {typingUsers.map((userId) => (
            <p key={userId}>User {userId} is typing...</p>
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