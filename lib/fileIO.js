const fs = require("fs-extra");
const fstream = require("fstream");
// const unzip = require("unzip");
const wget = require("wget");

function downloadFile(inPath, outPath) {
	let download = wget.download(inPath, outPath);
	return new Promise((resolve, reject) => {
		download
			.on('error', (err) => {
				console.log("");
				console.log(`Could not download the file: ${err}`);
				reject(err);
			})
			.on('end', (output) => {

				console.log(`\nFile downloaded to ${output}`);
					resolve(output);
				// fs.removeSync(output);
			}) 
			.on('progress', (progress) => {
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write(`Downloading: ${Math.round(progress * 100)}%`);
			});
	});

}

function writeToFile(message, filename) {
	return new Promise((resolve, reject) => {
	fs.writeFile(filename, message, (err) => {
		
			if (err) {
				console.log(err);
				reject(err);
			}
			console.log("The file has been written to");
			resolve(filename);
		});
	});
}

module.exports = {
	downloadFile,
	writeToFile
}