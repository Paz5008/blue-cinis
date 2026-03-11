import { useChat } from '@ai-sdk/react';
export default function Test() {
  const result = useChat();
  console.log("Keys in browser:", Object.keys(result));
  return null;
}
