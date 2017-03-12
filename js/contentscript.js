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
var sheetURL = "";
var worksheetNumber = "";
var lastLabel = "";
var firstLabel = "";
var otherLables = [];
var numOtherLabels = 0;
var rosterdb = [];

$(document).ready(function(){

    chrome.storage.sync.get(['sheeturl', 'worksheetnumber', 'lastlabel', 'firstlabel',
                             'labelarray'], function(items) {
        sheetURL = items.sheeturl;
        worksheetNumber = items.worksheetnumber;
        lastLabel = items.lastlabel;
        firstLabel = items.firstlabel;
        otherLabels = items.labelarray;
        numOtherLabels = otherLabels.length;

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
    var split_sheet_url_string = sheetURL.split("/")
    var sheetid = split_sheet_url_string[5]
    var url = "https://spreadsheets.google.com/feeds/list/" + sheetid + "/"+ worksheetNumber + "/public/full?alt=json";
    var rosterdbpop = [];

    if (rosterdb.length == 0){
        $.getJSON(url, function(data) {
            console.log(data)
            for (i = 0; i < data.feed.entry.length; i++) {
                try {
                    var entry = {
                        first: eval("data.feed.entry[i].gsx$" + firstLabel.toLowerCase() + ".$t"),
                        last: eval("data.feed.entry[i].gsx$" + lastLabel.toLowerCase() + ".$t"),
                }
                } catch(e) {
                    if (e instanceof TypeError) {
                        alert('FantasyKeeper Error: Invalid PLAYER LAST NAME '
                              + 'COLUMN LABEL option specified or invalid '
                              + 'PLAYER FIRST NAME COLUMN LABEL option '
                              + 'specified. Check Options menu settings.');
                        throw new Error("Abort");
                    }
                }

                // Add the dynamic fields that are set in the options menu to
                // the player entry.
                for (j = 0; j < numOtherLabels; j++) {
                    try {
                        entry[otherLabels[j]] = eval("data.feed.entry[i].gsx$" + otherLabels[j].toLowerCase() + ".$t")
                    }
                    catch(e) {
                        if (e instanceof TypeError) {
                            alert('FantasyKeeper Error: ' + otherLabels[j]
                                  + ' is an invalid DISPLAY FIELD COLUMN '
                                  + 'LABEL. Check Options menu settings.');
                            throw new Error("Abort");
                        }
                    }
                }
                rosterdb.push(entry);

            }
            // Get the site players and match to rosterdb
            roster = get_fantasy_site_player_names();
            var site_player_db_info = [];
            for (i = 0; i < roster.length; i++) {
                site_player_db_info.push(match_player_site_to_rosterdb(roster[i]));
            }
            populate_site_player_table(site_player_db_info);
        })
        .fail(function(){alert("FantasyKeeper Error: Invalid Google Sheets URL, "
                               + "invalid Google Sheets sheet number, " +
                               "or Google Sheet Sharing Permissions not properly configured");
                         throw new Error("Abort");});
    } else {
        // Get the site players and match to rosterdb
        roster = get_fantasy_site_player_names();
        var site_player_db_info = [];
        for (i = 0; i < roster.length; i++) {
            site_player_db_info.push(match_player_site_to_rosterdb(roster[i]));
        }
        populate_site_player_table(site_player_db_info);
    }

}

function check_input(){
    alert("FantasyKeeper Error: Invalid Google Sheets URL or " +
          "Google Sheet Sharing Permissions not properly configured");
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
            $(this).text() !== "DL10" && $(this).text() !== "DL15" &&
            $(this).text() !== "DL60" && $(this).text() !== "DL7" &&
            $(this).text() !== "SSPD" && $(this).text() !== "DTD" &&
            $(this).text() !== "K"    && $(this).text() !== "S")
        {
          roster.push($(this).text());
        }
    });
    return roster;
}

function match_player_site_to_rosterdb(site_player){
    /**
    * Return the rosterdb entry for the player on the fantasy site roster
    */

    var site_player_db_info = {}
    var keyNames = Object.keys(rosterdb[0]);
    for(k = 2; k < keyNames.length; k++){
            site_player_db_info[keyNames[k].toLowerCase()] = '--';
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
            // Get the dynamic fields and add them as fields to
            // site_player_db_info
            var keyNames = Object.keys(rosterdb[j]);
            for(k = 2; k < keyNames.length; k++){
                    site_player_db_info[keyNames[k].toLowerCase()] = rosterdb[j][keyNames[k]];
            }
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
    col_width = col_width + numOtherLabels;
    col_width = col_width.toString();
    $('.playerTableTable tr:nth-child(1) th:last-child').attr('colspan', col_width);
    var keyNames = Object.keys(site_player_db_info[0]);
    for (i = keyNames.length - 1; i >= 0; i--){
        // TODO: Set width based on column name length
        $('.playerTableTable tr:nth-child(2) td:last-child').after('<td width="25px">' + keyNames[i].toUpperCase() + '</td>');
    }

    $('.playerTableBgRowTotals td:last-child').attr('colspan', col_width);

    // Populate the players
    ii = 0;
    $('tr.pncPlayerRow td:last-child').each(function(){
        if ($(this).parent().children("td:nth-child(2)").text() != '\xa0'){
            for (k = 0; k < keyNames.length; k++){
                $(this).after('<td class="playertableData">' + String(site_player_db_info[ii][keyNames[k]]) + '</td>');
            }
            ii = ii + 1;
        }
        else{
            for (m = 0; m < keyNames.length; m++){
                $(this).after('<td class="playertableData">--</td>');
            }
        }
    })

}
