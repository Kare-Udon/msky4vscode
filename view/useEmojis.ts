import { useSyncExternalStore } from "react";
import { EmittingEvents } from "../src/ViewProvider";

export function useEmojis() {
    return useSyncExternalStore(subscribe, getSnapshot);
}

let emojis: EmittingEvents['loaded_emoji']['message'][] = [];

type Event = MessageEvent<{ eventType: keyof EmittingEvents, message: unknown }>;
type EmojisEvent = MessageEvent<{ eventType: 'loaded_emoji', message: EmittingEvents['loaded_emoji']['message'] }>;

function subscribe(callback: () => void): () => void {
    const extentionMessageListener = (event: Event): void => {
        if (((event: Event): event is EmojisEvent => event.data.eventType === 'loaded_emoji')(event)) {
            emojis = event.data.message.emojis;
            callback();
        } else if (event.data.eventType === 'loggedout') {
            emojis = [];
            callback();
        }
    };
    window.addEventListener('message', extentionMessageListener);
    // unsubscribe
    return () => {
        window.removeEventListener('message', extentionMessageListener);
    };
}

function getSnapshot() {
    return emojis;
}
