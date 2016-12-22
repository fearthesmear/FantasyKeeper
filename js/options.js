// Saves options to chrome.storage
function save_options() {
  var otherlabels = [];
  $("input[name^='trackedfield']").each(function(){
      console.log($(this).val());
      otherlabels.push($(this).val());
  })
  chrome.storage.sync.set({
    sheeturl: document.getElementById('sheeturl').value,
    worksheetnumber: document.getElementById('worksheetnumber').value,
    lastlabel: document.getElementById('lastlabel').value,
    firstlabel: document.getElementById('firstlabel').value,
    labelarray: otherlabels
  });
  // Show 'Saved' status for short time to indicate success
  document.getElementById('savedSpan').style.display = "inline";
  setTimeout(function() {
    document.getElementById('savedSpan').style.display = "none";;
}, 1000);

}

// Restores state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    sheeturl: 'Enter URL here',
    worksheetnumber: '1',
    lastlabel: 'Last',
    firstlabel: 'First',
    labelarray: []
  }, function(items) {
    document.getElementById('sheeturl').value = items.sheeturl;
    document.getElementById('worksheetnumber').value = items.worksheetnumber;
    document.getElementById('lastlabel').value = items.lastlabel;
    document.getElementById('firstlabel').value = items.firstlabel;

    var wrapper         = $(".input_fields_wrap"); //Fields wrapper
    for (i = 0; i < items.labelarray.length; i++){
        $(wrapper).append('<div><input type="text" size="30" name="trackedfield[]" value="' + items.labelarray[i] + '"/><a href="#" class="remove_field">Remove</a></div>'); //add input box
    }

  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('submit').addEventListener('click',
    save_options);

// Control addition fields box creation and removal
var max_fields      = 10; //maximum input boxes allowed
var wrapper         = $(".input_fields_wrap"); //Fields wrapper
var add_button      = $(".add_field_button"); //Add button ID

var x = 1; //initlal text box count
$(add_button).click(function(e){ //on add input button click
    e.preventDefault();
    if(x < max_fields){ //max input box allowed
        x++; //text box increment
        $(wrapper).append('<div><input type="text" size="30" name="trackedfield[]"/><a href="#" class="remove_field">Remove</a></div>'); //add input box
    }
});

$(wrapper).on("click",".remove_field", function(e){ //user click on remove text
    e.preventDefault(); $(this).parent('div').remove(); x--;
})
