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
import 'datatables.net-dt/css/dataTables.dataTables.min.css';

// import { dialog } from 'electron';

import 'htmx.org';
import { read, writeXLSX, utils } from "xlsx";
import DataTable from 'datatables.net-dt';

var dataTable = new DataTable('#tickets', {
    // columns: [
    //     {
    //         className: 'dt-control',
    //         orderable: false,
    //         defaultContent: ''
    //     },
    //     null,
    //     null,
    // ],
    // order: [[1, 'desc']],
    footerCallback: function(row, data, start, end, display) {
        let api = this.api();

        const total = api
            .column(1)
            .data()
            .reduce((a, b) => {
                return a + parseFloat(b.replace("$", ""))
            }, 0);

        api.column(1).footer().innerHTML = 'Total: $' + total;
    },
});

dataTable.on('click', 'td.dt-control', function (e) {
    let tr = e.target.closest('tr');
    let row = dataTable.row(tr);

    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
    }
    else {
        // Open this row
        row.child(format(['product 1', 'product 2'])).show();
    }
});

// dataTable.column(0).orderable(false);

const fileInput = document.getElementById('test');
const fileContentsDiv = document.getElementById('fileContents');

window.test.onContent((content) => console.log(content));

window.value = 0;
window.tWeight = 0;
window.tValue = 0;

var value = 0;


function format(products) {
    const childRows = "".concat(products.map(product => `<dd>${product.name}</dd>`));

    console.log("Products formated: ", childRows);

    return (
        "<dl>" +
        "<dt>Productos:</dt>" +
        childRows +
        "</dl>"
    );
}

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

function addOneMore(val, tickets, t) {
    const values = [...val].sort((a, b) => a - b);

    console.log(values)

    values.every((value, index) => {
        console.log(t, value, parseFloat(total));
        if (t + value >= parseFloat(total) && parseFloat(total) - t > value / 2) {
            tickets[tickets.length - 1].total += value;

            console.log("Se agrego un extra de: ", value);

            return false
        }
    })
};

function getValues(t, val, min) {
    const numberOfValues = val.length;

    let maxValue = 0,
        selectedItems = [];

    const lowest = val.indexOf(Math.min(...val));

    if (numberOfValues === 0 || t === 0) {
        return {maxValue, selectedItems}
    }

    while (maxValue < t) {
        if (selectedItems.length < min) {
            selectedItems.push(lowest);

            maxValue += val[lowest];
        } else {
            return { maxValue, selectedItems }
        }
    }

    return {maxValue, selectedItems}
}

function unboundedKnapsackBetter(W, val, wt) {
    // Stores most dense item
    let maxDenseIndex = 0

    // Find the item with highest unit value
    // (if two items have same unit value then choose the lighter item)
    for (let i = 1; i < val.length; i++) {
        if (val[i] / wt[i] > val[maxDenseIndex] / wt[maxDenseIndex]
            || (val[i] / wt[i] === val[maxDenseIndex] / wt[maxDenseIndex]
                && wt[i] < wt[maxDenseIndex])) {
            maxDenseIndex = i;
        }
    }

    let dp = new Array(W + 1).fill(0);
    const itemsSelected = Array.from({ length: W + 1 }, () => []);

    let counter = 0;
    let breaked = false;
    for (var i = 0; i <= W; i++) {
        for (let j = 0; j < wt.length; j++) {
            if (wt[j] <= i) {
                const newValue = dp[i - wt[j]] + val[j];

                if (newValue > dp[i]) {
                    dp[i] = newValue;

                    itemsSelected[i] = [...itemsSelected[i - wt[j]], j];
                }
            }
        }
        if (i - wt[maxDenseIndex] >= 0 && dp[i] - dp[i - wt[maxDenseIndex]] === val[maxDenseIndex]) {
            counter += 1;
            if (counter >= wt[maxDenseIndex]) {
                breaked = true;
                break;
            }
        } else {
            counter = 0;
        }
    }

    const selectedItems = itemsSelected[W];

    if (!breaked) {
        return {
            maxValue: dp[W],
            selectedItems
        };
    } else {
        let start = i - wt[maxDenseIndex] + 1;
        let times = Math.floor((W - start) / wt[maxDenseIndex]);
        let index = (W - start) % wt[maxDenseIndex] + start;

        let selectedItems = new Array(times).fill(maxDenseIndex).concat(itemsSelected[index]);

        return {
            maxValue: (times * val[maxDenseIndex] + dp[index]),
            selectedItems
        };
    }
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

    document.getElementById("total-debit").innerHTML = "$" + cash;
    document.getElementById("total-credit").innerHTML = "$" + card;
    document.getElementById("total-t").innerHTML = "$" + deposit;
    document.getElementById("total-f").innerHTML = "$" + totalGeneral;

    console.log("Totals: ", cash, card,  deposit);


    window.catalog = pzs.map(pz => {
        return {name: pz[4], price: parseFloat(pz[19].replace(/[^\d.]/g, ''))}
    });

    console.log(catalog);

    let test = catalog.map(product => product.price);

    console.log("Weights: ", test);

    tValue = test;
    tWeight = test;
}

function fillTable(data, final=0) {
    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    data.forEach(item => {
        dataTable.row
            .add([
                item.folio,
                "$" + item.total,
            ])
            .draw(false);
        // item.products.map(product => {

        // let productsHTML = item.products.map(product => `<tr><td>${product.name} $${product.price}</td></tr>`);
        // productsHTML.join("");

        // body.insertAdjacentHTML("beforeend", `
        //     <tr class="odd:bg-white even:bg-gray-50 border-b">
        //         <td class="px-6 py-4"> ${item.folio} </td>
        //         <td class="px-6 py-4"> $${item.total} </td>
        //     </tr>${productsHTML}`
        // );
        totalValue += item.total;
    });
}

function calc(value, tValue, tWeight, tickets) {
    console.log("data: ", value, tValue, tWeight);

    let result = getValues(parseFloat(value), tValue, totalTickets);

    if (parseFloat(value) - result.maxValue > 0) {
        console.log("Calling knapsack with: ", parseFloat(value) - result.maxValue, tValue, tWeight);

        const knapsackResult = unboundedKnapsackBetter(parseFloat(value) - result.maxValue, tValue, tWeight);

        result = { maxValue: result.maxValue + knapsackResult.maxValue, selectedItems: result.selectedItems.concat(knapsackResult.selectedItems)};
    }

    console.log("Result: ", result);

    let totalValue = 0;

    let final = result.selectedItems.map(idx => {
        console.log("Price: ", idx);

        let value = catalog[idx];

        totalValue += value.price;

        return catalog[idx];
    });

    shuffleArray(final);

    console.log("El resultado es de ", final.length, " productos y ", totalTickets, "tickets");
    let productByTicket = Math.floor(final.length / totalTickets);
    const productPerTicket = productByTicket
        ? productByTicket
        : 1;
    
    let someticket = totalTickets;
    if (final.length % totalTickets > 0 && productByTicket !== 0) {
        someticket--;
    }
    console.log("Tiene que generar ", someticket, " tickets");
    console.log("Con ", productPerTicket, " productos por ticket");

    let productsPerTicket = [];
    let finalTicket = [];
    let totalM = 0;
    let total = 0;
    let counter = 0;
    let products = final.length;
    final.forEach(product => {
        if (someticket === 0) return;

        total += product.price;
        productsPerTicket.push(product)
        products--;
        counter++;

        if (counter === productPerTicket) {
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

    if (products && final.length % totalTickets > 0 && totalTickets !== 0) {
        let lastProducts = final.slice(Math.max((totalTickets - 1) * productPerTicket, 1))
        finalTicket.push({folio: myFolio, total: totalValue - totalM, products: lastProducts});
    };
    console.log("Se agrego un utlimo ticket con: ", (totalValue - totalM));

    console.log("Tickets generados: ", finalTicket);

    if (result.maxValue) {
        console.log("Agregar one more: ", result.maxValue, parseFloat(window.total))
        if (result.maxValue < parseFloat(window.total)) {
            addOneMore(tValue, finalTicket, result.maxValue);
        }

        fillTable(finalTicket, totalValue);
    }
};

function insertCredit(monto) {
    console.log("CREDIT: ", creditTickets);

    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    let usedCreditTickets = 0;
    creditTickets.every(item => {
        console.log(totalTickets);
        if (totalTickets <= 0) return false;
        console.log(totalValue, item.total, monto);
        if (totalValue + item.total > monto) return false;

        console.log("QUE TA PASANDO ", item);
        const rows = dataTable.row
            .add([
                myFolio,
                "$" + item.total,
            ])
            .draw(false)
            .rows().nodes().toArray();

        usedCreditTickets++;

        console.log("credit rows: ", rows);
        rows[rows.length - 1].style.backgroundColor = "rgba(14, 116, 144, 0.4)";
        // rows[rows.length - 1].style.color = "white";
        // body.insertAdjacentHTML("beforeend", `<tr class="odd:bg-white even:bg-gray-50 border-b"><td class="px-6 py-4"> ${myFolio} </td><td class="px-6 py-4"> $${item.total} </td></tr>`);
        myFolio += 1;
        total -= item.total;
        totalValue += item.total;
        totalTickets--;

        return true;
    });

    if (usedCreditTickets < creditTickets.length) {
        return false
    }

    return true
}

function setTableTotal() {
    // var total = document.getElementById("total");

    // total.innerHTML = "$" + totalValue;
}

fileInput.addEventListener('change', async (event) => {
    const ab = await event.target.files[0].arrayBuffer();
    const ui8a = new Uint8Array(ab);

    readFile(ui8a);

    document.getElementById("start").hidden = false;
});

document.getElementById("start").addEventListener('click', function(event) {
    document.getElementById("start").hidden = true;
    document.getElementById("content").hidden = true;

    document.getElementById("monto").min = 0;
    document.getElementById("monto").max = totalGeneral;

    document.getElementById("results").hidden = false;
});

document.getElementById("volver").addEventListener('click', function(event) {
    fileInput.value = "";

    document.getElementById("error").innerHTML = "";

    document.getElementById("monto").value = "";
    document.getElementById("inicial").value = "";
    document.getElementById("final").value = "";

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

    dataTable.clear().draw();

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

    const result = insertCredit(parseFloat(monto));

    if (result && totalTickets > 0) {
        console.log("CALCULANDO: ", total, totalTickets);
        calc(total, tValue, tWeight, totalTickets);
    }

    setTableTotal();
});
