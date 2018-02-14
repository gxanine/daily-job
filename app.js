const textract = require('textract');
const config = require('./config.json');


console.log(config.Url);

let data;
let textConfig = {
	"preserveLineBreaks": "true"
};
textract.fromUrl(config.Url, textConfig, (error, text) => {
	if (error) {
		console.Log(`Could not read the file: ${error}`);
	} else {
		console.log(text)
	}
});

if (data) {
	console.log(data);
}