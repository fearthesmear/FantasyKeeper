/*!
*
*
*/

var elements = document.getElementsByTagName('*');


// Traverse the DOM and search for text
for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    console.log(element)
    for (var j = 0; j < element.childNodes.length; j++) {
        var node = element.childNodes[j];

        if (node.nodeType === 3) {
            var text = node.nodeValue;
            var replacedText = text.replace(/Murphy/gi, 'God');

            if (replacedText !== text) {
                //element.replaceChild(document.createTextNode(replacedText), node);
            }
        }
    }
}

$(document).ready(function(){

   // jQuery methods go here...
   printnames();

});

function printnames() {
    roster = []
    id = []
    $('.playertablePlayerName').children([':first-child']).each(function () {
        //console.log($(this).text());
        if ($(this).text() !== "" && $(this).text() !== "PP" && $(this).text() !== "DL15" && $(this).text() !== "DL60"){
          roster.push($(this).text());
          // Example of changing text
          //$(this).text("Mark Smearcheck");
          $(this).append(", 2016 $1")
        }
    });
    // Example of getting attribute

    $('.playertablePlayerName').children([':first-child']).each(function () {
        //console.log($(this).text());
        id.push($(this).attr("playerid"));
    });
    console.log(roster);
    console.log(id);
}
