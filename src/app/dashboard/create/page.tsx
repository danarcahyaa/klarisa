import { Suspense } from "react";
import ChatAI from "@/components/draf/chat-ai/chat-ai";

export default function CreateContractPage() {
  return (
    <div className="w-full max-w-full h-full flex flex-col min-h-0 overflow-hidden">
      <Suspense fallback={null}>
        <ChatAI />
      </Suspense>
    </div>
  );
}
