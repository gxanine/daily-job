const fs = require("fs-extra");
const fstream = require("fstream");
const unzip = require("unzip");
const wget = require("wget");

function downloadFile(inPath, outPath) {
	let download = wget.download(inPath, './download');
	
	download
		.on('error', (err) => {
			console.log("");
			console.log(`Could not download the file: ${err}`);
		})
		.on('end', (output) => {
			console.log("");
			unzipFile(output, outPath);
			fs.removeSync(output);
		}) 
		.on('progress', (progress) => {
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`Downloading: ${Math.round(progress * 100)}%`);
		});
}
function unzipFile(inPath, outPath) {
	if(fs.existsSync(outPath)) {
		fs.removeSync(outPath);
	}
	fs.mkdirSync(outPath);

	let readStream = fs.createReadStream(inPath);
	let writeStream = fstream.Writer(outPath);

	readStream
		.pipe(unzip.Parse())
		.pipe	(writeStream);	
}

module.exports = {
	downloadFile,
}