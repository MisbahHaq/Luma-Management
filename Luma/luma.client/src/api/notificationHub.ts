import {
    HubConnection,
    HubConnectionBuilder,
    LogLevel,
} from '@microsoft/signalr';
import type { Notification } from '../types/types';

type NotificationHandler = (notification: Notification) => void;

class NotificationHubClient {
    private connection: HubConnection | null = null;
    private handlers = new Set<NotificationHandler>();
    private started = false;

    async start(token: string): Promise<void> {
        if (this.started) {
            return;
        }
        this.started = true;

        this.connection = new HubConnectionBuilder()
            .withUrl('/hubs/notifications', {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build();

        this.connection.on('ReceiveNotification', (payload: Notification) => {
            this.handlers.forEach((h) => h(payload));
        });

        try {
            await this.connection.start();
        } catch {
            this.started = false;
        }
    }

    onNotification(handler: NotificationHandler): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    async stop(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
        this.started = false;
        this.handlers.clear();
    }
}

export const notificationHub = new NotificationHubClient();
