import { DISABLE_PERMISSIONS } from '$env/static/private';
import {
	SelectBoard,
	SelectCampaign,
	type OptionalForwarded,
	type Payload,
	type ServerHandledMessages,
	type ServerSentMessages
} from 'shared';
import { prisma, server } from './server';
import { SessionGarbage } from './session-garbage';
import type { User } from './user';

export class SessionManager {
	private readonly openSessions = new Map<string, CampaignSession>();

	async enterSession(campaignId: string, user: User): Promise<CampaignSession> {
		const campaignSession = this.findSession(campaignId);

		if (campaignSession) {
			campaignSession.onJoin(user);
			return campaignSession;
		} else {
			const newSession = await CampaignSession.load(user, campaignId);
			this.openSessions.set(campaignId, newSession);
			return newSession;
		}
	}

	onSessionClosed(session: CampaignSession) {
		this.openSessions.delete(session.campaignId);
	}

	findSession(campaignId: string): CampaignSession | undefined {
		return this.openSessions.get(campaignId);
	}
}

export class CampaignSession {
	readonly garbage = new SessionGarbage();
	readonly campaignId: string;
	private readonly campaignOwnerEmail: string;

	users: User[] = [];
	host: User | null;

	constructor(hostedBy: User, campaignId: string, campaignOwnerEmail: string) {
		this.host = hostedBy;

		this.campaignId = campaignId;
		this.campaignOwnerEmail = campaignOwnerEmail;

		this.onJoin(hostedBy);
	}

	static async load(hostedBy: User, campaignId: string) {
		if (!hostedBy.accountHash) {
			if (!DISABLE_PERMISSIONS) throw 'Not logged in';
		}

		const { ownerEmail } = await prisma.campaign.findUniqueOrThrow({
			where: { id: campaignId },
			select: { ownerEmail: true }
		});

		if (hostedBy.accountHash !== ownerEmail) {
			if (!DISABLE_PERMISSIONS) throw 'Campaign is not owned by the hosting account';
		}

		return new CampaignSession(hostedBy, campaignId, ownerEmail);
	}

	broadcastMessage<T extends keyof ServerSentMessages>(
		message: T,
		payload: Payload<ServerSentMessages, T> | OptionalForwarded<ServerHandledMessages, T>
	) {
		for (const user of this.users) {
			user.connection.send(message, payload);
		}
	}

	getPeerUsersOf(user: User) {
		return this.users.filter((peer) => peer != user);
	}

	async loadSnippetFor(user: User) {
		const campaign = await prisma.campaign.findUniqueOrThrow({
			where: { id: this.campaignId },
			select: SelectCampaign
		});

		if (this.isOwner(user)) {
			// Keep deletion-marked token templates from getting sent to the client
			campaign.templates = campaign.templates.filter(
				(tokenTemplate) => !this.garbage.tokenTemplates.isMarkedForDeletion(tokenTemplate.id)
			);
		}

		user.sessionConnection.visibleBoardIdOrNull = campaign.selectedBoardId;

		if (!campaign.selectedBoardId) {
			return campaign;
		}

		const visibleBoard = await prisma.board.findUniqueOrThrow({
			where: { id: campaign.selectedBoardId },
			select: SelectBoard
		});

		return {
			...campaign,
			selectedBoard: visibleBoard
		};
	}

	onJoin(user: User) {
		this.users.push(user);
		console.log('User joined');

		if (user.accountHash && this.campaignOwnerEmail === user.accountHash) {
			this.host = user;
		}
	}

	onLeave(disconnectedUser: User) {
		if (disconnectedUser == this.host) {
			this.host = null;
		}

		this.users = this.users.filter((user) => user != disconnectedUser);
		console.log('User left');

		if (this.users.length === 0) {
			this.dispose();
		}
	}

	private async dispose() {
		server.sessionManager.onSessionClosed(this);

		this.garbage.purge();
	}

	isOwner(user: User): boolean {
		return this.host != null && this.host == user;
	}
}

export class SessionConnection {
	visibleBoardIdOrNull: string | null = null;

	constructor(readonly session: CampaignSession) {}

	get visibleBoardId() {
		if (!this.visibleBoardIdOrNull) throw 'Not on any board';

		return this.visibleBoardIdOrNull!;
	}
}
