import { DISABLE_PERMISSIONS } from '$env/static/private';
import { type CampaignSnippet } from 'shared';
import { server } from './server';
import { SessionConnection } from './session';
import { ConnectionSocket } from './socket';

export class User {
	readonly connection: ConnectionSocket;

	private _accountHash?: string;
	private _sessionConnection?: SessionConnection;

	constructor(socket: ConnectionSocket) {
		this.connection = socket;
	}

	dispose() {
		console.log('dispose connection');
		this.sessionOrNull?.onLeave(this);
	}

	get accountHash() {
		return this._accountHash;
	}

	get loggedInAccountHash() {
		if (!this._accountHash) throw 'Not logged in';

		return this._accountHash;
	}

	get isLoggedIn() {
		return this._accountHash !== undefined;
	}

	get sessionConnection() {
		if (!this._sessionConnection) throw 'Not in a session';

		return this._sessionConnection!;
	}

	get sessionConnectionAsOwner() {
		const result = this.sessionConnection;

		if (DISABLE_PERMISSIONS) return result;
		if (!result.session.isOwner(this)) throw 'Not in a session as GM';

		return result;
	}

	get sessionOrNull() {
		return this._sessionConnection?.session;
	}

	get session() {
		return this.sessionConnection.session;
	}

	get sessionAsOwner() {
		return this.sessionConnectionAsOwner.session;
	}

	onLogIn(accountHash: string) {
		this._accountHash = accountHash;
	}

	async enterSession(campaignId: string): Promise<CampaignSnippet> {
		const session = await server.sessionManager.enterSession(campaignId, this);
		this._sessionConnection = new SessionConnection(session);

		const campaign = await session.loadSnippetFor(this);

		return campaign;
	}
}
