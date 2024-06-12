/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import './index.css';
import 'htmx.org';
// import { dialog } from 'electron';
import { read, writeXLSX, utils } from "xlsx";

console.log('👋 This message is being logged by "renderer.js", included via Vite');

const fileInput = document.getElementById('test');
const fileContentsDiv = document.getElementById('fileContents');

window.test.onContent((content) => console.log(content));

// fileInput.addEventListener('change', (event) => {
//     const filePath = event.target.files[0].path;
//     console.log(filePath);
// 
//     const result = window.test.readFile(filePath);
//     console.log("results: ", result);
// });
//
const reader = new FileReader();

reader.onload = (e) => {
    let arrayBuffer = new Uint8Array(e.result);
};

function unboundedKnapsack(capacity, weights, values) {
    // Scale the capacity to handle float values
    const scale = 1000; // Scale factor to convert float to int for better precision
    const intCapacity = Math.floor(capacity * scale);

    // Scale the weights accordingly
    const scaledWeights = weights.map(weight => Math.floor(weight * scale));

    // Initialize arrays for storing maximum values and items selected
    const dp = Array(intCapacity + 1).fill(0);
    const itemsSelected = Array.from({ length: intCapacity + 1 }, () => []);

    // Compute the maximum value for each scaled capacity from 0 to intCapacity
    for (let i = 0; i <= intCapacity; i++) {
        for (let j = 0; j < scaledWeights.length; j++) {
            if (scaledWeights[j] <= i) {
                const newValue = dp[i - scaledWeights[j]] + values[j];
                if (newValue > dp[i]) {
                    dp[i] = newValue;
                    itemsSelected[i] = [...itemsSelected[i - scaledWeights[j]], j];
                }
            }
        }
    }

    // Get the total value and the items selected for the full capacity
    const maxValue = dp[intCapacity];
    const selectedItems = itemsSelected[intCapacity];

    return { maxValue, selectedItems };
}

function readFile(file) {
    const workbook = read(file);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = utils.sheet_to_json(worksheet, {header: 1});

    let pzs = json.filter(value => value[0] === "PZA");
    let tickets = json.filter(value => value[0] === "Ticket");


    let lastFolio = document.getElementById("last-folio");
    let lastTicketFolio = tickets.pop()[5];
    lastFolio.innerHTML = "Último folio: " + lastTicketFolio;

    let catalog = pzs.map(pz => {
        return {name: pz[4], price: parseFloat(pz[19])}
    });

    console.log(catalog);

    let test = catalog.map(product => product.price);
    console.log("Weights: ", test);

    let limit = document.getElementById("input-group-1").value;
    limit = limit ? limit : 0;

    console.log("Limit: ", limit)

    let tValue = test;
    let tWeight = test;

    let result = unboundedKnapsack(limit, tWeight, tValue);

    console.log(result);

    let final = result.selectedItems.map(idx => {
        console.log("Price: ", idx);

        return catalog[idx];
    });

    window.final = final;
    console.log(final);
}

fileInput.addEventListener('change', async (event) => {
    const ab = await event.target.files[0].arrayBuffer();
    const ui8a = new Uint8Array(ab);

    readFile(ui8a);
});
