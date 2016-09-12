/*!
*
*
*/

// TODO: Fuzzy name matching. Maybe a percentage match? fuzzyset.js
// TODO: How do I handle spaces in last names like Jr or Names like Byung
//       Ho Park?
// In Google Sheets how to autopopulate
//    =CONCATENATE(ImportRange("1NjCm1SodkaagsRXvHM4BrThg1pM4d_DYxSC_Cibe1Ds","2016!B2"), ", ", (ImportRange("1NjCm1SodkaagsRXvHM4BrThg1pM4d_DYxSC_Cibe1Ds","2016!C2")))
// TODO: Make extra data column names configurable to make more general.

var observerConfig = {
    childList: true,
    characterData: true,
    subtree: false  // Prevents infinite loop in MutationObserver
};
var sheetID = "";
var lastLabel = "";
var firstLabel = "";
var costLabel = "";
var yearLabel = "";


$(document).ready(function(){

    chrome.storage.sync.get(['sheetid', 'lastlabel', 'firstlabel', 'costlabel',
                             'yearlabel'], function(items) {
        sheetID = items.sheetid
        lastLabel = items.lastlabel
        firstLabel = items.firstlabel
        costLabel = items.costlabel
        yearLabel = items.yearlabel
        importSheet( );
    }); // Async event due to .getJSON and Chrome storage retreival so need to
      // run rest of script from with .getJSON.

    addESPNEvents();
});

function addESPNEvents() {
    /* Reruns importSheet() when a button is clicked on the page. If this is
       done, then the page does not render when a button is clicked.
    */

    var target = document.querySelector('.playerTableContainerDiv');

    var observerESPN = new MutationObserver(function (mutations) {
        observerESPN.disconnect();
        if (mutations.length > 0) {
            importSheet();
        }
        observerESPN.observe(target, observerConfig);
    });
    observerESPN.observe(target, observerConfig);
}

function importSheet(items){
    /* Get the Player Auction Values Google Sheet as JSON. Parse player auction
     * information into an array. Since get JSON is an async function, the
     * rest of the script that displays the player auction information will to
     * be called from within.
     */

    // ID of the Google Spreadsheet
    var worksheetID = 1;

    // Make sure it is public or set to Anyone with link can view
    var url = "https://spreadsheets.google.com/feeds/list/" + sheetID + "/1/public/full?alt=json";

    var rosterdb = [];
    var rosterdbpop = [];

    if rosterdb.length == 0

    $.getJSON(url, function(data) {
        for (i = 0; i < data.feed.entry.length; i++) {
            var entry = {
                first: eval("data.feed.entry[i].gsx$" + firstLabel.toLowerCase() + ".$t"),
                last: eval("data.feed.entry[i].gsx$" + lastLabel.toLowerCase() + ".$t"),
                team: data.feed.entry[i].gsx$team.$t,
                position: data.feed.entry[i].gsx$position.$t,
                mlb: data.feed.entry[i].gsx$mlb.$t,
                year: eval("data.feed.entry[i].gsx$" + yearLabel.toLowerCase() + ".$t"),
                cost: eval("data.feed.entry[i].gsx$" + costLabel.toLowerCase() + ".$t"),
                minors: data.feed.entry[i].gsx$minors.$t,
            }
            rosterdb.push(entry);
        }
        console.log(rosterdb)
        // Get the site players and match to rosterdb
        roster = get_fantasy_site_player_names();
        var site_player_db_info = [];

        for (i = 0; i < roster.length; i++) {
            site_player_db_info.push(match_player_site_to_rosterdb(rosterdb, roster[i]));
            console.log(roster[i] + " costs " + site_player_db_info.cost +
                        " and was signed in " + site_player_db_info.year);
        }
        populate_site_player_table(site_player_db_info);

    });
}

function get_fantasy_site_player_names() {

    roster = [];
    id = [];
    $('.playertablePlayerName').children([':first-child']).each(function () {
        //console.log($(this).text());
        if ($(this).text() !== "" && $(this).text() !== "PP" &&
            $(this).text() !== "DL15" && $(this).text() !== "DL60" &&
            $(this).text() !== "DL7" && $(this).text() !== "SSPD" &&
            $(this).text() !== "DTD" && $(this).text() !== "S")
        {
          roster.push($(this).text());
          // Example of changing text
          //$(this).append(", ($1, 2016)")
          $(this).append("")
        }
        //$("<a>hi</a>").insertAfter($(this));
    });

    // Example of getting attribute
    $('.playertablePlayerName').children([':first-child']).each(function () {
        //console.log($(this).text());
        id.push($(this).attr("playerid"));
    });
    //console.log(roster);
    //console.log(id);
    return roster;
}

function match_player_site_to_rosterdb(rosterdb, site_player){
    /* Return the rosterdb entry for the player on the fantasy site roster
    */
    // Break the site player name into first and last name
    // TODO: How do I handle spaces in last names like JR or Names like Byung
    //       Ho Park?
    var site_player_db_info = {
        cost: '0',
        year: '--'
    }
    index = site_player.indexOf(" ");
    first_name = site_player.substr(0, index);
    last_name = site_player.substr(index+1);

    for (j = 0; j < rosterdb.length; j++){
        // Match site_player's last name to rosterdb player.
        var site_player_last_name = new RegExp(last_name);
        var result_last = site_player_last_name.test(rosterdb[j].last)
        if(result_last){
            //console.log("Matched " + last_name + " to " + rosterdb[j].last);
            // If the last name matched, see if the first name matches
            var site_player_first_name = new RegExp(first_name);
            var result_first = site_player_first_name.test(rosterdb[j].first)
            if(result_first){
                //console.log("Matched " + first_name + " " + last_name + " to " +
                //            rosterdb[j].first + " " + rosterdb[j].last);
                site_player_db_info.cost = rosterdb[j].cost;
                site_player_db_info.year = rosterdb[j].year;
                return site_player_db_info;
            }
        }
    }
    return site_player_db_info;
}

function populate_site_player_table(site_player_db_info){

    var header = $('.playerTableTable tr:nth-child(2) td:nth-child(2)').text();
    $('.playerTableTable tr:nth-child(1) th:last-child').attr('colspan', '5') // TODO: In other tabs this is not wide enough.
                                                                              //       Need a way to figure out width of row below
                                                                              //       and use that.
    $('.playerTableTable tr:nth-child(2) td:last-child').after('<td width="25px">COST</td>');
    $('.playerTableTable tr:nth-child(2) td:last-child').after('<td width="25px">YEAR</td>');

    ii = 0;
    $('tr.pncPlayerRow td:last-child').each(function(){
        // TODO: Can't just check for dashes. Doesn't work for all tabs.
        if ($(this).parent().children("td:nth-child(2)").text() != '\xa0'){
            $(this).after('<td class="playertableData">$' + String(site_player_db_info[ii].cost) + '</td>');
            ii = ii + 1;
        }
        else{
            $(this).after('<td class="playertableData">--</td>');
        }
    })
    ii = 0;
    $('tr.pncPlayerRow td:last-child').each(function(){
        if ($(this).parent().children("td:nth-child(2)").text() != '\xa0'){
            $(this).after('<td class="playertableData">' + String(site_player_db_info[ii].year) + '</td>');
            ii = ii + 1;
        }
        else{
            $(this).after('<td class="playertableData">--</td>');
        }
    })

}
