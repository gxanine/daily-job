const fs = require('fs'); //
const mammoth = require('mammoth');
const config = require('./config.json');
const scrape = require('./scrapeHtml.js');
const fileIO = require('./fileIO.js');

function writeToFile(message, filename) {
	fs.writeFile("./"+filename, message, (err) => {
		if (err) {
			return console.log(err);
		}
		console.log("The file has been written to");
	});
}
fileIO.downloadFile(config.Url, './dailyjob.docx')
	.then((filePath) => {
		mammoth.convertToHtml({path: filePath})
		.then(function(result) {
			var html = result.value;
			var messages = result.messages;
			// console.log(`${messages}`);
			// writeToFile(html);
			let jsonStr = JSON.stringify(scrape.objectifyHtml(html), null, 3);
			writeToFile(jsonStr, "job_listings.json");
		})
		.done();
	}, (err) => {
		console.log(`Could not download the file: ${error}`);
	});