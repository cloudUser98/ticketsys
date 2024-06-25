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

window.value = 0;
window.tWeight = 0;
window.tValue = 0;

var value = 0;

function enforceMinMax(event) {
    let el = event.target;

    if (el.value != "") {
        if (parseInt(el.value) < 0) {
            el.value = 0;
        }
        if (parseInt(el.value) < parseInt(el.min)) {
            el.value = el.min;
        }
        if (parseInt(el.value) > parseInt(el.max)) {
            el.value = el.max;
        }
    }
}
document.getElementById("monto").addEventListener("keyup", enforceMinMax);
document.getElementById("inicial").addEventListener("keyup", enforceMinMax);
document.getElementById("final").addEventListener("keyup", enforceMinMax);

function setValue() {
    let valueInput = document.getElementById("input-group-1");

    value = parseInt(valueInput.value);
};

const reader = new FileReader();

reader.onload = (e) => {
    let arrayBuffer = new Uint8Array(e.result);
};

const arrayRange = (start, stop) =>
    Array.from(
        { length: (stop - start) / 1 + 1 },
        (value, index) => start + index * 1
    );

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

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
    const CASH = 32;
    const CARD = 37;
    const DEPOSIT = 35;

    const workbook = read(file);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = utils.sheet_to_json(worksheet, {header: 1});

    console.log("Informacion del reporte: ", json);

    let totalGeneralRow = json.filter(row => row[11] === "Total General:")[0];
    let fromrow = totalGeneralRow[21];

    window.totalGeneral = parseFloat(fromrow.replace(/[^\d.]/g, ''));

    let pzs = json.filter(value => value[0] === "PZA");
    let tickets = json.filter(value => value[0] === "Ticket");

    window.reportTotalTickets = tickets.length;
    console.log("Total de tickets en el reporte: ", reportTotalTickets);

    console.log("Tickets: ", tickets);

    window.creditTickets = tickets.filter(ticket => parseFloat(ticket[37].replace(/[^\d.]/g, ''))).map(ticket => {
        let creditValue = ticket[37];
        creditValue = parseFloat(creditValue.replace(/[^\d.]/g, ''));

        if (creditValue > 0) {
            return {
                "folio": ticket[5],
                "total": creditValue,
            }
        };
    });

    console.log("CREDITO: ", creditTickets);

    window.cash = 0;
    window.card = 0;
    window.deposit = 0;
    for (let i = 0; i < tickets.length; i++) {
        let ticket = tickets[i];

        console.log("--> ", parseFloat(ticket[CASH].replace(/[^\d.]/g, '')));
        cash += parseFloat(ticket[CASH].replace(/[^\d.]/g, ''));
        card += parseFloat(ticket[CARD].replace(/[^\d.]/g, ''));
        deposit += parseFloat(ticket[DEPOSIT].replace(/[^\d.]/g, ''));
    };

    document.getElementById("total-debit").innerHTML = "Efectivo: $" + cash;
    document.getElementById("total-credit").innerHTML = "Tarjeta: $" + card;
    document.getElementById("total-t").innerHTML = "Transferencias: $" + deposit;
    document.getElementById("total-f").innerHTML = "Total: $" + totalGeneral;

    console.log("Totals: ", cash, card,  deposit);


    window.catalog = pzs.map(pz => {
        return {name: pz[4], price: parseFloat(pz[19].replace(/[^\d.]/g, ''))}
    });

    console.log(catalog);

    let test = catalog.map(product => product.price);

    console.log("Weights: ", test);

    tValue = test;
    tWeight = test;

    document.getElementById("content").hidden = true;

    document.getElementById("monto").min = 0;
    document.getElementById("monto").max = totalGeneral;

    document.getElementById("results").hidden = false;
}

function fillTable(data, final=0) {
    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    data.forEach(item => {
        let productsHTML = item.products.map(product => `<tr><td>${product.name} $${product.price}</td></tr>`);
        productsHTML.join("");

        body.insertAdjacentHTML("beforeend", `
            <tr class="odd:bg-white even:bg-gray-50 border-b">
                <td class="px-6 py-4"> ${item.folio} </td>
                <td class="px-6 py-4"> $${item.total} </td>
            </tr>${productsHTML}`
        );
        totalValue += item.total;
    });
}

function calc(value, tValue, tWeight, tickets) {
    console.log("data: ", value, tValue, tWeight);

    const result = unboundedKnapsack(value, tWeight, tValue);

    let totalValue = 0;

    console.log(result);

    let final = result.selectedItems.map(idx => {
        console.log("Price: ", idx);

        let value = catalog[idx];

        totalValue += value.price;

        return catalog[idx];
    });

    shuffleArray(final);

    console.log("El resultado es de ", final.length, " productos y ", totalTickets, "tickets");
    let productByTicket = Math.floor(final.length / totalTickets);
    
    let someticket = totalTickets;
    if (final.length % totalTickets > 0) {
        someticket--;
    }
    console.log("Tiene que generar ", someticket, " tickets");
    let productsPerTicket = [];
    let finalTicket = [];
    let totalM = 0;
    let total = 0;
    let counter = 0;
    final.forEach(product => {
        if (someticket === 0) return;

        total += product.price;
        productsPerTicket.push(product)
        counter++;

        if (counter === productByTicket) {
            console.log("Se creo un ticket con: ", counter, " productos");
            finalTicket.push({
                folio: myFolio,
                total: total,
                products: productsPerTicket,
            });

            productsPerTicket = [];

            totalM += total;
            total = 0;
            counter = 0;

            myFolio += 1;
            someticket--;
            console.log(someticket);
        }
    });
    console.log("Se crearon tickets: ", final);

    if (final.length % totalTickets > 0 && totalTickets !== 0) {
        let lastProducts = final.slice(Math.max((totalTickets - 1) * productByTicket, 1))
        finalTicket.push({folio: myFolio, total: totalValue - totalM, products: lastProducts});
    };
    console.log("Se agrego un utlimo ticket con: ", (totalValue - totalM));

    console.log("Tickets generados: ", finalTicket);

    if (result.maxValue) {
        fillTable(finalTicket, totalValue);
    }
};

function insertCredit() {
    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    creditTickets.forEach(item => {
        if (totalTickets <= 0) return;
        if (totalValue + item.total > total) return;

        console.log("QUE TA PASANDO ", item);
        body.insertAdjacentHTML("beforeend", `<tr class="odd:bg-white even:bg-gray-50 border-b"><td class="px-6 py-4"> ${myFolio} </td><td class="px-6 py-4"> $${item.total} </td></tr>`);
        myFolio += 1;
        total -= item.total;
        totalValue += item.total;
        totalTickets--;
    });
}

function setTableTotal() {
    var total = document.getElementById("total");

    total.innerHTML = "$" + totalValue;
}

fileInput.addEventListener('change', async (event) => {
    const ab = await event.target.files[0].arrayBuffer();
    const ui8a = new Uint8Array(ab);

    readFile(ui8a);
});

document.getElementById("volver").addEventListener('click', function(event) {
    fileInput.value = "";

    window.value = 0;
    window.tWeight = 0;
    window.tValue = 0;

    window.reportTotalTickets = 0;
    window.totalGeneral = 0;
    window.creditTickets = [];

    window.cash = 0;
    window.card = 0;
    window.deposit = 0;

    window.catalog = [];

    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    body.innerHTML = "";

    document.getElementById("results").hidden = true;
    document.getElementById("content").hidden = false;
});

const form = document.getElementById('form');
form.addEventListener("submit", (event) => {
    event.preventDefault();

    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    body.innerHTML = "";

    window.totalValue = 0;

    const form = event.target;

    let monto = form.elements["monto"].value;
    let first = form.elements["inicial"].value;
    let last = form.elements["final"].value;

    window.myFolio = parseFloat(first);
    window.totalTickets = last - first + 1;

    console.log("Se quieren generar: ", totalTickets);
    
    if (totalTickets > reportTotalTickets) {
        document.getElementById("error").innerHTML = "La cantidad de tickets no puede ser mayor a los del reporte";
        return
    };
    window.total = monto;

    insertCredit();

    if (totalTickets > 0) {
        console.log("CALCULANDO: ", total, totalTickets);
        calc(total, tValue, tWeight, totalTickets);
    }

    setTableTotal();
});
