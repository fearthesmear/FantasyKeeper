/*
* Loads and display additional player data from Google Sheets into ESPN FBB.
*/

// TODO: Deal with popup on button click.
// TODO: Reloading is too slow. I don't want to have to reload the google sheet
//       every time a page action happens. Either this is slowing it down or
//       the name match is slowing it down.

// Mutation obsrver settings.
var observerConfig = {
    childList: true,
    characterData: true,
    subtree: false  // Prevents infinite loop in MutationObserver after action
};
// Extension options. Global due to async loading from Chrome storage.
var sheetID = "";
var worksheetNumber = "";
var lastLabel = "";
var firstLabel = "";
var costLabel = "";
var yearLabel = "";


$(document).ready(function(){

    chrome.storage.sync.get(['sheetid', 'worksheetnumber', 'lastlabel', 'firstlabel',
                             'costlabel', 'yearlabel'], function(items) {
        sheetID = items.sheetid;
        worksheetNumber = items.worksheetnumber;
        lastLabel = items.lastlabel;
        firstLabel = items.firstlabel;
        costLabel = items.costlabel;
        yearLabel = items.yearlabel;
        importSheet( );
    }); // Async event due to .getJSON and Chrome storage retreival so need to
        // run rest of script from with .getJSON.

    addESPNEvents();
});

function addESPNEvents() {
    /**
    * Reruns importSheet() when a button is clicked on the page. If this is
    * done, then the page does not render when a button is clicked.
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
    /**
    * Get the Player Auction Values Google Sheet as JSON. Parse player auction
    * information into an array. Since get JSON is an async function, the
    * rest of the script that displays the player auction information will to
    * be called from within.
    */

    // Make sure it is public or set to anyone with link can view
    var url = "https://spreadsheets.google.com/feeds/list/" + sheetID + "/"+ worksheetNumber + "/public/full?alt=json";
    var rosterdb = [];
    var rosterdbpop = [];

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

        // Get the site players and match to rosterdb
        roster = get_fantasy_site_player_names();
        var site_player_db_info = [];
        for (i = 0; i < roster.length; i++) {
            site_player_db_info.push(match_player_site_to_rosterdb(rosterdb, roster[i]));
        }
        populate_site_player_table(site_player_db_info);
    });
}

function get_fantasy_site_player_names() {
    /**
    * Get the names of all players in the player table and return them in a
    * list.
    */

    roster = [];
    id = [];
    $('.playertablePlayerName').children([':first-child']).each(function () {
        if ($(this).text() !== "" && $(this).text() !== "PP" &&
            $(this).text() !== "DL15" && $(this).text() !== "DL60" &&
            $(this).text() !== "DL7" && $(this).text() !== "SSPD" &&
            $(this).text() !== "DTD" && $(this).text() !== "S")
        {
          roster.push($(this).text());
        }
    });
    return roster;
}

function match_player_site_to_rosterdb(rosterdb, site_player){
    /**
    * Return the rosterdb entry for the player on the fantasy site roster
    */

    var site_player_db_info = {
        cost: '--',
        year: '--'
    }
    // Break the site player name into first and last name
    index = site_player.indexOf(" ");
    first_name = site_player.substr(0, index);
    last_name = site_player.substr(index+1);

    // Perform the string matching and populate a data structure for each player
    var best_match_val = 0.0;
    for (j = 0; j < rosterdb.length; j++){
        a = FuzzySet();
        a.add(rosterdb[j].first + " " + rosterdb[j].last)
        b = a.get(site_player);
        if (b !== null && b[0][0] >= 0.925 && b[0][0] > best_match_val){
            site_player_db_info.cost = "$" + rosterdb[j].cost.toString();
            site_player_db_info.year = rosterdb[j].year;
            best_match_val = b[0][0];
        }
    }
    return site_player_db_info;
}

function populate_site_player_table(site_player_db_info){
    /**
    * Display additional player information from the roster database for all
    * players in the player table by adding additional td cells at the end
    * of each player's row.
    */

    // Expand the above row's column span and add additional column headings
    var header = $('.playerTableTable tr:nth-child(2) td:nth-child(2)').text();
    var col_width = $('.playerTableTable tr:nth-child(1) th:last-child').attr('colspan');
    col_width = parseInt(col_width);
    col_width = col_width + 2;
    col_width = col_width.toString();
    $('.playerTableTable tr:nth-child(1) th:last-child').attr('colspan', col_width);
    $('.playerTableTable tr:nth-child(2) td:last-child').after('<td width="25px">COST</td>');
    $('.playerTableTable tr:nth-child(2) td:last-child').after('<td width="25px">YEAR</td>');
    $('.playerTableBgRowTotals td:last-child').attr('colspan', col_width);

    ii = 0;
    $('tr.pncPlayerRow td:last-child').each(function(){
        if ($(this).parent().children("td:nth-child(2)").text() != '\xa0'){
            $(this).after('<td class="playertableData">' + String(site_player_db_info[ii].cost) + '</td>');
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
