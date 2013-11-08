// After loading freedom.js, the window is populated with a 'freedom'
// object, which is used as a message passing channel to the root module

// Controls the modal on the screen
// by default, the dropDownload and dropUrl elements are hidden
var Modal = {
  open: function() {
    $('#dropModal').modal('show');
    $("#dropDownload").hide();
    $("#dropUrl").hide();
  },
  displayMessage: function(val) {
    $("#dropMessage").text(val);
  },
  displayProgress: function(val) {
    $('#dropProgress').css('width' , val+"%");
  },
  displayUrl: function(val) {
    $("#dropUrl").show();
    $("#dropUrl").val(val);
  },
  displayDownload: function(val) {
    $("#dropDownload").show();
    var link = document.getElementById('dropDownload');
    link.href = val;
  },
  close: function () {
    $("#dropModal").modal('hide');
  }
};

// Controls file reads
var FileRead = {
  onError: function(evt) {
    var errorMsg = 'An error occurred while reading this file';
    switch(evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        errorMsg = 'File Not Found!';
        break;
      case evt.target.error.NOT_READABLE_ERR:
        errorMsg = 'File is not readable';
        break;
      case evt.target.error.ABORT_ERR:
        break; // noop
    }
    Modal.displayMessage(errorMsg);
  },
  onLoad: function(evt) {
    console.log("File Read Done");
    Modal.displayProgress(100);
    // Send data to be served. Expect a 'serve-url' response with our descriptor
    var key = Math.random() + "";
    window.freedom.emit('serve-data', {
      key: key,
      value: evt.target.result
    });
  },
  onProgress: function(evt) {
    if (evt.lengthComputable) {
      var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
      if (percentLoaded < 100) {
        Modal.displayProgress(percentLoaded);
      }
    }
  }
};

// Controls behavior of drag and drop to the screen
var DragNDrop = {
  within: false,
  onFile: function(e) {
    e = e || window.event; // get window.event if e argument missing (in IE)   
    if (e.preventDefault) { e.preventDefault(); } // stops the browser from redirecting off to the image.
    var dt = e.originalEvent.dataTransfer;
    var files = dt.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = FileRead.onLoad;
    reader.onerror = FileRead.onError;
    reader.onprogress = FileRead.onProgress;
    reader.onloadstart = function(evt) {
      //Get rid of the overlay
      DragNDrop.within = false;
      $("#drop").removeClass('overlaytext');
      Modal.open();
    };
    reader.readAsArrayBuffer(file);
    return false;
  },
  onEnter: function(e) {
    if (e.preventDefault) { e.preventDefault(); }
    DragNDrop.within = true;
    setTimeout(function() {DragNDrop.within=false;},0);
    $("#drop").addClass('overlaytext');
  },
  onLeave: function(e) {
    if (! DragNDrop.within) {
      $("#drop").removeClass('overlaytext');
    }
    DragNDrop.within = false;
  },
  onOver: function(e) {
    if (e.preventDefault) { e.preventDefault(); }
  }
};

// Controls the stats on the main page
var Stats = {
  initialize: function(key, displayUrl) {
    $("#statsHeader").show();
    var div = document.createElement('div');
    var input = document.createElement('input');
    input.className = 'input-xxlarge';
    input.type = 'text';
    input.readOnly = true;
    input.value = displayUrl;
    var stat = document.createElement('div');
    stat.id = key;
    div.appendChild(input);
    div.appendChild(stat);
    div.appendChild(document.createElement('br'));
    $("#stats").append(div);
  },
  update: function(val) {
    var elt = document.getElementById(val.key);
    while (elt.hasChildNodes()) {
      elt.removeChild(lastChild);
    }
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads in Progress: ' + val.inprogress)));
    elt.appendChild(document.createElement('br'));
    elt.appendChild(document.createElement('p').appendChild(document.createTextNode('Downloads Completed: ' + val.done)));
  }
};

window.onload = function() {
  // Get HTML5 stuff
  window.URL = window.URL || window.webkitURL;
  
  // Check for support
  if (!window.FileReader) {
    document.body.innerHTML = "Your browser does not support HTML5 FileReader";
    return;
  } else if (!window.URL) {
    document.body.innerHTML = "Your browser does not support window.URL";
    return;
  } else if (!window.Blob) {
    document.body.innerHTML = "Your browser does not support Blobs";
    return;
  }

  // Setup the modal's close button
  document.getElementById('closeModal').onclick = function() {
    Modal.close();
  };

  // Setup file drag and drop
  $(document.body).bind('dragenter', DragNDrop.onEnter);
  $(document.body).bind('dragover', DragNDrop.onOver);
  $(document.body).bind('dragleave', DragNDrop.onLeave);
  $(document.body).bind('drop', DragNDrop.onFile);

  // Setup FreeDOM listeners
  window.freedom.on('serve-descriptor', function(val) {
    var displayUrl = window.location + "#" + JSON.stringify(val);
    Modal.open();
    Modal.displayMessage("Share the following URL with your friends. Don't be a jerk, keep this tab open while file transfer is happening");
    Modal.displayUrl(displayUrl);
    Stats.initialize(val.key, displayUrl);
  });

  window.freedom.on('serve-error', function(val) {
    Modal.open();
    Modal.displayMessage(val);
  });

  window.freedom.on('download-progress', function(val) {
    //val is an integer with a percentage
    Modal.open();
    Modal.displayProgress(val);
  });
  
  window.freedom.on('download-data', function(val) {
    console.log("Download complete"); 
    Modal.open();
    var blob = new Blob([val]);
    Modal.displayMessage("Gotcha!");
    Modal.displayDownload(window.URL.createObjectURL(blob));
  });

  window.freedom.on('download-error', function(val) {
    Modal.open();
    Modal.displayMessage(val);
  });

  window.freedom.on('stats', Stats.update);

  // See if there's a hash with a descriptor we can download
  try {
    var hash = JSON.parse(window.location.hash.substr(1));
    Modal.open();
    Modal.displayMessage('Loading');
    freedom.emit('download', hash);
  } catch (e) {
    console.log("No parseable hash. Don't download");
  }
  // Hide the stats header at first
  $("#statsHeader").hide();   
};

