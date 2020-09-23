const cheerio = require('cheerio'); // core module for html scrapping
const request = require("request"); // module for sending web requests
const config = require('../config.json');

// Start ------ Constructor functions
function Category(name) {
	this.name = name;
	this.items = [];
	this.addItem = function (item) {
		this.items.push(item);
	}
}

function Item(title, link) {
	this.title = title;
	this.link = link;
}

function Link(href, text) {
	this.href = href;
	this.text = text
}
// End ------ Contructor functions

function objectifyHtml(html) {
	console.log('Loading cheerio object...');
	let $ = cheerio.load(html); // main cheerio object
	let objectified = []; // array of Catergory objects
	let objectIndex = 0;

	console.log('Removing all images...');
	// Remove all img tags as they are redundant
	$('img').remove();

	// Keep track of the first and the last headers so they can be later used
	// as range to get the right amount of paragraphs
	let firstHeader = $(findRange($)[0]);
	let lastHeader = $(findRange($)[1]);
	// Add classes to the headers so they can be easily found with cheerio
	firstHeader.addClass('first')
	lastHeader.addClass('last')

	// Keep track of all siblings (of the first header)
	// that are located above the last header
	let all = firstHeader.nextUntil('.last');

	console.log('Adding the first title...');
	// First title has to be added seperately as the iteration
	// start a sibling after it
	objectified[objectIndex] = new Category($($('.category')[objectIndex]).text()); // Get first category name

	console.log('Iteration through all siblings of the first header...');
	//console.log(all);

	let isNextCategory = false;
	// Iterate through all siblings of the first header
	$(all).each(function () {
		//console.log('Loop...');
		let isItem = true; // Just a flag for checking if current element is title or item

		// Get the text value of the current html tag and clean it up
		let text = $(this).text().toLowerCase().replace(/[\s\t]/g, '');

		let textRaw = $(this).contents().filter(function() {
							return this.type === 'text';
						}).text(); // Display the text without cleaning it up

		let containsText = text !== '' ? true : false; // Display the text without cleaning it up

		textRaw = textRaw.replace(/\s+$/g, ''); // Get rid of whitespece at the end of string

		if (isNextCategory) console.log('---------' + $(this).text());

		let link = []; // Create an array for Link objects
		// Check if it's a paragraph tag which means it's an 'item'(Item()) ('adminstration' is an exception)
		if (!isNextCategory && $(this).is('p') && text != "administration" && textRaw && textRaw.length > 0) { 
			// This had to be hardcoded beacuse the .docx file formatting is so poor that not every title is formatted the same way.
			$(this).children().each(function () {
				// Seperate data from 'a' tag
				if ($(this).text() && $(this).text().length > 1) {
					link['href'] = $(this).attr('href')
					link['text'] = $(this).text();
				}
			});
			$(this).addClass('item');
			if (!textRaw) { textRaw = 'NULL';}
			if (!link['text']) { link['text'] = 'NO LINK'; link['href'] = 'https://google.com';}
			
			
			//let lastTextIndex = textRaw.length - link['text'].length - 1; // Index start at 0
			//textRaw = textRaw.substring(0, lastTextIndex); // Get rid of link['text']
			//textRaw = textRaw.replace(/\s+$/g, ''); // Get rid of whitespece at the end of string

			// Add the current object as an Item on the current object-index
			objectified[objectIndex].addItem(new Item(textRaw, new Link(link['href'], link['text'])));
		} 
		if (isNextCategory) { // otherwise it means it's a title (Category())
			$(this).addClass('category');
			objectIndex++; // Increase object-index for a new object entry
			let categoryTitle = $($('.category')[objectIndex]).text().replace(/[\t]/g, ''); // Get and clean up category title
			objectified[objectIndex] = new Category(categoryTitle); // Add the current object to the main array
		}

		isNextCategory = !containsText // If there is no text then the next tag is a category title
	});
	return objectified;
}

// Find and return range (first and last header).
// elements in this range are pure job listings and category titles
function findRange($) {
	const elements = [];
	let i = 0;
	let firstHeader = null;
	let lastHeader = null;

	$('strong').each(function (indexOfElement, elem) {
		let text = $(this).text().toLowerCase().replace(/[\s\t]/g, '');
		let current = $(this);

		console.log(`Finding range... Current text: '${text}'`);
		switch (text) {
			case "retail,hospitality&administration":
				current.addClass('category')
				firstHeader = current.parent();
				console.log('found firstHeader', firstHeader);

				break;
			case "internetjobsearch":
				lastHeader = current.parent();
				console.log('found lastHeader', lastHeader);
				break;
		}
	})

	return [firstHeader, lastHeader];
}

function getTheLatestLink(callback) {
	request(config.BaseUrl, function (error, response, body) {
		if (!error) {
			callback(scrapeTheLatestLink(body));
		} else {
			return;
		}
	});
}

function scrapeTheLatestLink(html) {
	let $ = cheerio.load(html); // main cheerio object

	let jobsButton;
	//test = $('section#help-sites div div div div.info-box a.btn').first().attr('href');

	// This is a really bad idea, but who know it might work for few months
	let buttons = $('section#help-sites div div div div.info-box a.btn');
	//console.log(buttons)

	for (var i = 0; i < buttons.length; i++) {
		let button = buttons.eq(i);

		//console.log(buttons.first().contents().text());
		//console.log(button.contents().text());

		let buttonText = button.contents().filter(function () {
			return this.type === 'text';
		}).text();
		//console.log(buttonText)
		// SB-Ansel - 09/09/2020 - Issue occurs here at this check statement. You were missing 'latest' :p. 
		if (buttonText.trim().toLowerCase() == "download latest jobs") {
			//console.log("\"" + buttonText + "\" " + "\"Download Jobs\"");
			jobsButton = button;
			break;
		}
	}
	if (!jobsButton) {
		console.log("Could not find the 'Download Jobs' button!");
		return;
	}
	let link = config.BaseUrl + jobsButton.attr('href');
	return link;
}

module.exports = {
	objectifyHtml,
	getTheLatestLink,
}