import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import { SelectAsset, type AssetSnippet } from 'shared';
import { prisma, server } from './server';
import { generateUniqueString } from './util/generate-string';

type PartialAsset = Pick<AssetSnippet, 'path'>;

export class AssetManager {
	readonly rootDirFromFrontend: string = '/user-media';
	readonly rootDirFromBackend: string = `./static${this.rootDirFromFrontend}`;

	constructor() {
		this.createStaticDirectory();
	}

	private async createStaticDirectory() {
		await fs.mkdir(this.rootDirFromBackend, { recursive: true });
	}

	async getPathToAsset(assetId: string, { accessibleByFrontend = false }) {
		const asset = await prisma.asset.findFirstOrThrow({
			where: {
				id: assetId
			}
		});

		return this.getPathToFile(asset.path, accessibleByFrontend);
	}

	private getPathToFile(fileName: string, accessibleByFrontend = false) {
		const root = accessibleByFrontend ? this.rootDirFromFrontend : this.rootDirFromBackend;

		return `${root}/${fileName}`;
	}

	async uploadAsset(campaignId: string, request: Request): Promise<AssetSnippet> {
		const contentType = request.headers.get('Content-Type');

		if (!contentType) {
			throw 'Asset upload failed because Content-Type header is not set';
		}

		const fileExtension = mime.extension(contentType);
		if (!fileExtension) {
			throw 'Asset upload failed because MIME type could not be recognized';
		}

		const fileName = await generateUniqueString({
			length: 8,
			map: (id) => `${id}.${fileExtension}`,
			doesExist: async (fileName) => {
				try {
					const pathToAsset = this.getPathToFile(fileName);
					await fs.access(pathToAsset);
					return true;
				} catch {
					return false;
				}
			}
		});

		const buffer = await request.arrayBuffer();

		const systemPath = this.getPathToFile(fileName);
		await fs.writeFile(systemPath, new Uint8Array(buffer));

		const storedAsset = await prisma.asset.create({
			data: {
				campaignId: campaignId,
				mimeType: contentType,
				path: fileName
			},
			select: SelectAsset
		});

		const campaignSession = server.sessionManager.findSession(campaignId);
		campaignSession?.broadcastMessage('assetCreate', {
			asset: storedAsset
		});

		console.log('Created asset ' + fileName);
		return storedAsset;
	}

	async deleteIfUnused(assetId: string) {
		const asset = await prisma.asset.findUniqueOrThrow({
			where: { id: assetId },
			select: {
				_count: true,
				path: true
			}
		});

		const usageCountByType = Object.values(asset._count);
		const totalUsageCount = usageCountByType.reduce(
			(total, countForType) => total + countForType,
			0
		);

		if (totalUsageCount === 0) {
			await prisma.asset.delete({
				where: { id: assetId }
			});
			await this.disposeAsset(asset);
		}
	}

	async disposeAsset(asset: PartialAsset) {
		const filePath = this.getPathToFile(asset.path);
		await fs.unlink(filePath);
	}

	async disposeAssetsInBatch(assets: PartialAsset[]) {
		await Promise.allSettled(assets.map((asset) => this.disposeAsset(asset)));
	}
}
