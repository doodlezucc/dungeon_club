import { derived, readable } from 'svelte/store';
import { accountState } from '../state';

interface RequestOptions {
	params?: Record<string, string>;
}

interface RequestOptionsWithBody extends RequestOptions {
	body?: {
		data: BodyInit;
		contentType: string;
	};
}

export class RestConnection {
	static readonly instance = new RestConnection();

	private readonly _accessToken = derived(accountState, (acc) => acc?.accessToken);
	private accessToken: string | undefined;

	constructor() {
		this._accessToken.subscribe((token) => (this.accessToken = token));
	}

	private static pathTo(endpoint: string, params?: Record<string, string>): string {
		const endpointPath = `/api/v1${endpoint}`;
		let path = endpointPath;

		if (params) {
			path += '?' + new URLSearchParams(params).toString();
		}

		return path;
	}

	private async request(method: string, endpoint: string, options: RequestOptionsWithBody = {}) {
		const { params, body } = options;

		const headers: HeadersInit = {};

		if (this.accessToken) {
			headers['Authorization'] = 'Bearer ' + this.accessToken;
		}

		if (body) {
			headers['Content-Type'] = body.contentType;
		}

		const path = RestConnection.pathTo(endpoint, params);
		const response = await fetch(path, {
			method,
			headers,
			credentials: 'include',
			body: body?.data
		});

		if (response.status >= 400) {
			throw `REST Error ${response.status}: ${response.statusText}`;
		}

		return await response.json();
	}

	get(endpoint: string, options?: RequestOptions) {
		return this.request('GET', endpoint, options);
	}

	post(endpoint: string, options?: RequestOptionsWithBody) {
		return this.request('POST', endpoint, options);
	}

	async postFile(endpoint: string, file: File, options?: RequestOptions) {
		return await this.post(endpoint, {
			...options,
			body: {
				contentType: file.type,
				data: await file.arrayBuffer()
			}
		});
	}
}

export const rest = readable(RestConnection.instance);
