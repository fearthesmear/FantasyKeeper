// Saves options to chrome.storage
function save_options() {
  chrome.storage.sync.set({
    sheetid: document.getElementById('sheetid').value,
    worksheetnumber: document.getElementById('worksheetnumber').value,
    lastlabel: document.getElementById('lastlabel').value,
    firstlabel: document.getElementById('firstlabel').value,
    costlabel: document.getElementById('costlabel').value,
    yearlabel: document.getElementById('yearlabel').value
  }, function() {
    // Update status to let user know options were saved.
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    sheetid: 'Enter ID here',
    worksheetnumber: '1',
    lastlabel: 'Last',
    firstlabel: 'First',
    costlabel: 'Cost',
    yearlabel: 'Year'
  }, function(items) {
    document.getElementById('sheetid').value = items.sheetid;
    document.getElementById('worksheetnumber').value = items.worksheetnumber;
    document.getElementById('lastlabel').value = items.lastlabel;
    document.getElementById('firstlabel').value = items.firstlabel;
    document.getElementById('costlabel').value = items.costlabel;
    document.getElementById('yearlabel').value = items.yearlabel;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('submit').addEventListener('click',
    save_options);
