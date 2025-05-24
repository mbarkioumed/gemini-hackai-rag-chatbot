import { CoreMessage } from "ai";
import { notFound } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { Chat } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = params;
    const chatFromDb = await getChatById({ id });

    if (!chatFromDb) {
        notFound();
    }

    let parsedCoreMessages: Array<CoreMessage> = [];
    try {
        if (chatFromDb.messages && typeof chatFromDb.messages === "string") {
            parsedCoreMessages = JSON.parse(chatFromDb.messages as string);
        } else if (Array.isArray(chatFromDb.messages)) {
            // Should not happen if DB stores as JSON, but good for robustness
            parsedCoreMessages = chatFromDb.messages as Array<CoreMessage>;
        }
        // Ensure it's an array
        if (!Array.isArray(parsedCoreMessages)) {
            console.warn(
                `Messages for chat ${id} did not parse to an array:`,
                parsedCoreMessages
            );
            parsedCoreMessages = [];
        }
    } catch (error) {
        console.error(`Error parsing messages for chat ${id}:`, error);
        // Fallback to an empty array or handle error as appropriate
        parsedCoreMessages = [];
    }

    // type casting and converting messages to UI messages
    const chat: Chat = {
        ...chatFromDb,
        // messages: convertToUIMessages(chatFromDb.messages as Array<CoreMessage>),
        messages: convertToUIMessages(parsedCoreMessages),
    };

    const session = await auth();

    if (!session || !session.user) {
        notFound();
    }

    if (session.user.id !== chat.userId) {
        notFound();
    }

    return <PreviewChat id={chat.id} initialMessages={chat.messages} />;
}
