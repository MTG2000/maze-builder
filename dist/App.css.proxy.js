// [snowpack] add styles to the page (skip if no document exists)
if (typeof document !== 'undefined') {
  const code = "/* @import url('https://fonts.googleapis.com/css2?family=Modak&display=swap'); */\r\n\r\n* {\r\n  box-sizing: border-box;\r\n}\r\n\r\n@font-face {\r\n  font-family: 'Modak';\r\n  src: url('/fonts/Modak.woff2') format('woff2'),\r\n    url('/fonts/Modak.woff') format('woff'),\r\n    url('/fonts/Modak.ttf') format('truetype');\r\n  font-weight: normal;\r\n  font-style: normal;\r\n  font-display: swap;\r\n}\r\n\r\nbody {\r\n  padding: 0;\r\n  margin: 0;\r\n  /* font-family: , cursive; */\r\n}\r\n\r\n.sr-only {\r\n  position: absolute;\r\n  left: -10000px;\r\n  top: auto;\r\n  width: 1px;\r\n  height: 1px;\r\n  overflow: hidden;\r\n}\r\n";

  const styleEl = document.createElement("style");
  const codeEl = document.createTextNode(code);
  styleEl.type = 'text/css';

  styleEl.appendChild(codeEl);
  document.head.appendChild(styleEl);
}