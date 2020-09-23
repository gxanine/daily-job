const electron = require('electron');
const {
	app,
	Menu,
	BrowserWindow,
	shell
} = require('electron')
const path = require('path');
const url = require('url');

const os = require('os');
const fs = require('fs');
const ipc = electron.ipcMain;

const mammoth = require('mammoth');
const config = require('../config.json');
const scrape = require('../lib/scrapeHtml.js');
const fileIO = require('../lib/fileIO.js');
const {
	outputFile
} = require('fs-extra');

let win;

function createWindow() {
	// Create a browser window
	win = new BrowserWindow({
		width: 650,
		height: 700,
		title: 'Daily job',
		webPreferences: {
			nodeIntegration: true
		}
	});

	// load index.html to app
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'renderer/index.html'),
		protocol: 'file:',
		slashes: true
	}));

	scrape.getTheLatestLink((link) => {
		sendObjs(link, win);
	});

	// Open the DevTools
	// win.webContents.openDevTools();

	// Emitted when the window is closed
	win.on('closed', () => {
		// Dereference window object
		win = null;
	});
}

// Called when electron has finished initialization
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

const nav = [{
		label: 'File',
		submenu: [{
				role: 'reload'
			},
			{
				type: 'separator'
			},
			{
				label: 'Quit',
				accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
				click() {
					app.quit()
				}
			},
		]
	},
	{
		label: 'Window',
		submenu: [{
			role: 'minimize'
		},
]
	},
	{
		label: 'Help',
		submenu: [{
				label: 'View on GitHub',
				click() {
					shell.openExternal("https://github.com/gilnicki/daily-job")
				}

			},
			{
				type: 'separator'
			},
			{
				label: 'Report an issue',
				click() {
					shell.openExternal("https://github.com/gilnicki/daily-job/issues/")
				}
			},
			{
				label: 'Go to Release notes',
				click() {
					shell.openExternal("https://github.com/gilnicki/daily-job/releases/")
				}
			},
		]
	}
]

const menu = Menu.buildFromTemplate(nav)
Menu.setApplicationMenu(menu)

function sendObjs(link, rendWin) {
	let newLink = link;
	if (!newLink) {
		newLink = config.Url;
	}
	let docxFile = path.join(os.tmpdir(), 'DailyJobs.doc');
	//let listingsFile = path.join(os.tmpdir(), 'job_listings.json');
	let listingsObj;
	fileIO.downloadFile(newLink, docxFile)
		.then((filePath) => {
			mammoth.convertToHtml({
					path: filePath
				})
				//mammoth.convertToHtml({path: filePath}, options)
				.then(function (result) {
					var html = result.value;
					var messages = result.messages; // Any messages, such as warnings during conversion
					console.log('\nDaily-Job(main.js) - Conversion Warnings!', messages)
					//var messages = result.messages;
					//console.log(`${messages}`);
					fileIO.writeToFile(html, "test.html");
					// let jsonStr = JSON.stringify(scrape.objectifyHtml(html), null, 3);
					// fileIO.writeToFile(jsonStr, listingsFile).then((filename) => {
					// 	});
					listingsObj = scrape.objectifyHtml(html);
					//console.log(listingsObj);
					rendWin.webContents.send('objs-ready', (listingsObj));
					console.log('\nDaily-Job(main.js) - sent');
				})
				.done();
		}, (err) => {
			rendWin.webContents.send('objs-ready-e', err);
			console.log(`Could not download the file: ${error}`);
		});
}