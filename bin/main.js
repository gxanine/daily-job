const electron = require('electron');
// const app = electron.app;
// const BrowserWindow = electron.BrowserWindow;
const {app, Menu, BrowserWindow} = require('electron')
const path = require('path');
const url = require('url');

const os = require('os');
const fs = require('fs');
const ipc = electron.ipcMain;

const mammoth = require('mammoth');
const config = require('../config.json');
const scrape = require('../lib/scrapeHtml.js');
const fileIO = require('../lib/fileIO.js');

let win;
function createWindow() {
	// Create a browser window
	win = new BrowserWindow({
		width: 650,
		height: 700,
		title: 'Daily job'
	});

	// load index.html to app
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'renderer/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	sendObjs(win);

	// Open the DevTools
	// win.webContents.openDevTools();

	// Emitted when the window is closed
	win.on('closed', () => {
		// Dereference window object
		win = null;
	});
}

// Called when electron has finished initialisation
app.on('ready', createWindow);

// Quit when all windows closed
app.on('window-all-closed', () => {
	// Quit only if not macOS
	// if (process.platform !== 'darwin') {
		app.quit();
	// }
});

// Called when app is active (duh!)
app.on('activate', () => {
	// Create a window if there is none
	if (win === null) {
		createWindow();
	}
});

const nav = [
	{
		label: 'File',
		submenu: [
		{
			label: 'Quit',
			accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
			click(){app.quit()}
		}
		]
	}]
const menu = Menu.buildFromTemplate(nav)
Menu.setApplicationMenu(menu)

function sendObjs(rendWin) {
	let docxFile = path.join(os.tmpdir(), 'dailyjobs.docx');
	let listingsFile = path.join(os.tmpdir(), 'job_listings.json');
	let listingsObj;
	fileIO.downloadFile(config.Url, docxFile)
		.then((filePath) => {
			mammoth.convertToHtml({path: filePath})
			.then(function(result) {
				var html = result.value;
				var messages = result.messages;
				// console.log(`${messages}`);
				// fileIO.writeToFile(html, "test.html");
				// let jsonStr = JSON.stringify(scrape.objectifyHtml(html), null, 3);
				// fileIO.writeToFile(jsonStr, listingsFile).then((filename) => {

				// 	});
				console.log('sent');
				listingsObj = scrape.objectifyHtml(html);
				// console.log(listingsObj);
				rendWin.webContents.send('objs-ready', (listingsObj));

			})
			.done();
		}, (err) => {
			console.log(`Could not download the file: ${error}`);
		});
}