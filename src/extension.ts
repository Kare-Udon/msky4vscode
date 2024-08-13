import * as vscode from 'vscode';
import { ListeningEvents, ViewProvider } from './ViewProvider.js';
import * as Misskey from 'misskey-js';
import WebSocket from "ws";
import fetch from 'node-fetch';

let client: Misskey.api.APIClient | undefined;
let stream: Misskey.Stream | undefined;
let channel: Misskey.ChannelConnection | undefined;

export function activate(context: vscode.ExtensionContext): void {
	const viewProvider = new ViewProvider(context.extensionUri);

	viewProvider.on('load', async () => {
		const server = context.globalState.get('server');
		const accessToken = context.globalState.get('accessToken');
		if (typeof server === 'string' && typeof accessToken === 'string') {
			try {
				await connectStream({ server, accessToken }, viewProvider);
			} catch (error) {
				viewProvider.emit('loggedin', { avatarUrl: '', host: server });
				viewProvider.emit('error', error);
			}
		} else {
			disconnectStream(viewProvider);
		}
	});
	viewProvider.onVisibilityChanged((visibliity) => {
		if (!visibliity) {
			disconnectStream(viewProvider);
		}
	});
	viewProvider.on('login', async (inputs) => {
		try {
			await connectStream(inputs, viewProvider);
		} catch (error) {
			viewProvider.emit('loggedin-error', error);
			return;
		}
		context.globalState.update('server', inputs.server);
		context.globalState.update('accessToken', inputs.accessToken);
	});
	viewProvider.on('logout', () => {
		disconnectStream(viewProvider);
		context.globalState.update('server', undefined);
		context.globalState.update('accessToken', undefined);
	});
	viewProvider.on('note', async (inputs) => {
		try {
			if (client === undefined) {
				return;
			}
			// check if content is null
			if (inputs.content === '') {
				vscode.window.showErrorMessage("Content is null, you should write something before making a post.");
				return;
			}
			// extract Markdown image from content and send the images
			let img_re = /!\[\]\((.*)\)/gm;
			const img_match = inputs.content.matchAll(img_re);

			img_re = /(!\[\]\(.*\))/gm;
			inputs.content = inputs.content.replace(img_re, '');

			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Sending note...",
			}, async (progress, token) => {
				progress.report({ increment: 0 });

				let img_urls: string[] = [];
				for (const match of img_match) {
					img_urls.push(match[1]);
				}

				// keep img_urls unique
				img_urls = [...new Set(img_urls)];

				let img_ids: string[] = [];
				for (const [index, img_url] of img_urls.entries()) {
					progress.report({ increment: 90 / img_urls.length, message: "Uploading image: " + index + "/" + img_urls.length + "..." });
					// upload image
					const img_id = await uploadImage(img_url, viewProvider);
					if (img_id !== undefined) {
						img_ids.push(img_id);
					}
				}

				// keep img_ids unique
				img_ids = [...new Set(img_ids)];

				await client?.request('notes/create', {
					text: inputs.content,
					visibility: inputs.visiability,
					...(img_ids.length > 0 && { fileIds: img_ids }),
				});

				progress.report({ increment: 10, message: "Note sent!" });
			});

			viewProvider.emit('noted');
		} catch (error) {
			viewProvider.emit('noted-error', error);
		}
	});

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'msky4vscode.view',
			viewProvider,
		)
	);
}

async function connectStream(inputs: ListeningEvents['login']['inputs'], viewProvider: ViewProvider): Promise<void> {
	client = new Misskey.api.APIClient({
		origin: `https://${inputs.server}`,
		credential: inputs.accessToken,
		fetch,
	});
	viewProvider.emit('loggedin', {
		avatarUrl: (await client.request('i')).avatarUrl,
		host: inputs.server,
	});

	channel?.dispose();
	stream?.close();
	try {
		(await client.request('notes/timeline', { limit: 100 }))
			.reverse()
			.forEach((note) => viewProvider.emit('note', note));
	} catch (error) {
		viewProvider.emit('error', error);
	}
	stream = new Misskey.Stream(
		`https://${inputs.server}`,
		{ token: inputs.accessToken },
		{ WebSocket }
	);
	channel = stream.useChannel('homeTimeline');
	channel.on('note', (note) => viewProvider.emit('note', note));
};

export function deactivate(): void {
	disconnectStream();
}

function disconnectStream(viewProvider?: ViewProvider): void {
	channel?.dispose();
	channel = undefined;
	stream?.close();
	stream = undefined;
	client = undefined;
	viewProvider?.emit('loggedout');
}

async function uploadImage(local_url: string, viewProvider: ViewProvider): Promise<string | undefined> {
	try {
		// read image to buffer
		const image = await vscode.workspace.fs.readFile(vscode.Uri.file(local_url));
		// get image md5
		const crypto = require('crypto');
		const img_md5: string = crypto.createHash('md5').update(image).digest('hex');
		// check if image exists
		const res = await client?.request('drive/files/check-existence', {
			md5: img_md5,
		});
		if (res as unknown as boolean) {
			// if exists, request to get file id
			const res = await client?.request('drive/files/find-by-hash', {
				md5: img_md5,
			});
			// TODO: fix the type
			return (res as any)[0].id;
		} else {
			// if not exists, upload image
			const path = require("path");
			const FormData = require('form-data');
			const axios = require('axios');
			const form = new FormData();
			form.append("name", path.basename(local_url));
			form.append("file", image);

			axios.defaults.headers.common['Authorization'] = `Bearer ${client?.credential}`;
			const res = await axios.post(client?.origin + "/api/drive/files/create", form, {
				...form.getHeaders()
			});
			return res.data.id;
		}
	}
	catch (error) {
		viewProvider.emit('noted-error', error);
	}
}
