// new SpeechSynthesisUtterance object
var texts = [];
var iCurrent = 0;
var voices = getVoices();

function getVoices(lang = 'es') {
  if (lang)
    return speechSynthesis.getVoices().filter((x) => x.lang.indexOf(lang) >= 0);
  else return speechSynthesis.getVoices();
}

function populateVoiceList() {
  if (typeof speechSynthesis === 'undefined') {
    return;
  }

  let voices = getVoices();

  for (var i = 0; i < voices.length; i++) {
    var option = document.createElement('option');
    option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

    if (voices[i].default) {
      option.textContent += ' -- DEFAULT';
    }

    option.value = i;
    option.setAttribute('data-lang', voices[i].lang);
    option.setAttribute('data-name', voices[i].name);
    document.getElementById('voiceSelect').appendChild(option);
  }
}

function Speak() {
  if (texts.length == 0) {
    /*let childs = document.getElementById('body').children;
    for (let i = 0; i < childs.length; i++) {
      let p = childs[i].innerText.split('.');
      for (let j = 0; j < p.length; j++) {
        if (p[j].length > 0) {
          let c = p[j].split(',');
          if (c.length > 0) {
            for (let k = 0; k < c.length; k++) {
              texts.push(c[k]);
            }
          } else {
            texts.push(p[j]);
          }
        }
      }
    }*/

    let childs = document.getElementById('body').children;
    for (let i = 0; i < childs.length; i++) {
      let buffer = '';
      for (let j = 0; j < childs[i].childNodes.length; j++) {
        if (childs[i].childNodes[j].nodeType == 3) {
          if (childs[i].childNodes[j].length > 0)
            buffer += childs[i].childNodes[j].nodeValue;
        } else if (childs[i].childNodes[j].childNodes.length > 0)
          buffer += getTextFromNode(childs[i].childNodes[j]);
      }
      texts.push({
        nodes: getTextNodes(childs[i]), //childs[i].childNodes,
        texto: replaceChars(buffer),
      });
    }
  }
  document.getSelection().removeAllRanges();
  iCurrent = 0;
  StarSpeak();
}

function getTextNodes(parent) {
  var all = [];
  for (parent = parent.firstChild; parent; parent = parent.nextSibling) {
    if (['SCRIPT', 'STYLE'].indexOf(parent.tagName) >= 0) continue;
    if (parent.nodeType === Node.TEXT_NODE) all.push(parent);
    else all = all.concat(getTextNodes(parent));
  }
  return all;
}

function getTextFromNode(ndx) {
  let buffer = '';
  for (let i = 0; i < ndx.childNodes.length; i++) {
    if (ndx.childNodes[i].nodeType == 3) buffer += ndx.childNodes[i].nodeValue;
    else if (ndx.childNodes[i].childNodes.length > 0)
      buffer += getTextFromNode(ndx.childNodes[i]);
  }

  return buffer;
}

function replaceChars(strNode) {
  return strNode.replace(/(\n)+/g, ' ');
}

var utter = new SpeechSynthesisUtterance();
var currentCharIndex = undefined;
var extendIndex = undefined;
var startNode = null;
var endNode = null;
function StarSpeak() {
  currentCharIndex = undefined;

  // event after text has been spoken
  utter.onend = function () {
    iCurrent = iCurrent + 1;
    startNode = null;

    if (iCurrent < texts.length) SpeakLine();
  };

  utter.onboundary = function (event) {
    //console.log(event.name + ' boundary CharIndex: ' + event.charIndex);

    if (event.name === 'sentence') {
      return;
    }

    let ndxs = texts[iCurrent].nodes;

    startNode = findNode(ndxs, event.charIndex);
    currentCharIndex = event.charIndex;

    let sumLen = lenNodes(ndxs, 0, ndxs.indexOf(startNode));
    if (sumLen < event.charIndex) {
      currentCharIndex = currentCharIndex - sumLen;
    }

    if (texts[iCurrent].texto.indexOf(' ', event.charIndex) >= 0)
      extendIndex = texts[iCurrent].texto.indexOf(' ', event.charIndex) + 1;
    else if (texts[iCurrent].texto.indexOf(',', event.charIndex) >= 0)
      extendIndex = texts[iCurrent].texto.indexOf(',', event.charIndex) + 1;

    endNode = findNode(ndxs, extendIndex);

    let x = lenNodes(ndxs, 0, ndxs.indexOf(endNode));
    if (x > 0) extendIndex = extendIndex - x;

    if (startNode && endNode) {
      let selection = window.getSelection();
      selection.removeAllRanges();
      let r = document.createRange();
      r.setStart(startNode, currentCharIndex);
      r.setEnd(endNode, extendIndex);
      selection.addRange(r);

      startNode = null;
      endNode = null;
      currentCharIndex = event.charIndex;
    }
  };

  SpeakLine();
}

function SpeakLine() {
  let voices = getVoices();
  let v = document.getElementById('voiceSelect');
  utter.voice = voices[v.value];
  utter.lang = 'es-CO';
  utter.text = texts[iCurrent].texto;
  utter.volume = 1.0;
  utter.rate = document.getElementById('rate').value;
  utter.pitch = document.getElementById('pitch').value;

  speechSynthesis.speak(utter); // speak
}

function lenNodes(all, start, end) {
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += all[i].length;
  }

  return sum;
}

function findNode(ndx, index) {
  let sum = 0;
  for (let i = 0; i < ndx.length; i++) {
    sum += ndx[i].length;
    if (sum >= index) return ndx[i];
  }
}

function Stop(action) {
  if (action === 'C') {
    iCurrent = texts.length + 1;
    speechSynthesis.cancel();
  } else if (action === 'R') speechSynthesis.resume();
  else if (action === 'P') speechSynthesis.pause();
}

function SpeechLine(current) {
  let selection = window.getSelection();
  selection.removeAllRanges();

  let all = document.getElementById('body').children;
  let r = document.createRange();

  r.setStart(all[0].childNodes[0], 46);
  r.setEnd(all[0].childNodes[2], 2);
  console.log(all[0].childNodes[0].nodeValue);
  selection.addRange(r);
}
