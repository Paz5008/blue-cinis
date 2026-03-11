const { useChat } = require('@ai-sdk/react');

// Mock React
const React = require('react');
React.useRef = (v) => ({ current: v });
React.useCallback = (fn) => fn;
React.useSyncExternalStore = (sub, get) => get();
React.useEffect = () => {};

try {
  const result = useChat();
  console.log("Keys returned by useChat():");
  console.log(Object.keys(result));
} catch (err) {
  console.error(err);
}
