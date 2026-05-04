/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 36.47863247863248, "KoPercent": 63.52136752136752};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0105982905982906, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "POST /predict [200 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [30 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [50 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [150 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [100 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [10 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [5 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [20 users]"], "isController": false}, {"data": [0.0, 500, 1500, "POST /predict [75 users]"], "isController": false}, {"data": [0.49206349206349204, 500, 1500, "POST /predict [1 user]"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 2925, 1858, 63.52136752136752, 13920.79692307691, 692, 66003, 9419.0, 31569.800000000003, 35867.9, 39907.11999999998, 3.554001380289083, 2.6722431011365515, 4687.899842953767], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["POST /predict [200 users]", 866, 723, 83.48729792147806, 13666.942263279454, 3698, 66003, 7785.5, 30019.4, 35227.1, 46781.930000000146, 8.976325718313362, 6.058278904857167, 12239.535387201222], "isController": false}, {"data": ["POST /predict [30 users]", 134, 0, 0.0, 14452.462686567169, 3687, 19757, 15387.5, 18150.0, 18517.75, 19414.000000000007, 1.8104438289535905, 0.9264380530973452, 2610.2699700863], "isController": false}, {"data": ["POST /predict [50 users]", 162, 0, 0.0, 21656.012345679024, 4162, 28763, 24293.5, 25679.0, 26141.75, 28376.180000000004, 1.9317219751260986, 0.9884983544590582, 2785.127196383536], "isController": false}, {"data": ["POST /predict [150 users]", 754, 668, 88.59416445623341, 12371.395225464192, 3429, 52151, 7604.5, 30016.0, 32584.75, 38895.450000000084, 8.07228657687943, 6.621672122240541, 10372.780031278102], "isController": false}, {"data": ["POST /predict [100 users]", 452, 376, 83.1858407079646, 14307.362831858412, 3483, 42330, 9323.0, 35860.9, 36021.7, 37272.05, 4.964741547857033, 4.933784853419301, 5907.008900253454], "isController": false}, {"data": ["POST /predict [10 users]", 80, 0, 0.0, 7691.812500000001, 6830, 10272, 7411.5, 8953.300000000001, 9763.85, 10272.0, 1.1907065354904967, 0.6093068599580276, 1716.74353157977], "isController": false}, {"data": ["POST /predict [5 users]", 100, 0, 0.0, 2976.3899999999994, 1795, 4966, 2953.0, 3411.7, 3613.5499999999997, 4965.179999999999, 1.602923732888789, 0.820246128939185, 2311.071503797927], "isController": false}, {"data": ["POST /predict [20 users]", 104, 0, 0.0, 12221.192307692314, 8958, 17201, 12101.5, 13534.0, 15087.5, 17168.25, 1.4584618836596173, 0.7463222920289447, 2102.78881807178], "isController": false}, {"data": ["POST /predict [75 users]", 210, 91, 43.333333333333336, 25707.133333333324, 8794, 37680, 33065.5, 36205.4, 36815.549999999996, 37676.9, 2.191289104075798, 2.2758061791744058, 2542.5392149445915], "isController": false}, {"data": ["POST /predict [1 user]", 63, 0, 0.0, 958.8730158730159, 692, 3942, 903.0, 1084.0, 1110.8, 3942.0, 1.0419595455071697, 0.533190236177497, 1502.2805463155153], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["503/Service Unavailable", 1609, 86.59849300322928, 55.00854700854701], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 249, 13.40150699677072, 8.512820512820513], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 2925, 1858, "503/Service Unavailable", 1609, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 249, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["POST /predict [200 users]", 866, 723, "503/Service Unavailable", 676, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 47, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["POST /predict [150 users]", 754, 668, "503/Service Unavailable", 586, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 82, "", "", "", "", "", ""], "isController": false}, {"data": ["POST /predict [100 users]", 452, 376, "503/Service Unavailable", 297, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 79, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["POST /predict [75 users]", 210, 91, "503/Service Unavailable", 50, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 41, "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
