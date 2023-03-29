// Most functions or tools given by puppeteer are async or promise, so we need to await before moving on
const puppeteer = require("puppeteer");
// A file system module to give promises
const fs = require("fs/promises");
// A JavaScript scheduler in node.js
const cron = require("node-cron");

async function start() {
  // launch a headless browser
  const browser = await puppeteer.launch();
  // Create new tab
  const page = await browser.newPage();
  // Navigate to specific URL
  await page.goto("https://learnwebcode.github.io/practice-requests/");

  // Taking a screenshot, you can get a page with various screen sizes
  // await page.screenshot( {path: 'amazing.png', fullPage: true} );
  // await page.setViewport({width: 1080, height: 1024});

  // document.querySelectorAll(".info strong") returns a node list of elements and not an array, so we have to use Array.from() and then we can use array methods like .map()
  // Using return saves the results into the const names
  const names = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".info strong")).map(
      (x) => x.textContent
    );
  });

  // writeFile() has two arguements, one is the name of the file we want to create, second is the string of text we want to save into that file
  // In this case we join them with a return and a new line
  await fs.writeFile("names.txt", names.join("\r\n"));

  // Trying to click on a button to reveal some text and retrieve the text inside.
  // The code written here is made sure to be before the whole photo retrieval because getting the photos require going to another page
  await page.click("#clickme");
  // Just like selecting multiple elements, #eval just selects one element and is basically document.queryselector, and is easier to use than evaluate()
  // Once again, first argument is a css-like selector, second is a function passing in the selected element, and in this case will be returning the text content
  const clickedData = await page.$eval("#data", (el) => el.textContent);

  // type() has two arguments, first is the css-like selector of the element you want to input, second is the value you want to type into the field
  await page.type("#ourfield", "blue");

  // Could use the method that submits the form, which is normal
  // in this case we will simulate clicking on the form due to github pages site
  // await page.click('#ourform button');
  // await page.waitForNavigation();

  // The above works but only sometimes? It's safer to use a Promise.all() and wait for both of those promises to happen before moving on
  await Promise.all([page.click("#ourform button"), page.waitForNavigation()]);
  const info = await page.$eval("#message", (el) => el.textContent);
  console.log(info);

  // $$eval is specifically made by puppeteer to select multiple elements, so we don't need to use Array.from(), puppeteer does it for you and returns an array
  const photos = await page.$$eval("img", (imgs) => {
    // With this, photos will now contain an array of all the image urls, we map the src links because we don't want the whole html tag as well
    return imgs.map((x) => x.src);
  });

  // Now that we have an array of the urls in photos, we can save them to the hard drive by looping through the array
  // we use for instead of forEach because for allows for await syntax
  // const 'photo' of photos, 'photo' is the current one that is looped to
  for (const photo of photos) {
    // navigating to a new url and then saving it to the hard drive with the fs.writeFile() method
    const imagePage = await page.goto(photo);
    // in this case we pop off the last bit of text that comes after the last / in order to get a name
    // the second arguement is not a string of text we want to save this time, but instead pngs which is why we use buffer()
    await fs.writeFile(photo.split("/").pop(), await imagePage.buffer());
  }

  // Close the task / browser
  await browser.close();
}

// start();

// What if we want it to run on repeat?
// We can have a setInterval, first argument is the function you want to run, second is how long you want to wait, 5 seconds in this case
// This will run forever
// setInterval(start, 5000);

// What if you wanted more control? You can use node-cron
// https://www.npmjs.com/package/node-cron
// There are 6 * fields, seconds(which are optional, thus making it five * if you don't want seconds)
// minute 0-59, hour 0-23, day of month 1-31, month 1-12 (or names), day of week 0-7 (or names)
// step values are use with /, so the example below will run once every 5 seconds.
cron.schedule("*/5 * * * * *", start);
