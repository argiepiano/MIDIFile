function RecorderObject(targetID) {
  var eventObjects = [];
  var recStartTime = 0, rAF;
  var that = this;
  
  this.startRecording =  function () {
    that.stopRecording();
  	console.log("Starting recording");
  	targetID.html("Recording...");
  	eventObjects = [];
    midiInput.onmidimessage = that.onMidiMessage;
    recStartTime = performance.now();
  }
  
  this.stopRecording =  function () {
    console.log("Stopping recording");
    targetID.html("Idle");
    midiInput.onmidimessage = null;
  }
  
  this.playEvents =  function () {
    that.stopRecording();
    curTime = performance.now();
    console.log("Playing...");
    targetID.html("Playing...");
    var eventPointer = 0;
    var startTime = performance.now();
    rAF = window.requestAnimationFrame(
      function queueEvents(timeStamp) {
        while (eventPointer<eventObjects.length && eventObjects[eventPointer].receivedTime < (timeStamp - startTime) + 150) {
          midiOutput&&midiOutput.send(eventObjects[eventPointer].data, startTime+eventObjects[eventPointer].receivedTime);
          eventPointer++;
        }
        if (eventPointer<eventObjects.length) {
          rAF = window.requestAnimationFrame(queueEvents);
        } else {
          that.stopEvents();
        }
      });
  }
  
  this.stopEvents = function () {
      that.stopRecording();
      window.cancelAnimationFrame(rAF);
      reset = [176, 123, 0];
      setTimeout(function() {midiOutput&&midiOutput.send(reset)}, 350);	
  }
  
  this.onMidiMessage = function (receivedEvent) {
    switch (event.data[0] & 0xf0) {
      case 0xF0:
        break;
	  default:
      eventObjects.push({data: receivedEvent.data, receivedTime: receivedEvent.receivedTime - recStartTime});
//	    console.log(eventObjects[eventObjects.length - 1]);
//            messageBox.value +=  receivedEvent.data[0] + " " + receivedEvent.data[1]+ " " + receivedEvent.data[2] +
//		" Time: " + receivedEvent.receivedTime  + "\n";
    }
  }
  this.createMIDIfile = function(){
    var encodedArray = that.encodeMIDIevents();
    var buffer = new Uint8Array(encodedArray.length);
    buffer.set(encodedArray);
    // first set create midi file object and track
    myMIDIFile = new MIDIFile();
    myMIDIFile.addTrack(1);
    myMIDIFile.tracks[1].setTrackContent(buffer);
    
    // then get the content (ArrayBuffer) and create a blob with its dataview array. Then save
    alert('cac');
    var dataView = new Uint8Array(myMIDIFile.getContent());
    var blob = new Blob( [dataView], { type: "application/x-midi"});
    var blobURL = URL.createObjectURL(blob);
    var save = document.createElement('a');
    save.href = blobURL;
    save.download = 'afile.mid';
    save.click();
    URL.revokeObjectURL(save.href);
  }
  
  
  this.encodeMIDIevents = function(){
    var destination = [];
    var indexDest = 0;
    var previousTime = 0.0;
    for (var i = 0; i<eventObjects.length; i++ ) {
      // Each midi clock is 2.6041 milliseconds at 120 quarters per minute, 192 clocks per quarter.
      var delta = Math.round((eventObjects[i].receivedTime - previousTime) / 2.6041);
      previousTime = eventObjects[i].receivedTime;
      
      // calculate Variable Length bytes
      if(delta >>> 21) {
        destination[indexDest++] = ((delta >>> 21) & 0x7F) | 0x80;
      } 
      if(delta >>> 14) {
        destination[indexDest++] = ((delta >>> 14) & 0x7F) | 0x80;
      }
      if(delta >>> 7) {
        destination[indexDest++] = ((delta >>> 7) & 0x7F) | 0x80;
      }
      destination[indexDest++] = (delta & 0x7F);
      
      destination[indexDest++] = eventObjects[i].data[0];
      if (eventObjects[i].data[1]) destination[indexDest++] = eventObjects[i].data[1];     
      if (eventObjects[i].data[2]) destination[indexDest++] = eventObjects[i].data[2];
    }
    // Adding the track end event
    destination[indexDest++] = 0x00; destination[indexDest++] = 0xFF; destination[indexDest++] = 0x2F; destination[indexDest++] = 0x00;
    console.log(destination);
    return destination;
  }
  

}


