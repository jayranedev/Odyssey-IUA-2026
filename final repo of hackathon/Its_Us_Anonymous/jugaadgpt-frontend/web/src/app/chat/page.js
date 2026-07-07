import { Suspense } from 'react';
import { ChatScreen } from '@/components/ChatScreen';

export default function Chat() {
  return (
    <Suspense>
      <ChatScreen />
    </Suspense>
  );
}
