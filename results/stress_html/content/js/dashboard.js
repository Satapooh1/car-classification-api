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

    var data = {"OkPercent": 54.56510893065026, "KoPercent": 45.43489106934974};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.07808082487942791, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0038035961272475795, 500, 1500, "POST /predict [200 users]"], "isController": false}, {"data": [0.021551724137931036, 500, 1500, "POST /predict [30 users]"], "isController": false}, {"data": [0.01092896174863388, 500, 1500, "POST /predict [50 users]"], "isController": false}, {"data": [0.003134796238244514, 500, 1500, "POST /predict [150 users]"], "isController": false}, {"data": [0.007334963325183374, 500, 1500, "POST /predict [100 users]"], "isController": false}, {"data": [0.08885542168674698, 500, 1500, "POST /predict [10 users]"], "isController": false}, {"data": [0.5203125, 500, 1500, "POST /predict [5 users]"], "isController": false}, {"data": [0.028901734104046242, 500, 1500, "POST /predict [20 users]"], "isController": false}, {"data": [0.013182674199623353, 500, 1500, "POST /predict [75 users]"], "isController": false}, {"data": [0.9978260869565218, 500, 1500, "POST /predict [1 user]"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 6013, 2732, 45.43489106934974, 6048.420256111766, 216, 19959, 4735.0, 13086.2, 14883.7, 18018.639999999992, 8.712207377485036, 1.5901852195293698, 12560.910626954197], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["POST /predict [200 users]", 1446, 1147, 79.3222683264177, 7204.755186721994, 335, 19959, 6217.5, 15532.4, 17775.8, 19216.239999999998, 20.485648712209223, 3.901822776471255, 29535.388983606877], "isController": false}, {"data": ["POST /predict [30 users]", 348, 0, 0.0, 5196.548850574717, 249, 6826, 5558.5, 6056.0, 6182.55, 6468.129999999999, 5.35796766743649, 0.9209006928406466, 7724.901035652425], "isController": false}, {"data": ["POST /predict [50 users]", 366, 0, 0.0, 8479.02459016393, 300, 10858, 8991.5, 10192.1, 10448.1, 10754.39, 5.3586331093249004, 0.9210150656652172, 7725.858227162669], "isController": false}, {"data": ["POST /predict [150 users]", 1276, 958, 75.07836990595611, 6631.918495297817, 369, 17407, 4904.5, 14935.499999999998, 15908.199999999999, 16869.6, 17.76070374700741, 3.365147054729692, 25606.668397848116], "isController": false}, {"data": ["POST /predict [100 users]", 818, 463, 56.60146699266504, 7232.86430317848, 234, 16232, 4257.0, 13575.1, 14033.35, 14910.24, 11.484731484731483, 2.1262943137943138, 16558.22471974816], "isController": false}, {"data": ["POST /predict [10 users]", 332, 0, 0.0, 1762.475903614457, 241, 2575, 1791.5, 2169.0, 2293.2999999999993, 2508.0800000000004, 5.408311205955659, 0.9295534885236287, 7797.4868330224635], "isController": false}, {"data": ["POST /predict [5 users]", 320, 0, 0.0, 909.9281250000005, 227, 1597, 908.0, 1258.2000000000003, 1351.8, 1554.3100000000018, 5.284713964856652, 0.9083102127097371, 7619.292854050032], "isController": false}, {"data": ["POST /predict [20 users]", 346, 0, 0.0, 3417.0231213872826, 235, 4384, 3556.0, 3994.1, 4128.25, 4295.019999999999, 5.501932036827961, 0.9456445688298059, 7932.465035872875], "isController": false}, {"data": ["POST /predict [75 users]", 531, 164, 30.88512241054614, 8553.75706214689, 305, 14394, 11428.0, 13368.8, 13918.4, 14261.679999999998, 7.440830682566596, 1.3327547188318878, 10727.885867194835], "isController": false}, {"data": ["POST /predict [1 user]", 230, 0, 0.0, 260.3826086956523, 216, 595, 249.0, 298.9, 327.45, 467.00999999999993, 3.8298864355413462, 0.6582617311086688, 5521.778608887418], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["503/Service Unavailable", 2732, 100.0, 45.43489106934974], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 6013, 2732, "503/Service Unavailable", 2732, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["POST /predict [200 users]", 1446, 1147, "503/Service Unavailable", 1147, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["POST /predict [150 users]", 1276, 958, "503/Service Unavailable", 958, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["POST /predict [100 users]", 818, 463, "503/Service Unavailable", 463, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["POST /predict [75 users]", 531, 164, "503/Service Unavailable", 164, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
