const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// CSS fixes
html = html.replace(
  '.app{display:flex;flex-direction:column;height:100%;height:-webkit-fill-available;width:100%;overflow:hidden}',
  '.app{display:flex;flex-direction:column;height:var(--vv-height, 100%);width:100%;overflow:hidden}'
);
html = html.replace(
  '.overlay{display:none;position:fixed;inset:0;background:rgba(15,26,15,0.6);z-index:200;align-items:flex-end;justify-content:center}',
  '.overlay{display:none;position:fixed;top:0;left:0;right:0;height:var(--vv-height, 100%);background:rgba(15,26,15,0.6);z-index:200;align-items:flex-end;justify-content:center}'
);
html = html.replace(
  '.sheet{background:var(--paper);border-radius:20px 20px 0 0;width:100%;max-width:600px;max-height:90vh;max-height:90dvh;display:flex;flex-direction:column;overflow:hidden;animation:su 0.3s cubic-bezier(0.34,1.26,0.64,1)}',
  '.sheet{background:var(--paper);border-radius:20px 20px 0 0;width:100%;max-width:600px;max-height:calc(var(--vv-height, 100%) - env(safe-area-inset-top, 0px) - 14px);display:flex;flex-direction:column;overflow:hidden;animation:su 0.3s cubic-bezier(0.34,1.26,0.64,1)}'
);
html = html.replace(
  '.keyboard-open .sheet{max-height:calc(100dvh - var(--keyboard-height) - env(safe-area-inset-top,0px) - 14px) !important}',
  ''
);

// JS Keyboard handling
html = html.replace(
  /function setupKeyboardHandling\(\)\{[\s\S]*?lastH=h;\s*\}\);\s*document\.addEventListener\('focusin',function\(e\)\{/m,
  `function setupKeyboardHandling(){\n  if(!window.visualViewport)return;\n  function updateVV(){ document.documentElement.style.setProperty('--vv-height', window.visualViewport.height + 'px'); }\n  window.visualViewport.addEventListener('resize', updateVV);\n  updateVV();\n  document.addEventListener('focusin',function(e){`
);

// HTML Removes
html = html.replace('        <div class=\"fg\"><label class=\"fl\">Kitchen items</label><input class=\"fi\" id=\"qs-kit\" placeholder=\"e.g. microwave, pan\"/></div>\r\n', '');
html = html.replace('        <div class=\"fg\"><label class=\"fl\">Kitchen items</label><input class=\"fi\" id=\"qs-kit\" placeholder=\"e.g. microwave, pan\"/></div>\n', '');

html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen items</label><input class=\"fi\" id=\"rs-kit\" placeholder=\"e.g. microwave, oven\"/></div>\r\n', '');
html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen items</label><input class=\"fi\" id=\"rs-kit\" placeholder=\"e.g. microwave, oven\"/></div>\n', '');

html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen appliances</label><div class=\"cwrap\" id=\"nr-appliances\"></div></div>\r\n', '');
html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen appliances</label><div class=\"cwrap\" id=\"nr-appliances\"></div></div>\n', '');

html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen items needed</label><input class=\"fi\" id=\"st-kit\" placeholder=\"e.g. microwave, pan, bottle warmer\"/></div>\r\n', '');
html = html.replace('      <div class=\"fg\"><label class=\"fl\">Kitchen items needed</label><input class=\"fi\" id=\"st-kit\" placeholder=\"e.g. microwave, pan, bottle warmer\"/></div>\n', '');

html = html.replace(/      <div class=\"fg\">\r?\n\s*<label class=\"fl\">My kitchen appliances<\/label>\r?\n\s*<div style=\"[^\"]*\">Tick what you own.*?<\/div>\r?\n\s*<div class=\"cwrap\" id=\"prof-app\"><\/div>\r?\n\s*<\/div>\r?\n/m, '');

// JS App removing usages of missingApp
html = html.replace(/        var missingInPlan=getMissingAppliances\(r\);\r?\n\s*if\(missingInPlan\.length\)\{info\.appendChild\(mkEl\('div','meal-warn','.*? Needs: '\+missingInPlan\.map\(function\(id\)\{var ap=ALL_APPLIANCES\.find\(function\(a\)\{return a\.id===id;\}\);return ap\?ap\.name:id;\}\)\.join\(', '\)\)\);\}/, '');

html = html.replace(/  var missingApp=getMissingAppliances\(r\);\r?\n\s*if\(missingApp\.length\)\{var aw=document\.createElement\('div'\);aw\.className='app-warn';var awI=document\.createElement\('span'\);awI\.textContent='.*?';var awT=document\.createElement\('span'\);awT\.textContent='May need: '\+missingApp\.map\(function\(id\)\{var ap=ALL_APPLIANCES\.find\(function\(a\)\{return a\.id===id;\}\);return ap\?ap\.emoji\+' '\+ap\.name:id;\}\)\.join\(', '\);aw\.appendChild\(awI\);aw\.appendChild\(awT\);card\.appendChild\(aw\);\}/, '');

html = html.replace(/  var neededApp=getRecipeAppliances\(r\);\r?\n\s*if\(neededApp\.length\)\{[\s\S]*?    cont\.appendChild\(appRow\);\r?\n\s*\}/, '');


fs.writeFileSync('index.html', html);
console.log('Replacements complete');
