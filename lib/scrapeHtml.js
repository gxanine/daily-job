const cheerio = require('cheerio'); // core module for html scrapping

// Start ------ Constructor functions
function Category(name)  {
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
	let $ = cheerio.load(html); // main cheerio object
	let objectified = []; // array of Catergory objects
	let objectIndex = 0;

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

	// First title has to be added seperately as the iteration
	// start a sibling after it
	objectified[objectIndex] = new Category($($('.category')[objectIndex]).text()); // Get first category name
	
	// Iterate through all siblings of the first header
	$(all).each(function() {
		let isItem = true; // Just a flag for checking if current element is title or item

		// Get the text value of the current html tag and clean it up
		let text = $(this).text().toLowerCase().replace(/[\s\t]/g, '');
		console.log(text);
		let textRaw = $(this).text(); // Display the text without cleaning it up
		console.log("---" + textRaw);
		textRaw = textRaw.replace(/\s+$/g, ''); // Get rid of whitespece at the end of string
		console.log("length: " + textRaw.length);


		let link = []; // Create an array for Link objects
		// Check if it's a paragraph tag which means it's an 'item'(Item()) ('adminstration' is an exception)
		if ($(this).is('p') && text != "administration" && textRaw.length > 0) { // This had to be hardcoded beacuse
			// the .docx file formatting is so poor that not every title
			// is formatted the same way.
			//
			$(this).children().each(function() {
				// Seperate data from 'a' tag
				if ($(this).text().length > 1) {
					link['href'] = $(this).attr('href')
					link['text'] = $(this).text();
				}
			});
			$(this).addClass('item');

			let lastTextIndex = textRaw.length - link['text'].length - 1; // Index start at 0
			textRaw = textRaw.substring(0, lastTextIndex); // Get rid of link['text']
			textRaw = textRaw.replace(/\s+$/g, ''); // Get rid of whitespece at the end of string

			// Add the current object as an Item on the current object-index
			objectified[objectIndex].addItem(new Item(textRaw, new Link(link['href'], link['text'])));
		} else { // otherwise it means it's a title (Category())
			$(this).addClass('category');
			objectIndex++; // Increase object-index for a new object entry
			let categoryTitle = $($('.category')[objectIndex]).text().replace(/[\t]/g, ''); // Get and clean up category title
			objectified[objectIndex] = new Category(categoryTitle); // Add the current object to the main array

		}
	
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

	$('strong').each(function(indexOfElement, elem) {
		let text = $(this).text().toLowerCase().replace(/[\s\t]/g, '');
		let current = $(this);

		switch(text) {
			case "retail&hospitality":
				current.addClass('category')
				firstHeader = current.parent().parent().parent().parent().parent();
				break;
			case "internetjobsearch":
				lastHeader = current.parent();
				break;
		}
	})

	return [firstHeader, lastHeader];
}

module.exports = {
	objectifyHtml,
}