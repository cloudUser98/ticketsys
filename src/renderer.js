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
import Swal from 'sweetalert2'

window.finalTicketList = [];
var canUseCashTickets = false;
var formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function ticket(folio, date, time, total, efectivo="0", credito="0", caja, cliente, cajero, products) {
    const renderedProducts = products.map(({name, number, price, total}) => {
        return `
        <div class="font" style="white-space:nowrap;overflow:hidden;">${name}</div>
        <div style="display:flex;justify-content:end;" class="font">
            <div style="display:flex;flex-wrap:wrap;width:67%;">
                <div style="flex:1;text-align:right;">${number}.0</div>
                <div style="padding-left:.4rem;flex:1;text-align:right;">${price}</div>
                <div style="flex:1;text-align:right;">0.00</div>
            </div>
            <div style="width:33%;text-align:right;">${total}</div>
        </div>
        <div style="text-align:center;">--------------------------</div>
        `
    }).join("");

    const ticketTemplate = `
    <div class="ticket">
        <div class="ticket-header">
            <div style="text-align:center;">
                <img src="/logo.png" style="width:190px;height:auto;">
            </div>
        </div>
        <div class="ticket-body">
            <br>
            <div class="font text-center">CHATTO</div>
            <div class="font text-center">OIAV960308NH1</div>
            <div class="font text-center">PROGRESO 39</div>
            <div class="font text-center">COMALA,COLIMA</div>
            <div class="font text-center">28450</div>
            <div class="font text-center font">chattocomala@gmail.com</div>
            <br>
            <div>--------------------------</div>
            <div class="font">No. TICKET: ${folio}</div>
            <div class="font">&emsp;&emsp;&emsp;FECHA: ${date}</div>
            <div class="font">&emsp;&emsp;&emsp;HORA: &emsp;${time}</div>
            <div>--------------------------</div>
            <div class="font flex space-between">
                <div class="w-75">
                    &emsp;&emsp;&emsp;<span>CANT</span>
                    <span>PCIO U.</span>
                    <span>%DESC</span>
                </div>
                <div class="w-25">IMPORTE</div>
            </div>
            <div>--------------------------</div>
            ${renderedProducts}
            <br>
            <br>
            <div style="display:flex;flex-direction:column;">
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">TOTAL:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">${total}</div>
                </div>

                <div class="font text-center"><<<<<<< FORMAS DE PAGO >>>>>>></div>

                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">EFECTIVO:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">${efectivo}</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">CHEQUE:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">0.00</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">VALES:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">0.00</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">TRANSFERENCIA:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">0.00</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">TARJETA:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">${credito}</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">CREDITO:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">0.00</div>
                </div>
                <div class="font flex">
                    <div style="min-width:9.44em;text-align:end;">CAMBIO:</div>
                    <div style="flex-grow: 1; word-break:break-word;white-space:pre-wrap;text-align:end;">0.00</div>
                </div>
            </div>
            <br>
            <div class="font text-center">CAJA</div>
            <div class="font text-center">${caja}</div>
            <br>
            <div class="font text-center">CLIENTE</div>
            <div class="font text-center">${cliente}</div>
            <br>
            <div class="font text-center">CAJERO</div>
            <div class="font text-center">${cajero}</div>
        </div>
        <div class="ticket-footer" style="text-align:center;margin-top:5cm;">
            www.sicar.mx
        </div>
    </div>
    <div class="pagebreak"> </div>
    `

    return ticketTemplate
}


function getDateString(dateString) {
    console.log("GETTING DATE STRING: ", dateString);

    // Define regex patterns for date and date-time formats
    const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dateTimePattern = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/;

    // Check if the dateString matches the date pattern
    const dateMatch = dateString.match(datePattern);
    if (dateMatch) {
        // If it matches date pattern, return formatted date
        const [, day, month, year] = dateMatch;
        // const formattedDate = `${year}-${month}-${day}`;
        // return formattedDate;
        return {
            date: `${day}/${month}/${year}`,
            time: "00:00:00 AM"
        }
    }

    // Check if the dateString matches the date-time pattern
    const dateTimeMatch = dateString.match(dateTimePattern);
    if (dateTimeMatch) {
        // If it matches date-time pattern, return formatted date and time
        const [, day, month, year, hours, minutes, seconds, period] = dateTimeMatch;
        const formattedDate = `${year}-${month}-${day}`;
        const formattedTime = `${period === 'AM' ? hours : (parseInt(hours) + 12).toString().padStart(2, '0')}:${minutes}:${seconds} ${period}`;
        // return `${formattedDate} ${formattedTime}`;

        return {
            date: `${day}/${month}/${year}`,
            time: formattedTime,
        }
    }

    // Return 'none' if the time is in the string but has the wrong format
    return null
}


function parseDateString(dateString) {
    console.log("parsing dateString: ", dateString);

    // Regular expression to match the full date and time format
    const fullDateTimePattern = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM)$/;
    // Regular expression to match only the date format (e.g., 25/09/5)
    const dateOnlyPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;

    // Check if the string matches the full date and time format
    if (fullDateTimePattern.test(dateString)) {
        let [_, day, month, year, hours, minutes, seconds, meridian] = dateString.match(fullDateTimePattern);

        // Convert the time to 24-hour format if necessary
        if (meridian === "PM" && hours !== "12") {
            hours = parseInt(hours) + 12;
        } else if (meridian === "AM" && hours === "12") {
            hours = 0;
        }

        // Create and return the Date object (month is 0-indexed)
        return new Date(year, month - 1, day, hours, minutes, seconds);
    } else if (dateOnlyPattern.test(dateString)) {
        // If the string matches only the date pattern, throw an error
        let [_, day, month, year] = dateString.match(dateOnlyPattern);

        // Return a Date object with the time set to 12:00 AM
        return new Date(year, month - 1, day, 0, 0, 0);
    } else {
        // If the string does not match the expected format, throw an error
        try {
            let [_, day, month, year] = dateString.match(dateOnlyPattern);

            return new Date(year, month - 1, day, 0, 0, 0);
        } catch {
            return new Date(0, 0, 0, 0, 0, 0, 0);
        }
    }
}


function printTickets() {
    const renderedTickets = finalTicketList.map((
        {
            folio,
            date,
            time,
            total,
            efectivo,
            credito,
            caja,
            cliente,
            cajero,
            products
        }
    ) => {
        console.log("WTF ------------> ", total, efectivo, credito);

        const formattedDate = getDateString(date);

        console.log("RESULT OF STRING DATE: ", formattedDate);

        if (formattedDate) {
            date = formattedDate.date;
            time = formattedDate.time;
        }

        const correctFormattedTickets = products.map(product => {
            const price = formatter.format(product.price);
            const total = formatter.format(product.total);

            return {...product, price, total}
        })

        efectivo ? efectivo = efectivo : efectivo = 0;
        credito ? credito = credito : credito = 0;

        if (total !== undefined || total === 0) {
            // total = parseFloat(total);
            total = formatter.format(total);
        }

        if (efectivo !== undefined || efectivo === 0) {
            // efectivo = parseFloat(efectivo);
            efectivo = formatter.format(efectivo);
        }

        if (credito !== undefined || efectivo === 0) {
            // credito = parseFloat(credito);
            credito = formatter.format(credito);
        }

        return ticket(folio, date, time, total, efectivo, credito, caja, cliente, cajero, correctFormattedTickets)
    });

    console.log("HTML TICKETS: ", renderedTickets);

    const pagelink = "about:blank";
    const pwa = window.open(pagelink, "_new");

    pwa.document.open();
    pwa.document.write(`
        <html>
        <head>
            <script>
                function printPage() {
                    // window.print();
                    // window.close();
                }
            </script>
            <style>
                @media print {
                    .pagebreak { page-break-before: always; } /* page-break-after works, as well */
                }

                @font-face {
                    font-family: 'Noto Sans Mono';
                    src: url('/NotoSansMono-VariableFont_wdth,wght.ttf') format(truetype);
                }

                .font {
                    font-size: 12pt;
                    font-stretch: 50%;
                    line-height: .9em;
                }

                .ticket {
                }

                .text-center {
                    text-align: center;
                }

                .flex {
                    display: flex;
                }

                .column {
                    flex-direction: column;
                }

                .flex-grow-1 {
                    flex-grow: 1;
                }

                .flex-grow-2 {
                    flex-grow: 2;
                }

                .space-around {
                    justify-content: space-around;
                }

                .space-between {
                    justify-content: space-between;
                }

                .end {
                    justify-content: flex-end;
                }

                .max-w-192 {
                    max-width: 192px;
                }

                .w-75 {
                    width: 75%:
                }

                .w-25 {
                    width: 25%:
                }

                .ticket-body {
                    padding: 0 1.5rem 9 1.5rem;
                }

                * {
                    font-family: Noto Sans Mono;
                }
            </style>
        </head>
        <body style="margin:0px;width:80mm;" onload="printPage()">
            ${renderedTickets.join("")}
        </body>
    </html>
    `);

    pwa.document.close();
}
// /*
window.finalTicketList = [
    {
        folio: 92384023984209348,
        date: "7777/7777/7777",
        time: "00:00:00 AM",
        total: "2,116.00",
        efectivo: "7,777.00",
        credito: 7777777,
        caja: "La caja de don cangrejo es la mejor",
        cliente: "El unico que existe omegalul hay como me duele",
        cajero: "El mero mero sabor taquero es lo que querias escuchar verdad",
        products: [
            {
                number: 3,
                total: "10,000",
                price: "5,000",
                name: "El producto mas perron de tossssssssssssda el area limitrofe",
            },
            {
                number: 2,
                total: 99999,
                price: 99999,
                name: "El producto mas perronsssssssde toda el area limitrofe",
            }
        ],
    }
]
// */

// printTickets();


function getLowestTicket() {
    return finalTicketList.reduce(function(prev, curr) {
        return prev.total < curr.total ? prev : curr;
    });
}


function throwErrorAlert(title, text) {
    const errorsContainer = document.getElementById("errors");

    const errorHtml = `
    <div class="flex items-center p-4 mb-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50" role="alert">
      <svg class="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
      </svg>
      <span class="sr-only">Info</span>
      <div>
        ${text}
      </div>
    </div>
    `

    errorsContainer.innerHTML = errorHtml;
}

var dataTable = new DataTable('#tickets', {
    columns: [
        {
            className: 'dt-control',
            orderable: false,
            defaultContent: ''
        },
        null,
        null,
    ],
    order: [[1, 'asc']],
    searching: false,
    paging: false,
    sDom: '<"toolbar">frtip',
    footerCallback: function(row, data, start, end, display) {
        let api = this.api();

        let USDollar = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        const total = api
            .column(2)
            .data()
            .reduce((a, b) => {
                return a + Number(b.replace(/[^0-9.-]+/g,""))
            }, 0);

        api.column(2).footer().innerHTML = 'Total: ' + USDollar.format(total.toFixed(2));
    },
});

document.querySelector("div.toolbar").innerHTML = `
    <div id="print-button" hidden>
    <button class="flex items-center appearance-none bg-indigo-900 text-white border border-gray-200 rounded py-2 px-6 leading-tight focus:outline-none focus:border-gray-500" id="grid-city">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-printer-fill me-2" viewBox="0 0 16 16">
    <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2zm6 8H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1"/>
    <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
    </svg>
    Imprimir Tickets</button>
    </div>
    `;

document.getElementById("print-button").addEventListener("click", () => {
    printTickets();
});


function showPrintButton() {
    document.getElementById("print-button").hidden = false;
}


dataTable.on('click', 'td.dt-control', function (e) {
    let tr = e.target.closest('tr');
    let row = dataTable.row(tr);

    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
    }
    else {
        // Open this row
        const rowId = row.data()[1];
        
        console.log(row.data(), rowId, finalTicketList.find(value => value.folio === rowId));

        row.child(format(finalTicketList.find(value => value.folio === rowId).products)).show();
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
    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const childRows = "".concat(products.map(product => `<dd>${product.number} ${product.name} ${USDollar.format(product.total.toFixed(2))}</dd>`).join(""));

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


function respectCurrencyFormat(event) {
    const el = event.target;
    const USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    let value = el.value;

    value = Number(value.replace(/[^0-9.-]+/g,""));

    console.log(value);

    const formattedValue = USDollar.format(value.toFixed(2));

    console.log(formattedValue);

    el.value = formattedValue
}

document.getElementById("monto").addEventListener("blur", respectCurrencyFormat);
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

function unboundedKnapsackBetter(profit, weight, maxCapacity, maxItems) {
    const n = weight.length;

    // Create a 2D array to store results of subproblems
    // dp[i][j] will store the maximum value that can be achieved with at most i items and capacity j
    const dp = new Array(maxItems + 1).fill(null).map(() => new Array(maxCapacity + 1).fill(0));

    // Array to store selected items for each subproblem
    const selectedItems = new Array(maxItems + 1).fill(null).map(() => new Array(maxCapacity + 1).fill([]));

    // Build table dp[][] and selectedItems[][] in bottom up manner
    for (let item = 1; item <= n; item++) {
        for (let k = maxItems; k >= 1; k--) {
            for (let w = maxCapacity; w >= weight[item - 1]; w--) {
                // Check if including the current item gives a better profit
                if (dp[k][w] < dp[k - 1][w - weight[item - 1]] + profit[item - 1]) {
                    dp[k][w] = dp[k - 1][w - weight[item - 1]] + profit[item - 1];
                    // Update selected items for dp[k][w] to include current item index
                    selectedItems[k][w] = [...selectedItems[k - 1][w - weight[item - 1]], item - 1];
                }
            }
        }
    }

    // console.log("Selected items:", selectedItems[maxItems][maxCapacity]);
    // 
    // let items = selectedItems[maxItems][maxCapacity].map(index => index + 1);

    // console.log("Selected items:", items);

    // Return the maximum value that can be achieved with maxItems items and capacity 'maxCapacity'
    return {
        maxValue: dp[maxItems][maxCapacity],
        selectedItems: selectedItems[maxItems][maxCapacity]
    }
}

function readFile(file) {
    const CASH = 32;
    const CARD = 37;
    const DEPOSIT = 35;

    const CAJA = 12;
    const CLIENTE = 7;
    const CAJERO = 17;

    const workbook = read(file);

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = utils.sheet_to_json(worksheet, {header: 1, raw: false});

    console.log("Informacion del reporte: ", json);

    let totalGeneralRow = json.filter(row => row[11] === "Total General:")[0];

    console.log("TOTAL GENERAL ROW: ", totalGeneralRow);

    let fromrow = totalGeneralRow[21];

    if (typeof fromrow === "string") {
        fromrow = parseFloat(fromrow.replace(/[^\d.]/g, ''));
    }

    window.totalGeneral = fromrow;

    let pzs = json.filter(value => value[0] === "PZA");
    let tickets = json.filter(value => value[0] === "Ticket");

    window.reportTotalTickets = tickets.length;
    console.log("Total de tickets en el reporte: ", reportTotalTickets);

    console.log("Tickets: ", tickets);

    window.creditTickets = json.reduce((filtered, ticket, idx) => {
        if (ticket[37]) {
            let credit = ticket[37];
            if (typeof ticket[37] === "string") {
                credit = parseFloat(credit.replace(/[^\d.]/g, ''));
            }

            console.log("TICKET DE CREDITO CON ID ", idx);
            console.log("Tiene credito", credit);
            let products = []
            for (let i = idx + 1; i < json.length; i++) {
                if (json[i][0] === "Ticket") {
                    console.log(true);
                    break;
                }

                if (json[i][0] === "PZA") {
                    let value = json[i][19];
                    if (typeof value === "string") {
                        value = parseFloat(value.replace(/[^\d.]/g, ''));
                    }

                    let qt = json[i][1];
                    if (typeof qt === "string") {
                        qt = parseFloat(qt);
                    }

                    let total = json[i][27];
                    if (typeof total === "string") {
                        total = parseFloat(total.replace(/[^\d.]/g, ''));
                    }

                    const regex = /\[.*?\]/g;
                    const name = json[i][4].replace(regex, '').trim();

                    products.push({
                        name: name,
                        number: qt,
                        price: value,
                        total: total,
                    })
                }
            }

            let creditValue = ticket[37];
            if (typeof creditValue === "string") {
                creditValue = parseFloat(creditValue.replace(/[^\d.]/g, ''));
            }

            const [day, month, year] = ticket[3].split('/');

            // Construct a new Date object
            // Note: JavaScript's Date constructor expects the format "YYYY-MM-DD"
            // const date = new Date(`${year}-${month}-${day}`);
            const date = parseDateString(ticket[3]);

            if (creditValue > 0) {
                console.log(filtered)
                filtered.push({
                    "folio": ticket[5],
                    caja: ticket[CAJA],
                    cliente: ticket[CLIENTE],
                    cajero: ticket[CAJERO],
                    realDate: date,
                    date: ticket[3],
                    "total": creditValue,
                    credito: creditValue,
                    products,
                })
            }
        }

        return filtered
    }, []);

    window.catalog = json.reduce((filtered, ticket, idx) => {
        if (ticket[0] === "Ticket" && ( ticket[37] === undefined || ticket[37] === 0 || ticket[37] === "$ 0.00" )) {

            let products = []
            for (let i = idx + 1; i < json.length; i++) {
                if (json[i][0] === "Ticket") {
                    console.log(true);
                    break;
                }

                if (json[i][0] === "PZA") {
                    let value = json[i][19];
                    if (typeof value === "string") {
                        value = parseFloat(value.replace(/[^\d.]/g, ''));
                    }

                    let qt = json[i][1];
                    if (typeof qt === "string") {
                        qt = parseFloat(qt);
                    }

                    let total = json[i][27];
                    if (typeof total === "string") {
                        total = parseFloat(total.replace(/[^\d.]/g, ''));
                    }

                    const regex = /\[.*?\]/g;
                    const name = json[i][4].replace(regex, '').trim();

                    products.push({
                        name: name,
                        number: qt,
                        price: value,
                        total: total,
                    })
                }
            }

            let ticketTotal = ticket[30];
            if (typeof ticket[30] === "string") {
                ticketTotal = parseFloat(ticketTotal.replace(/[^\d.]/g, ''));
            }

            console.log("AAAAAAAA FECHAS ---> ", ticket[3], ticket[3].replace(/\//g, "-"));
            const [day, month, year] = ticket[3].split('/');

            // Construct a new Date object
            // Note: JavaScript's Date constructor expects the format "YYYY-MM-DD"
            // const date = new Date(`${year}-${month}-${day}`);
            const date = parseDateString(ticket[3]);

            filtered.push({
                "folio": ticket[5],
                caja: ticket[CAJA],
                cliente: ticket[CLIENTE],
                cajero: ticket[CAJERO],
                realDate: date,
                date: ticket[3],
                total: ticketTotal,
                efectivo: ticketTotal,
                products,
            })
        }

        return filtered
    }, []);

    console.log("CATALODO DE TICKETS", creditTickets, catalog);

    window.cash = 0;
    window.card = 0;
    window.deposit = 0;
    for (let i = 0; i < tickets.length; i++) {
        let ticket = tickets[i];

        if (typeof ticket[CASH] === "string") {
            window.cash += parseFloat(ticket[CASH].replace(/[^\d.]/g, ''));
        } else {
            window.cash += ticket[CASH];
        }

        if (typeof ticket[CARD] === "string") {
            const lol = parseFloat(ticket[CARD].replace(/[^\d.]/g, ''));

            if (lol) {
                window.card += lol;
            }
        } else {
            if (ticket[CARD]) {
                window.card += ticket[CARD];
            }
        }

        if (typeof ticket[DEPOSIT] === "string") {
            window.deposit += parseFloat(ticket[DEPOSIT].replace(/[^\d.]/g, ''));
        } else {
            window.deposit += ticket[DEPOSIT];
        }
    };

    document.getElementById("total-debit").innerHTML = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cash);

    document.getElementById("total-credit").innerHTML = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(card);

    document.getElementById("total-t").innerHTML = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(deposit);

    document.getElementById("total-f").innerHTML = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(totalGeneral);

    // document.getElementById("total-credit").innerHTML = "$" + card;
    // document.getElementById("total-t").innerHTML = "$" + deposit;
    // document.getElementById("total-f").innerHTML = "$" + totalGeneral;

    console.log("Totals: ", cash, card,  deposit);


    // window.catalog = tickets.map(pz => {
    //     let value = pz[30];
    //     if (typeof pz[30] === "string") {
    //         value = parseFloat(value.replace(/[^\d.]/g, ''));
    //     }

    //     const folio = parseFloat(pz[1]);

    //     return {name: pz[5], price: value}
    // });

    // let smt = [];
    // for (let i = 0; i < catalog.length; i++) {
    //     const isInCatalog = smt.findIndex(product => {
    //         return product.name === catalog[i].name
    //     });

    //     console.log(isInCatalog);

    //     if (isInCatalog === -1) {
    //         smt.push(catalog[i]);
    //     }
    // }

    // catalog = smt;

    // console.table(catalog);

    let test = catalog.map(ticket => Math.round(ticket.total));

    console.log("Weights: ", test);

    tValue = test;
    tWeight = test;
}

function fillTable(data, final=0) {
    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    let USDollar = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    data.forEach(item => {
        console.log("SE VA Y SE CORRE: ", item.total);

        const row = dataTable.row
            .add([
                '',
                item.folio,
                USDollar.format(item.total.toFixed(2)),
                // "$" + item.total,
            ])


        dataTable.draw(false)

        console.log("ID :", item.folio, row.node());
        row.node().setAttribute("id", item.folio);

        // Color the credit ticket background
        if (item.credit) {
            row.node().style.backgroundColor = "rgba(14, 116, 144, 0.4)";
        }

        console.log(row, row.node());
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

    const knapsackResult = unboundedKnapsackBetter(tValue,
        tWeight,
        parseFloat(Math.round(total)),
        parseFloat(totalTickets)
    );

    let result = knapsackResult;

    console.log("Result: ", result);

    let totalValue = 0;

    let final = result.selectedItems.map(idx => {
        console.log("Price: ", idx);

        let value = catalog[idx];

        totalValue += value.total;

        return {
            ...catalog[idx],
            folio: 1
        }
    });

    shuffleArray(final);

    console.log("El resultado es de ", final, " productos y ", totalTickets, "tickets");

    console.log("Total de efectivo y general: ", totalValue, value);

    if (totalValue < value) {
        console.log("test");
    }

    let finalTicket = [];
    final.forEach(ticket => {
        finalTicket.push({
            ...ticket,
            folio: myFolio
        });

        myFolio += 1;
    });

    return {finalTicket, totalValue};
};

function insertCredit(monto) {
    let test = creditTickets.map(ticket => Math.round(ticket.total));

    console.log("CREDIT: ", test, creditTickets);

    console.log("Calculating Credit Knapsack: ",
        test,
        parseFloat(monto),
        parseFloat(totalTickets)
    );

    const knapsackResult = unboundedKnapsackBetter(
        test,
        test,
        parseFloat(Math.round(monto)),
        parseFloat(totalTickets)
    );

    let result = knapsackResult;

    console.log("Credit Knapsack Result: ", result);

    let usedCreditTickets = 0;
    let final = result.selectedItems.map(idx => {
        console.log("Price: ", idx);

        let value = creditTickets[idx];

        totalValue += value.total;

        usedCreditTickets += 1;
        totalTickets--;
        total -= value.total;

        return {
            ...value,
            credit: value.total,
            folio: 1
        }
    });

    final.forEach(creditTicket => {
        creditTicket.folio = myFolio;

        myFolio += 1;
    });

    // creditTickets.every(item => {
    //     console.log(totalTickets);
    //     if (totalTickets <= 0) return false;
    //     console.log(totalValue, item.total, monto);
    //     if (totalValue + item.total > monto) return false;

    //     idk.push({...item, folio: myFolio, credit: true});
    //     usedCreditTickets++;

    //     myFolio += 1;
    //     total -= item.total;
    //     totalValue += item.total;
    //     totalTickets--;

    //     return true;
    // });

    console.log("Estos son los tickets finales de credito: ",
        final,
        usedCreditTickets,
        creditTickets.length
    );

    if (final.length === 0) {
        return false
    }

    if (final.length >= creditTickets.length) {
        canUseCashTickets = true;
    }

    return final
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

    document.getElementById("monto").value = "$0.00";
});

document.getElementById("volver").addEventListener('click', function(event) {
    dataTable.column(2).footer().innerHTML = 'Total:';

    document.getElementById("errors").innerHTML = "";

    fileInput.value = "";

    canUseCashTickets = false;

    document.getElementById("error").innerHTML = "";

    document.getElementById("print-button").hidden = true;

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
    canUseCashTickets = false;
    document.getElementById("errors").innerHTML = "";

    event.preventDefault();

    finalTicketList = [];
    dataTable.clear().draw();

    var table = document.getElementById("tickets");
    var body = table.getElementsByTagName("tbody")[0];

    body.innerHTML = "";

    window.totalValue = 0;

    const form = event.target;

    let monto = form.elements["monto"].value;
    let first = form.elements["inicial"].value;
    let last = form.elements["final"].value;

    monto = Number(monto.replace(/[^0-9.-]+/g,""));
    monto =  Math.round(monto);

    window.myFolio = parseFloat(first);
    const numberOfTickets = last - first + 1;
    window.totalTickets = numberOfTickets;

    console.log("Se quieren generar: ", totalTickets);

    if (first > last) {
        throwErrorAlert("Lo sentimos", "El folio inicial no puede ser mayor al final");

        return
    };
    
    if (totalTickets > reportTotalTickets) {
        throwErrorAlert("Lo sentimos", "El reporte no contiene tantos tickets para imprimir");

        return
    };

    window.total = monto + 200;

    let result = [];
    if (creditTickets.length > 0) {
        result = insertCredit(parseFloat(monto) + 200);

        if (result) {
            finalTicketList = finalTicketList.concat(result);
        }
    } else {
        canUseCashTickets = true;
    }

    let calcResult = {};
    if (canUseCashTickets) {
        if (result && totalTickets > 0) {
            console.log("CALCULANDO: ", total, totalTickets);

            calcResult = calc(total, tValue, tWeight, totalTickets);

        finalTicketList =  finalTicketList.concat(calcResult.finalTicket);
        }
    }

    console.log("TOTALES: ", finalTicketList, finalTicketList.length, totalTickets, numberOfTickets);

    if (finalTicketList.length < numberOfTickets) {
        throwErrorAlert("No se pueden generar los tickets",
                "Aumente el monto a cubrir para obtener la cantidad de tickets ingresados");

        return
    }

    finalTicketList.sort((a,b) => {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        console.log("SORTING REAL DATE: ", a.realDate, b.realDate);
        return a.realDate - b.realDate;
    });

    let currentFolio = parseFloat(first);
    finalTicketList.forEach(ticket => {
        ticket.folio = currentFolio;
        currentFolio++;
    });

    console.info("TICKETS FINALES: ", finalTicketList, calcResult.totalValue);

    // NOTE: Este error ocurre cuando los tickets generados no cubren la cantidad
    // deseada
    console.log("Al final hay: ", monto, calcResult.totalValue, totalValue);
    if (
        monto - (
        (calcResult.totalValue ? calcResult.totalValue : 0) +
        (totalValue ? totalValue : 0)
        ) > 200) {
        throwErrorAlert("test", "Aumente el número de tickets para cubrir el monto deseado.");

        return null
    }

    fillTable(finalTicketList, calcResult.totalValue);
    setTableTotal();

    showPrintButton();
});
