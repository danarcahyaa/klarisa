import { Suspense } from "react";
import ChatAI from "@/components/draf/chat-ai/chat-ai";

export default function CreateContractPage() {
  return (
    <div className="w-full max-w-full min-h-svh flex flex-col overflow-x-clip">
      <Suspense fallback={null}>
        <ChatAI />
      </Suspense>
    </div>
  );
}
